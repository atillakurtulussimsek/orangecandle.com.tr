import crypto from 'crypto';

interface ParamPOSConfig {
  clientCode: string;
  clientUsername: string;
  clientPassword: string;
  guid: string;
  baseUrl: string;
}

interface PaymentRequest {
  orderId: string;
  amount: number;
  cardNumber?: string;
  cardExpiry?: string; // MMYY
  cardCvv?: string;
  cardHolderName?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  installment?: number;
  cardPhone?: string;
  successUrl?: string;
  failUrl?: string;
  ipAddress?: string;
  description?: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  orderId?: string;
  message?: string;
  errorCode?: string;
  result?: any;
  redirectUrl?: string; // For 3D Secure
}

export class ParamPOSService {
  private config: ParamPOSConfig;

  constructor() {
    this.config = {
      clientCode: process.env.PARAMPOS_CLIENT_CODE || '10738',
      clientUsername: process.env.PARAMPOS_CLIENT_USERNAME || 'Test',
      clientPassword: process.env.PARAMPOS_CLIENT_PASSWORD || 'Test',
      guid: process.env.PARAMPOS_GUID || '0c13d406-873b-403b-9c09-a5766840d98c',
      baseUrl: process.env.PARAMPOS_URL || 'https://testposws.param.com.tr/turkpos.ws/service_turkpos_prod.asmx',
    };
  }

  /**
   * ParamPOS HASH oluşturma (SHA1 + Base64 + ISO-8859-9)
   */
  private generateHash(data: string): string {
    const buffer = Buffer.from(data, 'latin1');
    const hash = crypto.createHash('sha1').update(buffer).digest('base64');
    return hash;
  }

