import Joi from "joi";

export const IslemSorgulamaModel = (data) => {
  const schema = Joi.object({
    Dekont_ID: Joi.string()
      .required()
      .messages({
        "string.base": "Dekont ID bir metin olmalıdır",
        "any.required": "Dekont ID zorunludur",
      }),
    Siparis_ID: Joi.string()
      .allow("")
      .messages({
        "string.base": "Sipariş ID bir metin olmalıdır",
      }),
    Islem_ID: Joi.string()
      .allow("")
      .messages({
        "string.base": "İşlem ID bir metin olmalıdır",
      }),
  });

  return schema.validate(data);
};
