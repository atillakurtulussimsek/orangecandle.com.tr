import Joi from "joi";

export const KartSaklamaOdemeModel = (data) => {
  const schema = Joi.object({
    KS_GUID: Joi.string().length(36).required(),
    CVV: Joi.string().length(3).allow(""),
    KK_Sahibi_GSM: Joi.string()
      .pattern(/^[5][0-9]{9}$/)
      .required(),
    Hata_URL: Joi.string().uri().max(250).required(),
    Basarili_URL: Joi.string().uri().max(250).required(),
    Siparis_ID: Joi.string().required(),
    Siparis_Aciklama: Joi.string().max(250).allow(""),
    Taksit: Joi.number().integer().min(1).max(99).required(),
    Islem_Tutar: Joi.string().required(),
    Toplam_Tutar: Joi.string().pattern(/^\d+,\d{2}$/).required(),
    Islem_Guvenlik_Tip: Joi.string().valid("NS", "3D","string").required(),
    Islem_ID: Joi.string().allow(""),
    IPAdr: Joi.string().max(256).required(),
    Ref_URL: Joi.string().max(256).allow("", null),
    Data1: Joi.string().max(250).allow(""),
    Data2: Joi.string().max(250).allow(""),
    Data3: Joi.string().max(250).allow(""),
    Data4: Joi.string().max(250).allow(""),
    KK_Islem_ID: Joi.string().max(200).allow(""),
  });

  return schema.validate(data);
};
