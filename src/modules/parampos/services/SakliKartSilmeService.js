import soap from "soap";
import { config } from "../configs/index.js";
import { SakliKartSilmeModel } from "../types/models/SakliKartSilmeModel.js";

class SakliKartSilmeService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      this.client = await soap.createClientAsync(config.URL);
    }
    return this.client;
  }

  async KS_Kart_Sil(req) {
    const { error } = SakliKartSilmeModel(req);
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
    const result = client.KS_Kart_SilAsync(req);
    if (!result) {
      return ["Non Result Object"];
    }
    return result;
  }
}

export default new SakliKartSilmeService();
