import KartSaklamaService from "../services/KartSaklamaService.js";

export async function KartSaklama(req) {
  try {
    return await KartSaklamaService.KartEkle(req);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).send("SOAP Request Failed");
  }
}
