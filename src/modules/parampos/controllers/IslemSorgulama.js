import IslemSorgulamaService from "../services/IslemSorgulamaService.js";

export async function IslemSorgulama(req) {
  try {
    return await IslemSorgulamaService.TP_Islem_Sorgulama4(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
