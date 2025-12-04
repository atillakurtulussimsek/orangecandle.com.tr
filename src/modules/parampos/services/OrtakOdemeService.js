import soap from "soap";
import { config } from "../configs/index.js";
import { OrtakOdemeModel } from "../types/models/OrtakOdemeModel.js";

class OrtakOdemeService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      // Client oluşturulurken header'ı da tanımlıyoruz
      const client = await soap.createClientAsync(config.URL);
      client.addSoapHeader({
        ServiceSecuritySoapHeader: {
          CLIENT_CODE: config.CLIENT_CODE,
          CLIENT_USERNAME: config.CLIENT_USERNAME,
          CLIENT_PASSWORD: config.CLIENT_PASSWORD,
        },
      });
      this.client = client;
    }
    return this.client;
  }

  async To_Pre_Encrypting_OOS(req) {
    const { error } = OrtakOdemeModel(req);
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
    const result = client.TO_Pre_Encrypting_OOSAsync(req);
    if (!result) {
      return ["Non Result Object"];
    }
    return result;
  }
}

export default new OrtakOdemeService();
