import soap from "soap";
import { config } from "../configs/index.js";
import { IslemOzetModel } from "../types/models/IslemOzetModel.js";

class IslemOzetService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      this.client = await soap.createClientAsync(config.URL);
    }
    return this.client;
  }

  async TP_Mutabakat_Ozet(req) {
    const { error } = IslemOzetModel(req);
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
    const result = client.TP_Mutabakat_OzetAsync(req);
    if (!result) {
      return ["Non Result Object"];
    }
    return result;
  }
}

export default new IslemOzetService();
