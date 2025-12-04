import soap from "soap";
import { config } from "../configs/index.js";
import { ThreeDSTamamlaModel } from "../types/models/ThreeDSTamamlaModel.js";

class ThreeDSTamamlaService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      this.client = await soap.createClientAsync(config.URL);
    }
    return this.client;
  }

  async TP_WMD_Pay(req) {
    const { error } = ThreeDSTamamlaModel(req);
    if (error) {
      return error.details;
    }

    req.G = {
      CLIENT_CODE: config.CLIENT_CODE,
      CLIENT_USERNAME: config.CLIENT_USERNAME,
      CLIENT_PASSWORD: config.CLIENT_PASSWORD,
    };
    req.GUID = config.GUID;
    const client = await this.createClient();
    const result = await client.TP_WMD_PayAsync(req);
    return result;
  }
}

export default new ThreeDSTamamlaService();
