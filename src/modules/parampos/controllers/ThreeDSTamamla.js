import ThreeDSTamamlaService from "../services/ThreeDSTamamlaService.js";

export async function ThreeDSTamamla(req) {
  try {
    return await ThreeDSTamamlaService.TP_WMD_Pay(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
