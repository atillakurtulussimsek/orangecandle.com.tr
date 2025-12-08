import { GeliverClient } from '@geliver/sdk';
import { getGeliverConfig } from './settings';

// Geliver Client Singleton
let geliverClient: GeliverClient | null = null;

export async function getGeliverClient(): Promise<GeliverClient> {
  if (!geliverClient) {
    // Veritabanından ayarları al
    const config = await getGeliverConfig();
    
    if (!config.apiToken) {
      throw new Error('Geliver API token ayarlanmamış. Lütfen admin panelinden Geliver ayarlarını yapılandırın.');
    }

    geliverClient = new GeliverClient({
      token: config.apiToken,
      baseUrl: 'https://api.geliver.io/api/v1',
      timeoutMs: 30000,
      maxRetries: 2,
    });
  }

  return geliverClient;
}

// Gönderici Adresi Oluşturma
export interface CreateSenderParams {
  name: string;
  email: string;
  phone: string;
  address1: string;
  countryCode: string;
  cityName: string;
  cityCode: string;
  districtName: string;
  zip: string;
  shortName?: string;
}

export async function createSenderAddress(params: CreateSenderParams) {
  const client = await getGeliverClient();
  
  try {
    const sender = await client.addresses.createSender({
      name: params.name,
      email: params.email,
      phone: params.phone,
      address1: params.address1,
      countryCode: params.countryCode,
      cityName: params.cityName,
      cityCode: params.cityCode,
      districtName: params.districtName,
      zip: params.zip,
      shortName: params.shortName,
    });

    return {
      success: true,
      data: sender,
    };
  } catch (error: any) {
    console.error('Geliver createSender error:', error);
    return {
      success: false,
      error: error.message || 'Gönderici adresi oluşturulamadı',
      details: error,
    };
  }
}

// Gönderi Oluşturma
export interface CreateShipmentParams {
  senderAddressID: string;
  recipientAddress: {
    name: string;
    email: string;
    phone: string;
    address1: string;
    countryCode: string;
    cityName: string;
    cityCode: string;
    districtName: string;
    zip?: string;
  };
  length: string; // cm cinsinden string
  width: string;
  height: string;
  weight: string; // kg cinsinden string
  orderNumber: string;
  totalAmount: string;
  sourceIdentifier: string; // Mağaza URL'si
  test?: boolean; // Test modu
}

export async function createShipment(params: CreateShipmentParams) {
  const client = await getGeliverClient();

  try {
    const shipmentData = {
      senderAddressID: params.senderAddressID,
      recipientAddress: params.recipientAddress,
      length: params.length,
      width: params.width,
      height: params.height,
      distanceUnit: 'cm' as const,
      weight: params.weight,
      massUnit: 'kg' as const,
      order: {
        orderNumber: params.orderNumber,
        sourceIdentifier: params.sourceIdentifier,
        totalAmount: params.totalAmount,
        totalAmountCurrency: 'TRY',
      },
    };

    // Test modu veya canlı mod
    const shipment = params.test
      ? await client.shipments.createTest(shipmentData)
      : await client.shipments.create(shipmentData);

    return {
      success: true,
      data: shipment,
    };
  } catch (error: any) {
    console.error('Geliver createShipment error:', error);
    return {
      success: false,
      error: error.message || 'Gönderi oluşturulamadı',
      details: error,
    };
  }
}

// Teklifleri Getirme
export async function getShipmentOffers(shipmentId: string) {
  const client = await getGeliverClient();

  try {
    const shipment = await client.shipments.get(shipmentId);
    const offers = (shipment as any).offers;

    console.log('Geliver shipment response:', {
      id: (shipment as any).id,
      hasOffers: !!offers,
      offersType: typeof offers,
      offersKeys: offers ? Object.keys(offers) : [],
      sampleOffer: offers?.data?.[0] || offers?.cheapest || null,
    });

    return {
      success: true,
      data: {
        shipment,
        offers: offers || null,
        cheapest: offers?.cheapest || null,
      },
    };
  } catch (error: any) {
    console.error('Geliver getOffers error:', error);
    return {
      success: false,
      error: error.message || 'Teklifler alınamadı',
      details: error,
    };
  }
}

// Teklifi Kabul Etme
export async function acceptShipmentOffer(offerId: string) {
  const client = await getGeliverClient();

  try {
    const transaction = await client.transactions.acceptOffer(offerId);

    return {
      success: true,
      data: {
        transaction,
        shipment: transaction.shipment,
        barcode: transaction.shipment?.barcode,
        trackingNumber: transaction.shipment?.trackingNumber,
        labelURL: transaction.shipment?.labelURL,
        responsiveLabelURL: transaction.shipment?.responsiveLabelURL,
        trackingUrl: transaction.shipment?.trackingUrl,
      },
    };
  } catch (error: any) {
    console.error('Geliver acceptOffer error:', error);
    return {
      success: false,
      error: error.message || 'Teklif kabul edilemedi',
      details: error,
    };
  }
}

