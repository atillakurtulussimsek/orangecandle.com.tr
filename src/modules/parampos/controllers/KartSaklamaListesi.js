import KartSaklamaListesiService from "../services/KartSaklamaListesiService.js";

export async function KartSaklamaListesi(req) {
  try {
    return await KartSaklamaListesiService.KS_Kart_Liste(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
