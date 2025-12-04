import soap from "soap";
import { config } from "../configs/index.js";
import { KartSaklamaOdemeModel } from "../types/models/KartSaklamaOdemeModel.js";

class KartSaklamaOdemeService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      this.client = await soap.createClientAsync(config.URL);
    }
    return this.client;
  }

  async KS_Tahsilat(req) {
    const { error } = KartSaklamaOdemeModel(req);
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
    const result = await client.KS_TahsilatAsync(req);
    return result[0];
  }
}

export default new KartSaklamaOdemeService();
