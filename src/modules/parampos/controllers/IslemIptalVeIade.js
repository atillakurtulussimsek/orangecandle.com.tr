import IslemIptalVeIadeService from "../services/IslemIptalVeIadeService.js";

export async function IslemIptalVeIade(req) {
  try {
    return await IslemIptalVeIadeService.TP_Islem_Iptal_Iade_Kismi2(req);
  } catch (err) {
    console.error("Error: ", err);
    return "SOAP Request Failed";
  }
}
