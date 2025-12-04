import IslemIzlemeService from "../services/IslemIzlemeService.js";

export async function IslemIzleme(req) {
  try {
    return await IslemIzlemeService.TP_Islem_Izleme(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
