import soap from "soap";
import { config } from "../configs/index.js";
import { KartSaklamaModel } from "../types/models/KartSaklamaModel.js";

class KartSaklamaService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      this.client = await soap.createClientAsync(config.URL);
    }
    return this.client;
  }

  async KartEkle(req) {
    const { error } = KartSaklamaModel(req);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }

    req.G = {
      CLIENT_CODE: config.CLIENT_CODE,
      CLIENT_USERNAME: config.CLIENT_USERNAME,
      CLIENT_PASSWORD: config.CLIENT_PASSWORD,
    };
    req.GUID = config.GUID;

    const client = await this.createClient();
    const result = await client.KS_Kart_EkleAsync(req);
    return result[0];
  }
}

export default new KartSaklamaService();
