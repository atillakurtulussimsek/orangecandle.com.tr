import BinSorgulamaService from "../services/BinSorgulamaService.js";

export async function BinSorgulama(req) {
  try {
    return await BinSorgulamaService.BIN_SanalPos(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
