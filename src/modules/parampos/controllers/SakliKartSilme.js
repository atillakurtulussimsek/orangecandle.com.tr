import SakliKartSilmeService from "../services/SakliKartSilmeService.js";

export async function SakliKartSilme(req) {
  try {
    return await SakliKartSilmeService.KS_Kart_Sil(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
