import soap from "soap";
import { config } from "../configs/index.js";
import { iFrameModel } from "../types/models/iFrameModel.js";

class iFrameService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    try {
      if (!this.client) {
        console.log('iFrameService - Creating new SOAP client for:', config.URL);
        this.client = await soap.createClientAsync(config.URL);
        console.log('iFrameService - SOAP client created successfully');
      }
      return this.client;
    } catch (error) {
      console.error('iFrameService - Failed to create SOAP client:', {
        url: config.URL,
        message: error.message,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall
      });
      throw new Error(`SOAP Client oluşturulamadı: ${error.message}`);
    }
  }

  async TP_Modal_Payment(req) {
    try {
      console.log('iFrameService - Request data:', JSON.stringify(req.d, null, 2));
      
      const { error } = iFrameModel(req.d);
      if (error) {
        console.error('iFrameService - Joi validation error:', error.details);
        return error.details;
      }
      
      req.d.Code = config.CLIENT_CODE;
      req.d.User = config.CLIENT_USERNAME;
      req.d.Pass = config.CLIENT_PASSWORD;
      req.d.GUID = config.GUID;
      
      console.log('iFrameService - Creating SOAP client for URL:', config.URL);
      const client = await this.createClient();
      console.log('iFrameService - SOAP client created successfully');
      
      console.log('iFrameService - Calling TP_Modal_PaymentAsync with data:', JSON.stringify(req.d, null, 2));
      const result = await client.TP_Modal_PaymentAsync(req);
      console.log('iFrameService - API Response:', JSON.stringify(result, null, 2));
      
      return result[0];
    } catch (error) {
      console.error('iFrameService - SOAP Error:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }
}

export default new iFrameService();
