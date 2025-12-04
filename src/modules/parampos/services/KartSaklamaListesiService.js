import soap from "soap";
import { config } from "../configs/index.js";
import { KartSaklamaListesiModel } from "../types/models/KartSaklamaListesiModel.js";

class KartSaklamaListesiService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      this.client = await soap.createClientAsync(config.URL);
    }
    return this.client;
  }

  async KS_Kart_Liste(req) {
    const { error } = KartSaklamaListesiModel(req);
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
    const result = client.KS_Kart_ListeAsync(req);
    if (!result) {
      return ["Non Result Object"];
    }
    return result;
  }
}

export default new KartSaklamaListesiService();
