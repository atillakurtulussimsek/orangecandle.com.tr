import Joi from "joi";

export const IslemIzlemeModel = (data) => {
  const schema = Joi.object({
    Tarih_Bas: Joi.string()
      .pattern(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/)
      .required()
      .messages({
        "string.base": "Başlangıç tarihi bir metin olmalıdır",
        "string.pattern.base": "Başlangıç tarihi 'dd.MM.yyyy HH:mm:ss' formatında olmalıdır (örn: 20.11.2015 00:00:00)",
        "any.required": "Başlangıç tarihi zorunludur",
      }),
    Tarih_Bit: Joi.string()
      .pattern(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/)
      .required()
      .messages({
        "string.base": "Bitiş tarihi bir metin olmalıdır",
        "string.pattern.base": "Bitiş tarihi 'dd.MM.yyyy HH:mm:ss' formatında olmalıdır (örn: 20.11.2015 15:15:00)",
        "any.required": "Bitiş tarihi zorunludur",
      }),
    Islem_Tip: Joi.string()
      .valid("İptal", "İade", "Satış")
      .messages({
        "string.base": "İşlem tipi bir metin olmalıdır",
        "any.only": "İşlem tipi yalnızca 'İptal', 'İade' veya 'Satış' olabilir",
      }),
    Islem_Durum: Joi.string()
      .valid("Başarılı", "Başarısız")
      .messages({
        "string.base": "İşlem durumu bir metin olmalıdır",
        "any.only": "İşlem durumu yalnızca 'Başarılı' veya 'Başarısız' olabilir",
      }),
  });

  return schema.validate(data);
};