// Etiket İndirme (PDF)
export async function downloadLabel(labelURL: string) {
  const client = await getGeliverClient();

  try {
    const pdfBytes = await client.shipments.downloadLabelByUrl(labelURL);
    return {
      success: true,
      data: pdfBytes,
    };
  } catch (error: any) {
    console.error('Geliver downloadLabel error:', error);
    return {
      success: false,
      error: error.message || 'Etiket indirilemedi',
      details: error,
    };
  }
}

// Etiket İndirme (HTML - Responsive)
export async function downloadResponsiveLabel(responsiveLabelURL: string) {
  const client = await getGeliverClient();

  try {
    const html = await client.shipments.downloadResponsiveLabelByUrl(responsiveLabelURL);
    return {
      success: true,
      data: html,
    };
  } catch (error: any) {
    console.error('Geliver downloadResponsiveLabel error:', error);
    return {
      success: false,
      error: error.message || 'HTML etiket indirilemedi',
      details: error,
    };
  }
}

// Gönderi Takip Bilgisi
export async function getShipmentTracking(shipmentId: string) {
  const client = await getGeliverClient();

  try {
    console.log(`\n🔍 Geliver Tracking - Shipment ID: ${shipmentId}`);
    const shipment = await client.shipments.get(shipmentId);
    
    console.log('📦 RAW SHIPMENT DATA:', JSON.stringify(shipment, null, 2));
    
    const trackingStatus = (shipment as any).trackingStatus;
    
    console.log('📍 TRACKING STATUS:', JSON.stringify(trackingStatus, null, 2));
    console.log('🔗 Tracking URL:', (shipment as any).trackingUrl);
    console.log('🔢 Tracking Number:', (shipment as any).trackingNumber);
    console.log('📊 Barcode:', (shipment as any).barcode);

    return {
      success: true,
      data: {
        shipment,
        trackingStatus,
        trackingUrl: (shipment as any).trackingUrl,
        trackingNumber: (shipment as any).trackingNumber,
        barcode: (shipment as any).barcode,
      },
    };
  } catch (error: any) {
    console.error('❌ Geliver getTracking error:', error);
    return {
      success: false,
      error: error.message || 'Takip bilgisi alınamadı',
      details: error,
    };
  }
}

// Gönderi İptal Etme
export async function cancelShipment(shipmentId: string) {
  const client = await getGeliverClient();

  try {
    await client.shipments.cancel(shipmentId);
    return {
      success: true,
      message: 'Gönderi iptal edildi',
    };
  } catch (error: any) {
    console.error('Geliver cancelShipment error:', error);
    return {
      success: false,
      error: error.message || 'Gönderi iptal edilemedi',
      details: error,
    };
  }
}

// İade Gönderisi Oluşturma
export interface CreateReturnParams {
  originalShipmentId: string;
  willAccept: boolean;
  providerServiceCode?: string;
  count?: number;
}

export async function createReturnShipment(params: CreateReturnParams) {
  const client = await getGeliverClient();

  try {
    const returnShipment = await client.shipments.createReturn(
      params.originalShipmentId,
      {
        willAccept: params.willAccept,
        providerServiceCode: params.providerServiceCode,
        count: params.count || 1,
      }
    );

    return {
      success: true,
      data: returnShipment,
    };
  } catch (error: any) {
    console.error('Geliver createReturn error:', error);
    return {
      success: false,
      error: error.message || 'İade gönderisi oluşturulamadı',
      details: error,
    };
  }
}

// Şehir Listesi
export async function getCities(countryCode: string = 'TR') {
  const client = await getGeliverClient();

  try {
    const cities = await client.geo.listCities(countryCode);
    return {
      success: true,
      data: cities,
    };
  } catch (error: any) {
    console.error('Geliver getCities error:', error);
    return {
      success: false,
      error: error.message || 'Şehirler alınamadı',
      details: error,
    };
  }
}

// İlçe Listesi
export async function getDistricts(countryCode: string = 'TR', cityCode: string) {
  const client = await getGeliverClient();

  try {
    const districts = await client.geo.listDistricts(countryCode, cityCode);
    return {
      success: true,
      data: districts,
    };
  } catch (error: any) {
    console.error('Geliver getDistricts error:', error);
    return {
      success: false,
      error: error.message || 'İlçeler alınamadı',
      details: error,
    };
  }
}

// Webhook İmza Doğrulama (webhook endpoint'inde kullanılacak)
import { verifyWebhookSignature } from '@geliver/sdk';

export function verifyGeliverWebhook(
  body: string,
  headers: any,
  enableVerification: boolean = true
): boolean {
  try {
    return verifyWebhookSignature(body, headers, { enableVerification });
  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
}

// Geliver hata tipini export et
export type { GeliverError } from '@geliver/sdk';
