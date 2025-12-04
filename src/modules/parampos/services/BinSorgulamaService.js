import soap from "soap";
import { config } from "../configs/index.js";
import { BinSorgulamaModel } from "../types/models/BinSorgulamaModel.js";

class BinSorgulamaService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      this.client = await soap.createClientAsync(config.URL);
    }
    return this.client;
  }

  async BIN_SanalPos(req) {
    const { error } = BinSorgulamaModel(req);
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
    const result = client.BIN_SanalPosAsync(req);
    if (!result) {
      return ["Non Result Object"];
    }
    return result;
  }
}

export default new BinSorgulamaService();
