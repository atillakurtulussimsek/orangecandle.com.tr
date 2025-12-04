import DekontService from "../services/DekontService.js";

export async function Dekont(req) {
  try {
    return await DekontService.TP_Islem_Dekont_Gonder(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
