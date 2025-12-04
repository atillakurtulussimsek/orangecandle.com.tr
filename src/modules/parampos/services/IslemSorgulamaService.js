import soap from "soap";
import { config } from "../configs/index.js";
import { IslemSorgulamaModel } from "../types/models/IslemSorgulamaModel.js";

class IslemSorgulamaService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      this.client = await soap.createClientAsync(config.URL);
    }
    return this.client;
  }

  async TP_Islem_Sorgulama4(req) {
    const { error } = IslemSorgulamaModel(req);
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
    const result = client.TP_Islem_Sorgulama4Async(req);
    if (!result) {
      return ["Non Result Object"];
    }
    return result;
  }
}

export default new IslemSorgulamaService();
