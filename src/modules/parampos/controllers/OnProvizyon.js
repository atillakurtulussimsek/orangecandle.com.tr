import OnProvizyonService from "../services/OnProvizyonService.js";

export async function OnProvizyon(req) {
  try {
    return await OnProvizyonService.TP_Islem_Odeme_OnProv_WMD(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
