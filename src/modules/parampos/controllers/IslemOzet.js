import IslemOzetService from "../services/IslemOzetService.js";

export async function IslemOzet(req) {
  try {
    return await IslemOzetService.TP_Mutabakat_Ozet(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
