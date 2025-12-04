import Joi from "joi";

export const KartSaklamaListesiModel = (data) => {
  const schema = Joi.object({
    KK_Kart_Adi: Joi.string()
      .required()
      .messages({
        "string.base": "Kart adı bir metin olmalıdır",
        "any.required": "Kart adı zorunludur",
      }),
    KK_Islem_ID: Joi.string()
      .allow("")
      .messages({
        "string.base": "Kart İşlem ID bir metin olmalıdır",
      }),
      
  });

  return schema.validate(data);
};
