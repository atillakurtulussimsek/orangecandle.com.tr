import Joi from "joi";

export const OdemeModel = (data) => {
  const schema = Joi.object({
    KK_Sahibi: Joi.string().required(),
    KK_No: Joi.string().creditCard().required(),
    KK_SK_Ay: Joi.string()
      .pattern(/^[0-9]{2}$/)
      .required(),
    KK_SK_Yil: Joi.string()
      .pattern(/^[0-9]{2}$/)
      .required(),
    KK_CVC: Joi.string()
      .pattern(/^[0-9]{3}$/)
      .required()
      .messages({
        "string.pattern.base":
          "CVC kodu 4 haneli ve sadece sayılardan oluşmalıdır",
      }),
    KK_Sahibi_GSM: Joi.string()
      .pattern(/^[1-9][0-9]{9}$/)
      .messages({
        "string.pattern.base":
          "Telefon numarası 10 haneli olmalı ve başında 0 olmamalı",
      })
      .allow(""),
    Hata_URL: Joi.string().required(),
    Basarili_URL: Joi.string().required(),
    Siparis_ID: Joi.string().required(),
    Siparis_Aciklama: Joi.string().allow(""),
    Taksit: Joi.string().required(),
    Islem_Tutar: Joi.string()
      .pattern(/^\d{1,3}(\.\d{3})*(,\d{2})$/)
      .required()
      .messages({
        "string.pattern.base":
          "İşlem tutarı geçerli bir formatta olmalı. Örneğin: 100,50",
      }),
    Toplam_Tutar: Joi.string()
      .pattern(/^\d{1,3}(\.\d{3})*(,\d{2})$/)
      .required()
      .messages({
        "string.pattern.base":
          "Toplam tutarı geçerli bir formatta olmalı. Örneğin: 100,50",
      }),
    Islem_Guvenlik_Tip: Joi.string().valid("NS", "3D").required().messages({
      "any.only": "İşlem güvenlik tipi sadece 'NS' veya '3D' olabilir",
    }),
    Islem_ID: Joi.string().allow(""),
    IPAdr: Joi.string().ip().required().messages({
      "string.ip": "Geçerli bir IP adresi giriniz",
    }),
    Ref_URL: Joi.string().allow(""),
    Data1: Joi.string().allow(""),
    Data2: Joi.string().allow(""),
    Data3: Joi.string().allow(""),
    Data4: Joi.string().allow(""),
    Data5: Joi.string().allow(""),
  });

  return schema.validate(data);
};
