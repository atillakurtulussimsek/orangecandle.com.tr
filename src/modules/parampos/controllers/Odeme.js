import OdemeService from "../services/OdemeService.js";

export async function Odeme(req) {
  try {
    return await OdemeService.TP_WMD_UCD(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
