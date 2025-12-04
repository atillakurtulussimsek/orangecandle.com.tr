import PosOranlariService from "../services/PosOranlariService.js";

export async function PosOranlari(req) {
  try {
    return await PosOranlariService.TP_Ozel_Oran_SK_Liste(req);
  } catch (err) {
    console.error("Error:", err);
    return "Request Failed";
  }
}
