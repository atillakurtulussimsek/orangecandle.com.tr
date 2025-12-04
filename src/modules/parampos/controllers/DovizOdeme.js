import DovizOdemeService from "../services/DovizOdemeService.js";

export async function DovizOdeme(req) {
  try {
    return await DovizOdemeService.TP_Islem_Odeme_WD(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
