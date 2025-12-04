import soap from "soap";
import { config } from "../configs/index.js";
import { OnProvizyonModel } from "../types/models/OnProvizyonModel.js";
import Hash from "../types/utils/Hash.js";

class OnProvizyonService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      this.client = await soap.createClientAsync(config.URL);
    }
    return this.client;
  }

  async TP_Islem_Odeme_OnProv_WMD(req) {
    const { error } = OnProvizyonModel(req);
    if (error) {
      return error.details;
    }
    req.Islem_Hash = Hash.SHA2B64(
      config.CLIENT_CODE +
        config.GUID +
        req.Islem_Tutar +
        req.Toplam_Tutar +
        req.Siparis_ID +
        req.Hata_URL +
        req.Basarili_URL
    );

    req.G = {
      CLIENT_CODE: config.CLIENT_CODE,
      CLIENT_USERNAME: config.CLIENT_USERNAME,
      CLIENT_PASSWORD: config.CLIENT_PASSWORD,
    };
    req.GUID = config.GUID;

    const client = await this.createClient();
    const result = client.TP_Islem_Odeme_OnProv_WMDAsync(req);
    if (!result) {
      return ["Non Result Object"];
    }
    return result;
  }
}

export default new OnProvizyonService();
