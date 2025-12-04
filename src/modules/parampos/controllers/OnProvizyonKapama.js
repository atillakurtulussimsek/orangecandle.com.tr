import OnProvizyonKapamaService from "../services/OnProvizyonKapamaService.js";

export async function OnProvizyonKapama(req) {
  try {
    return await OnProvizyonKapamaService.TP_Islem_Odeme_OnProv_Kapa(req);
  } catch (err) {
    console.error("Error:", err);
    return "SOAP Request Failed";
  }
}
