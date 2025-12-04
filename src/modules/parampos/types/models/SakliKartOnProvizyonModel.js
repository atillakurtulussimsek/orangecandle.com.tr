import Joi from "joi";

export const SakliKartOnProvizyonModel = (data) => {
  const schema = Joi.object({
    KK_GUID: Joi.string().length(36).required().messages({
      "string.length": "KK_GUID 36 karakter uzunluğunda olmalıdır.",
    }),
    KS_Kart_No: Joi.string().length(36).required().messages({
      "string.length": "KS_Kart_No 36 karakter uzunluğunda olmalıdır.",
    }),
    KK_Sahibi_GSM: Joi.string()
      .pattern(/^[1-9][0-9]{9}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Telefon numarası 10 haneli olmalı ve başında 0 olmamalı.",
      }),
    Hata_URL: Joi.string().max(256).required().messages({
      "string.max": "Hata_URL en fazla 256 karakter olabilir.",
    }),
    Basarili_URL: Joi.string().max(256).required().messages({
      "string.max": "Basarili_URL en fazla 256 karakter olabilir.",
    }),
    Siparis_ID: Joi.string().max(50).required().messages({
      "string.max": "Siparis_ID en fazla 50 karakter olabilir.",
    }),
    Siparis_Aciklama: Joi.string().max(250).required().messages({
      "string.max": "Siparis_Aciklama en fazla 250 karakter olabilir.",
    }),
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
    Islem_Hash: Joi.string().required(),
    Islem_Guvenlik_Tip: Joi.string().valid("NS", "3D").required().messages({
      "any.only": "İşlem güvenlik tipi sadece 'NS' veya '3D' olabilir.",
    }),
    Islem_ID: Joi.string().allow(""),
    IPAdr: Joi.string().ip().max(50).required().messages({
      "string.ip": "Geçerli bir IP adresi giriniz.",
      "string.max": "IPAdr en fazla 50 karakter olabilir.",
    }),
    Ref_URL: Joi.string().max(256).allow("").messages({
      "string.max": "Ref_URL en fazla 256 karakter olabilir.",
    }),
    Data1: Joi.string().max(250).allow(""),
    Data2: Joi.string().max(250).allow(""),
    Data3: Joi.string().max(250).allow(""),
    Data4: Joi.string().max(250).allow(""),
    Data5: Joi.string().max(250).allow(""),
  });

  return schema.validate(data);
};
