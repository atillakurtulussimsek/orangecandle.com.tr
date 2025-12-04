import soap from "soap";
import { config } from "../configs/index.js";
import { OnProvizyonKapamaModel } from "../types/models/OnProvizyonKapamaModel.js";

class OnProvizyonKapamaService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      this.client = await soap.createClientAsync(config.URL);
    }
    return this.client;
  }

  async TP_Islem_Odeme_OnProv_Kapa(req) {
    const { error } = OnProvizyonKapamaModel(req);
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
    console.log(req)
    const result = await client.TP_Islem_Odeme_OnProv_KapaAsync(req);
    return result[0];
  }
}

export default new OnProvizyonKapamaService();
