import Joi from "joi";

export const OrtakOdemeModel = (data) => {
  const schema = Joi.object({
    Borclu_Kisi_TC: Joi.string()
      .length(11)
      .allow("")
      .messages({
        "string.length": "TC Kimlik Numarası 11 haneli olmalıdır",
      }), 
    Borclu_Aciklama: Joi.string()
      .max(200)
      .required()
      .pattern(/^(e|r)\|.*$/)
      .messages({
        "string.pattern.base": "Açıklama 'e|' (editable) veya 'r|' (readonly) ile başlamalıdır",
        "string.max": "Açıklama en fazla 200 karakter olabilir",
      }), 
    Borclu_Tutar: Joi.string()
      .pattern(/^(e|r)\|\d{1,3}(\.\d{3})*(,\d{2})$/)
      .required()
      .messages({
        "string.pattern.base": "Tutar geçerli bir formatta olmalı. Örneğin: 1000,50",
      }), 
    Borclu_GSM: Joi.string()
      .min(3)
      .max(12)
      .allow("")
      .pattern(/^(e|r)\|[1-9][0-9]{9}$/)
      .messages({
        "string.pattern.base": "Telefon numarası 10 haneli olmalı ve başında 0 olmamalı",
      }),    
    Borclu_Odeme_Tip: Joi.string()
      .pattern(/^(e|r)\|.*$/)
      .required()
      .messages({
        "string.pattern.base": "Ödeme tipi 'e|' (editable) veya 'r|' (readonly) ile başlamalıdır",
      }), 
    Borclu_AdSoyad: Joi.string()
      .max(100)
      .pattern(/^(e|r)\|.*$/)
      .required()
      .messages({
        "string.pattern.base": "Ad ve Soyad 'e|' (editable) veya 'r|' (readonly) ile başlamalıdır",
        "string.max": "Ad ve Soyad en fazla 100 karakter olabilir",
      }), 
    Return_URL: Joi.string()
      .pattern(/^(e|r)\|https?:\/\/[^\s$.?#].[^\s]*$/)
      .required()
      .messages({
        "string.pattern.base": "Geçerli bir URL giriniz. Örneğin: e|https://example.com veya r|https://example.com",
      }),
    Islem_ID: Joi.string().required(), 
    Taksit: Joi.number()
      .integer()
      .min(0)
      .max(9)
      .required()
      .messages({
        "number.base": "Taksit bir sayı olmalı",
        "number.min": "Taksit sayısı en az 0 olabilir",
        "number.max": "Taksit sayısı en fazla 9 olabilir",
      }), 
    Terminal_ID: Joi.number()
      .integer()
      .min(10000)
      .max(99999)
      .required()
      .messages({
        "number.base": "Terminal ID bir sayı olmalı",
        "number.min": "Terminal ID 5 basamaklı olmalıdır",
        "number.max": "Terminal ID 5 basamaklı olmalıdır",
      }), 
  });

  return schema.validate(data);
};
