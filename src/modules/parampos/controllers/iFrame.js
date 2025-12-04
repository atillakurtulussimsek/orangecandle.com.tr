import iFrameService from "../services/iFrameService.js";

export async function iFrame(req) {
  try {
    return await iFrameService.TP_Modal_Payment(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
