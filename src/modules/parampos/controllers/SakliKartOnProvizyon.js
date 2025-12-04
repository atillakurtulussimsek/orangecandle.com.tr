import SakliKartOnProvizyonService from "../services/SakliKartOnProvizyonService.js";

export async function SakliKartOnProvizyon(req) {
  try {
    return await SakliKartOnProvizyonService.TP_Islem_Odeme_OnProv_WKS(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
