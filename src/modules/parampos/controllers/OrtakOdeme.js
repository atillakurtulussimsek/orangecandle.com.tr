import OrtakOdemeService from "../services/OrtakOdemeService.js";

export async function OrtakOdeme(req) {
  try {
    return await OrtakOdemeService.To_Pre_Encrypting_OOS(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
