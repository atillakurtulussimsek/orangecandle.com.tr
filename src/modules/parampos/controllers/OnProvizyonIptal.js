import OnProvizyonIptalService from "../services/OnProvizyonIptalService.js";

export async function OnProvizyonIptal(req) {
  try {
    return await OnProvizyonIptalService.TP_Islem_Iptal_OnProv(req);
  } catch (err) {
    console.error("Error:", err);
    return "SOAP Request Failed";
  }
}
