import soap from "soap";
import { config, version } from "../configs/index.js";
import { OdemeModel } from "../types/models/OdemeModel.js";
import Hash from "../types/utils/Hash.js";

class OdemeService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      this.client = await soap.createClientAsync(config.URL);
    }
    return this.client;
  }

  async TP_WMD_UCD(req) {
    const { error } = OdemeModel(req);
    if (error) {
      return error.details;
    }
    req.Islem_Hash = Hash.SHA2B64(
      config.CLIENT_CODE +
        config.GUID +
        req.Taksit +
        req.Islem_Tutar +
        req.Toplam_Tutar +
        req.Siparis_ID
    );

    req.G = {
      CLIENT_CODE: config.CLIENT_CODE,
      CLIENT_USERNAME: config.CLIENT_USERNAME,
      CLIENT_PASSWORD: config.CLIENT_PASSWORD,
    };
    req.GUID = config.GUID;
    req.Islem_ID = req.Data1 + "|SDK_NODEJS_" + version + "_TP_WMD_UCD";

    const client = await this.createClient();
    const result = await client.TP_WMD_UCDAsync(req);
    return result;
  }
}

export default new OdemeService();
