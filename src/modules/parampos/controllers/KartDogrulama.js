import KartDogrulamaService from "../services/KartDogrulamaService.js";

export async function KartDogrulama(req) {
  try {
    return await KartDogrulamaService.TP_KK_Verify(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
