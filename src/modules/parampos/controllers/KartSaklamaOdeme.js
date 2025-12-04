import KartSaklamaOdemeService from "../services/KartSaklamaOdemeService.js";

export async function KartSaklamaOdeme(req) {
  try {
    return await KartSaklamaOdemeService.KS_Tahsilat(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