  /**
   * Tutar formatı (Türk lirası formatı: 1.234,56)
   */
  private formatAmount(amount: number): string {
    return amount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /**
   * XML Request oluşturma
   */
  private createXMLRequest(method: string, params: any): string {
    const xmlParams = Object.keys(params)
      .map(key => {
        const value = params[key];
        if (typeof value === 'object' && value !== null) {
          const innerXml = Object.keys(value)
            .map(innerKey => `<${innerKey}>${value[innerKey]}</${innerKey}>`)
            .join('');
          return `<${key}>${innerXml}</${key}>`;
        }
        return `<${key}>${value || ''}</${key}>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="https://turkpos.com.tr/">
      ${xmlParams}
    </${method}>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * XML Response parse etme
   */
  private parseXMLResponse(xml: string, method: string): any {
    try {
      const resultTag = `${method}Result`;
      const regex = new RegExp(`<${resultTag}>(.*?)</${resultTag}>`, 's');
      const match = xml.match(regex);
      
      if (!match) return null;

      const result: any = {};
      const content = match[1];
      
      // Parse XML tags
      const tagRegex = /<(\w+)>([^<]*)<\/\1>/g;
      let tagMatch;
      
      while ((tagMatch = tagRegex.exec(content)) !== null) {
        result[tagMatch[1]] = tagMatch[2];
      }

      return result;
    } catch (error) {
      console.error('XML Parse Error:', error);
      return null;
    }
  }

  /**
   * SOAP Request gönderme
   */
  private async sendSOAPRequest(method: string, params: any): Promise<any> {
    const xml = this.createXMLRequest(method, params);

    console.log('=== SOAP REQUEST ===');
    console.log('Method:', method);
    console.log('URL:', this.config.baseUrl);
    console.log('XML:', xml);

    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `https://turkpos.com.tr/${method}`,
        },
        body: xml,
      });

      const responseText = await response.text();
      
      console.log('=== SOAP RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Response Text:', responseText);
      
      return this.parseXMLResponse(responseText, method);
    } catch (error) {
      console.error('SOAP Request Error:', error);
      throw error;
    }
  }

  /**
   * Ödeme işlemi (Non-3D)
   */
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      const {
        orderId,
        amount,
        cardNumber,
        cardExpiry,
        cardCvv,
        cardHolderName,
        installment = 1,
        cardPhone = '',
        ipAddress = '127.0.0.1',
        description = '',
      } = paymentData;

      const formattedAmount = this.formatAmount(amount);
      const totalAmount = this.formatAmount(amount);

      // HASH oluşturma
      const hashData = `${this.config.clientCode}${this.config.guid}${installment}${formattedAmount}${totalAmount}${orderId}`;
      const hash = this.generateHash(hashData);

      // Card expiry parse (MMYY)
      const expiryMonth = cardExpiry.substring(0, 2);
      const expiryYear = cardExpiry.substring(2, 4);

      const params = {
        G: {
          CLIENT_CODE: this.config.clientCode,
          CLIENT_USERNAME: this.config.clientUsername,
          CLIENT_PASSWORD: this.config.clientPassword,
        },
        GUID: this.config.guid,
        KK_Sahibi: cardHolderName,
        KK_No: cardNumber.replace(/\s/g, ''),
        KK_SK_Ay: expiryMonth,
        KK_SK_Yil: expiryYear,
        KK_CVC: cardCvv,
        KK_Sahibi_GSM: cardPhone,
        Hata_URL: `${process.env.NEXTAUTH_URL}/checkout?payment=failed`,
        Basarili_URL: `${process.env.NEXTAUTH_URL}/api/payment/callback`,
        Siparis_ID: orderId,
        Siparis_Aciklama: description,
        Taksit: installment.toString(),
        Islem_Tutar: formattedAmount,
        Toplam_Tutar: totalAmount,
        Islem_Hash: hash,
        Islem_Guvenlik_Tip: 'NS', // Non-3D
        Islem_ID: `SDK_NEXTJS_v1_${orderId}`,
        IPAdr: ipAddress,
        Ref_URL: process.env.NEXTAUTH_URL || '',
        Data1: '',
        Data2: '',
        Data3: '',
        Data4: '',
        Data5: '',
      };

      const result = await this.sendSOAPRequest('TP_WMD_UCD', params);

      if (result && (result.Sonuc === '1' || result.Sonuc_Kod === '00')) {
        return {
          success: true,
          transactionId: result.Islem_ID || result.UCD_MD,
          orderId: result.Siparis_ID,
          message: result.Sonuc_Str || 'Ödeme başarılı',
          result: result,
        };
      } else {
        return {
          success: false,
          errorCode: result?.Sonuc || result?.Sonuc_Kod || 'UNKNOWN',
          message: result?.Sonuc_Str || result?.Hatali_Islem || 'Ödeme işlemi başarısız',
          result: result,
        };
      }
    } catch (error: any) {
      console.error('ParamPOS Payment Error:', error);
      return {
        success: false,
        message: error.message || 'Ödeme işlemi sırasında bir hata oluştu',
      };
    }
  }

  /**
   * Modal/iFrame ödeme sayfası oluşturma (Kullanıcı kart bilgilerini Parampos'ta girer)
   * TP_Modal_Payment API'sini kullanır
   */
  async createModalPayment(data: {
    orderId: string;
    amount: number;
    customerPhone?: string;
    description?: string;
    successUrl?: string;
    failUrl?: string;
    installment?: number;
    maxInstallment?: number;
  }): Promise<PaymentResponse> {
    try {
      const {
        orderId,
        amount,
        customerPhone = '',
        description = '',
        successUrl,
        failUrl,
        installment = 0,
        maxInstallment = 0,
      } = data;

      const formattedAmount = this.formatAmount(amount);

      // TP_Modal_Payment için özel parametre yapısı
      const params = {
        d: {
          Code: this.config.clientCode,
          User: this.config.clientUsername,
          Pass: this.config.clientPassword,
          GUID: this.config.guid,
          GSM: customerPhone || '',
          Amount: formattedAmount,
          Order_ID: orderId,
          TransactionId: orderId,
          Callback_URL: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`,
          MaxInstallment: maxInstallment.toString(),
        }
      };

      console.log('Parampos Modal Payment başlatılıyor:', orderId);
      console.log('Parametreler:', JSON.stringify(params, null, 2));

      const result = await this.sendSOAPRequest('TP_Modal_Payment', params);

      console.log('Parampos Modal Payment sonucu:', JSON.stringify(result, null, 2));

      // Response direkt olarak geldi (TP_Modal_PaymentResult wrapper yok)
      if (result && result.ResultCode && result.URL) {
        if (result.ResultCode === '1' || result.ResultCode === 1) {
          // Parampos URL'ini iframe sayfasına yönlendir
          const iframeUrl = `/checkout/payment-iframe?url=${encodeURIComponent(result.URL)}`;
          
          return {
            success: true,
            redirectUrl: iframeUrl,
            transactionId: orderId,
            orderId: orderId,
            message: 'Ödeme sayfasına yönlendiriliyor',
            result: result,
          };
        } else {
          return {
            success: false,
            errorCode: result.ResultCode?.toString() || 'UNKNOWN',
            message: result.ResultDescription || 'Ödeme sayfası oluşturulamadı',
            result: result,
          };
        }
      } else {
        console.error('Beklenmeyen Parampos yanıtı:', result);
        return {
          success: false,
          message: 'Parampos API yanıtı geçersiz',
          result: result,
        };
      }
    } catch (error: any) {
      console.error('ParamPOS Modal Payment Error:', error);
      return {
        success: false,
        message: error.message || 'Ödeme sayfası oluşturulurken hata oluştu',
      };
    }
  }

  /**
   * Parampos ödeme sayfası URL'i oluşturma (Kart bilgileri Parampos'ta girilecek)
   * NOT: Parampos'ta kart bilgisi önceden girilmeden 3D başlatma yapılamaz.
   * Bu yüzden bu metod geçici test kartı ile 3D başlatır.
   * @deprecated Bunun yerine createModalPayment kullanın
   */
  async generatePaymentPageUrl(data: {
    orderId: string;
    amount: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    description?: string;
    successUrl?: string;
    failUrl?: string;
    installment?: number;
  }): Promise<PaymentResponse> {
    try {
      const {
        orderId,
        amount,
        customerPhone = '',
        description = '',
        successUrl,
        failUrl,
        installment = 1,
      } = data;

      const formattedAmount = this.formatAmount(amount);
      const totalAmount = this.formatAmount(amount);

      // HASH oluşturma
      const hashData = `${this.config.clientCode}${this.config.guid}${installment}${formattedAmount}${totalAmount}${orderId}`;
      const hash = this.generateHash(hashData);

      // Parampos TEST KARTI (Production'da gerçek kart girilecek)
      // Test ortamında Parampos'un test kartlarını kullan
      const testCard = {
        cardNumber: '5456165456165454', // Mastercard test
        cardExpiry: '1225', // 12/25
        cardCvv: '000',
        cardHolderName: 'TEST CARD',
      };

      const params = {
        G: {
          CLIENT_CODE: this.config.clientCode,
          CLIENT_USERNAME: this.config.clientUsername,
          CLIENT_PASSWORD: this.config.clientPassword,
        },
        GUID: this.config.guid,
        KK_Sahibi: testCard.cardHolderName,
        KK_No: testCard.cardNumber,
        KK_SK_Ay: testCard.cardExpiry.substring(0, 2),
        KK_SK_Yil: testCard.cardExpiry.substring(2, 4),
        KK_CVC: testCard.cardCvv,
        KK_Sahibi_GSM: customerPhone,
        Hata_URL: failUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/order/error`,
        Basarili_URL: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`,
        Siparis_ID: orderId,
        Siparis_Aciklama: description || `Sipariş #${orderId}`,
        Taksit: installment.toString(),
        Islem_Tutar: formattedAmount,
        Toplam_Tutar: totalAmount,
        Islem_Hash: hash,
        Islem_Guvenlik_Tip: '3D',
        Islem_ID: orderId,
        IPAdr: '0.0.0.0',
        Ref_URL: process.env.NEXT_PUBLIC_BASE_URL || '',
        Data1: '',
        Data2: '',
        Data3: '',
        Data4: '',
        Data5: '',
      };

      console.log('Parampos 3D başlatılıyor:', orderId);
      console.log('Parampos parametreleri:', JSON.stringify(params, null, 2));

      const result = await this.sendSOAPRequest('TP_WMD_UCD', params);

      console.log('Parampos 3D sonucu:', JSON.stringify(result, null, 2));

      // Parampos UCD_HTML veya UCD_URL döndürebilir
      if (result && (result.UCD_URL || result.UCD_HTML)) {
        if (result.UCD_HTML) {
          // HTML içeriğini decode et ve endpoint'e gönder
          const decodedHtml = result.UCD_HTML
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&');

          return {
            success: true,
            redirectUrl: `/checkout/3d-secure?html=${encodeURIComponent(decodedHtml)}&md=${encodeURIComponent(result.UCD_MD)}&orderId=${orderId}`,
            transactionId: result.UCD_MD,
            orderId: orderId,
            message: '3D Secure sayfasına yönlendiriliyor',
            result: result,
          };
        } else {
          return {
            success: true,
            redirectUrl: result.UCD_URL,
            transactionId: result.UCD_MD,
            orderId: orderId,
            message: '3D Secure sayfasına yönlendiriliyor',
            result: result,
          };
        }
      } else {
        console.error('Parampos UCD_URL ve UCD_HTML bulunamadı. Tam response:', result);
        return {
          success: false,
          errorCode: result?.Sonuc || result?.Sonuc_Kod || 'UNKNOWN',
          message: result?.Sonuc_Str || result?.TURPOS?.Sonuc_Str || 'UCD_URL/UCD_HTML bulunamadı',
          result: result,
        };
      }
    } catch (error: any) {
      console.error('ParamPOS Payment Page Error:', error);
      return {
        success: false,
        message: error.message || 'Ödeme sayfası oluşturulurken hata oluştu',
      };
    }
  }

  /**
   * 3D Secure ile ödeme (İlk adım - Form oluşturma)
   * NOT: Bu metod kart bilgilerini alır - güvenlik için generatePaymentPageUrl kullanın
   */
  async init3DSecurePayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      const {
        orderId,
        amount,
        cardNumber,
        cardExpiry,
        cardCvv,
        cardHolderName,
        installment = 1,
        cardPhone = '',
        successUrl,
        failUrl,
        ipAddress = '127.0.0.1',
        description = '',
      } = paymentData;

      const formattedAmount = this.formatAmount(amount);
      const totalAmount = this.formatAmount(amount);

      // HASH oluşturma
      const hashData = `${this.config.clientCode}${this.config.guid}${installment}${formattedAmount}${totalAmount}${orderId}`;
      const hash = this.generateHash(hashData);

      const expiryMonth = cardExpiry.substring(0, 2);
      const expiryYear = cardExpiry.substring(2, 4);

      const params = {
        G: {
          CLIENT_CODE: this.config.clientCode,
          CLIENT_USERNAME: this.config.clientUsername,
          CLIENT_PASSWORD: this.config.clientPassword,
        },
        GUID: this.config.guid,
        KK_Sahibi: cardHolderName,
        KK_No: cardNumber.replace(/\s/g, ''),
        KK_SK_Ay: expiryMonth,
        KK_SK_Yil: expiryYear,
        KK_CVC: cardCvv,
        KK_Sahibi_GSM: cardPhone,
        Hata_URL: failUrl || `${process.env.NEXTAUTH_URL}/checkout?payment=failed`,
        Basarili_URL: successUrl || `${process.env.NEXTAUTH_URL}/api/payment/callback`,
        Siparis_ID: orderId,
        Siparis_Aciklama: description,
        Taksit: installment.toString(),
        Islem_Tutar: formattedAmount,
        Toplam_Tutar: totalAmount,
        Islem_Hash: hash,
        Islem_Guvenlik_Tip: '3D', // 3D Secure
        Islem_ID: `SDK_NEXTJS_3D_${orderId}`,
        IPAdr: ipAddress,
        Ref_URL: process.env.NEXTAUTH_URL || '',
        Data1: '',
        Data2: '',
        Data3: '',
        Data4: '',
        Data5: '',
      };

      const result = await this.sendSOAPRequest('TP_WMD_UCD', params);

      if (result && result.UCD_URL) {
        return {
          success: true,
          redirectUrl: result.UCD_URL,
          transactionId: result.UCD_MD,
          message: '3D Secure sayfasına yönlendiriliyor',
          result: result,
        };
      } else {
        return {
          success: false,
          errorCode: result?.Sonuc || 'UNKNOWN',
          message: result?.Sonuc_Str || '3D Secure başlatılamadı',
          result: result,
        };
      }
    } catch (error: any) {
      console.error('ParamPOS 3D Init Error:', error);
      return {
        success: false,
        message: error.message || '3D Secure başlatılamadı',
      };
    }
  }

  /**
   * 3D Secure tamamlama (Callback sonrası)
   */
  async complete3DSecurePayment(params: any): Promise<PaymentResponse> {
    try {
      const requestParams = {
        G: {
          CLIENT_CODE: this.config.clientCode,
          CLIENT_USERNAME: this.config.clientUsername,
          CLIENT_PASSWORD: this.config.clientPassword,
        },
        GUID: this.config.guid,
        UCD_MD: params.UCD_MD || params.Islem_ID,
        Islem_GUID: params.Islem_GUID,
        Siparis_ID: params.Siparis_ID,
      };

      const result = await this.sendSOAPRequest('TP_WMD_Pay', requestParams);

      if (result && (result.Sonuc === '1' || result.Sonuc_Kod === '00')) {
        return {
          success: true,
          transactionId: result.Islem_ID,
          orderId: result.Siparis_ID,
          message: result.Sonuc_Str || 'Ödeme başarılı',
          result: result,
        };
      } else {
        return {
          success: false,
          errorCode: result?.Sonuc || result?.Sonuc_Kod || 'UNKNOWN',
          message: result?.Sonuc_Str || 'Ödeme tamamlanamadı',
          result: result,
        };
      }
    } catch (error: any) {
      console.error('ParamPOS 3D Complete Error:', error);
      return {
        success: false,
        message: error.message || '3D Secure tamamlanamadı',
      };
    }
  }

  /**
   * İşlem sorgulama
   */
  async queryTransaction(orderId: string): Promise<any> {
    try {
      const params = {
        G: {
          CLIENT_CODE: this.config.clientCode,
          CLIENT_USERNAME: this.config.clientUsername,
          CLIENT_PASSWORD: this.config.clientPassword,
        },
        GUID: this.config.guid,
        Siparis_ID: orderId,
      };

      return await this.sendSOAPRequest('TP_Islem_Sorgulama', params);
    } catch (error) {
      console.error('ParamPOS Query Error:', error);
      throw error;
    }
  }

  /**
   * İptal işlemi
   */
  async cancelTransaction(orderId: string, transactionId: string): Promise<PaymentResponse> {
    try {
      const params = {
        G: {
          CLIENT_CODE: this.config.clientCode,
          CLIENT_USERNAME: this.config.clientUsername,
          CLIENT_PASSWORD: this.config.clientPassword,
        },
        GUID: this.config.guid,
        Siparis_ID: orderId,
        Islem_ID: transactionId,
      };

      const result = await this.sendSOAPRequest('TP_Islem_Iptal', params);

      return {
        success: result?.Sonuc === '1',
        message: result?.Sonuc_Str || 'İptal işlemi',
        result: result,
      };
    } catch (error: any) {
      console.error('ParamPOS Cancel Error:', error);
      return {
        success: false,
        message: error.message || 'İptal işlemi başarısız',
      };
    }
  }

  /**
   * İade işlemi
   */
  async refundTransaction(orderId: string, transactionId: string, amount: number): Promise<PaymentResponse> {
    try {
      const formattedAmount = this.formatAmount(amount);

      const params = {
        G: {
          CLIENT_CODE: this.config.clientCode,
          CLIENT_USERNAME: this.config.clientUsername,
          CLIENT_PASSWORD: this.config.clientPassword,
        },
        GUID: this.config.guid,
        Siparis_ID: orderId,
        Islem_ID: transactionId,
        Iade_Tutar: formattedAmount,
      };

      const result = await this.sendSOAPRequest('TP_Islem_Iade', params);

      return {
        success: result?.Sonuc === '1',
        message: result?.Sonuc_Str || 'İade işlemi',
        result: result,
      };
    } catch (error: any) {
      console.error('ParamPOS Refund Error:', error);
      return {
        success: false,
        message: error.message || 'İade işlemi başarısız',
      };
    }
  }
}

export default new ParamPOSService();
