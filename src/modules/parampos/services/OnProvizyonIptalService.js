import soap from "soap";
import { config } from "../configs/index.js";
import { OnProvizyonIptalModel } from "../types/models/OnProvizyonIptalModel.js";

class OnProvizyonIptalService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      this.client = await soap.createClientAsync(config.URL);
    }
    return this.client;
  }

  async TP_Islem_Iptal_OnProv(req) {
    const { error } = OnProvizyonIptalModel(req);
    if (error) {
      return error.details;
    }

    const args = {
      G: {
        CLIENT_CODE: config.CLIENT_CODE,
        CLIENT_USERNAME: config.CLIENT_USERNAME,
        CLIENT_PASSWORD: config.CLIENT_PASSWORD,
      },
      GUID: config.GUID,
    };

    const client = await this.createClient();
    const result = await client.TP_Islem_Iptal_OnProvAsync(args);
    return result[0];
  }
}

export default new OnProvizyonIptalService();
