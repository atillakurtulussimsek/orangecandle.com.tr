import soap from "soap";
import { config } from "../configs/index.js";
import { PosOranlariModel } from "../types/models/PosOranlariModel.js";

class PosOranlariService {
  constructor() {
    this.client = null;
  }

  async createClient() {
    if (!this.client) {
      this.client = await soap.createClientAsync(config.URL);
    }
    return this.client;
  }

  async TP_Ozel_Oran_SK_Liste(req) {
    const { error } = PosOranlariModel(req);
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
    const result = await client.TP_Ozel_Oran_SK_ListeAsync(req);
    if (!result) {
      return ["Non Result Object"];
    }

    const DT_Bilgi = result;
    const xml = DT_Bilgi.any;
    return this.processResponse(result);
  }

  processResponse(result) {
    const DT_Bilgi = result.TP_Ozel_Oran_SK_ListeResult.DT_Bilgi;
    const xml = DT_Bilgi.any;
    const xmlStr = `<?xml version="1.0" standalone="yes"?><root>${xml}</root>`;
    const formattedXmlStr = xmlStr.replace(/(diffgr:|msdata:)/g, "");
    const data = new DOMParser().parseFromString(formattedXmlStr, "text/xml");
    console.log(data);

    const list = data.getElementsByTagName("NewDataSet")[0];

    if (req.SanalPOS_ID) {
      for (let item of list.getElementsByTagName("DT_Ozel_Oranlar_SK")) {
        if (
          item.getElementsByTagName("SanalPOS_ID")[0].textContent ==
          req.SanalPOS_ID
        ) {
          return item;
        }
      }
    }
    return list;
  }
}

export default new PosOranlariService();
