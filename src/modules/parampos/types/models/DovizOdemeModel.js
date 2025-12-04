import Joi from "joi";

export const DovizOdemeModel = (data) => {
  const schema = Joi.object({
    Doviz_Kodu: Joi.number()
      .valid(1000, 1001, 1002, 1003)
      .required()
      .messages({
        "any.only": "Döviz kodu yalnızca 1000 (TRL), 1001 (USD), 1002 (EUR), veya 1003 (GBP) olabilir",
      }),
    KK_Sahibi: Joi.string().max(100).required(),
    KK_No: Joi.string()
      .creditCard()
      .length(16)
      .required(),
    KK_SK_Ay: Joi.string()
      .pattern(/^[0-9]{2}$/)
      .required(),
    KK_SK_Yil: Joi.string()
      .pattern(/^[0-9]{4}$/)
      .required(),
    KK_CVC: Joi.string()
      .pattern(/^[0-9]{3}$/)
      .required()
      .messages({
        "string.pattern.base": "CVC kodu 3 haneli olmalıdır ve sadece sayılardan oluşmalıdır",
      }),
    KK_Sahibi_GSM: Joi.string()
      .pattern(/^[5][0-9]{9}$/)
      .required()
      .messages({
        "string.pattern.base": "Telefon numarası 10 haneli olmalı ve başında 0 olmamalı",
      }),
    Hata_URL: Joi.string().max(256).required(),
    Basarili_URL: Joi.string().max(256).required(),
    Siparis_ID: Joi.string().max(50).required(),
    Siparis_Aciklama: Joi.string().max(250).required(),
    Islem_Tutar: Joi.string()
      .pattern(/^\d{1,3}(\.\d{3})*(,\d{2})$/)
      .required()
      .messages({
        "string.pattern.base":
          "İşlem tutarı geçerli bir formatta olmalı. Örneğin: 1000,50",
      }),
    Toplam_Tutar: Joi.string()
      .pattern(/^\d{1,3}(\.\d{3})*(,\d{2})$/)
      .required()
      .messages({
        "string.pattern.base":
          "Toplam tutarı geçerli bir formatta olmalı. Örneğin: 1000,50",
      }),
    Islem_Guvenlik_Tip: Joi.string().valid("NS", "3D").required().messages({
      "any.only": "İşlem güvenlik tipi sadece 'NS' veya '3D' olabilir",
    }),
    Islem_ID: Joi.string().allow(""),
    IPAdr: Joi.string().max(50).required(),
    Ref_URL: Joi.string().max(256).allow(""),
    Data1: Joi.string().max(250).allow(""),
    Data2: Joi.string().max(250).allow(""),
    Data3: Joi.string().max(250).allow(""),
    Data4: Joi.string().max(250).allow(""),
    Data5: Joi.string().max(250).allow(""),
  });

  return schema.validate(data);
};
