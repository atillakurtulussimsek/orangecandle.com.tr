import Joi from "joi";

export const IslemIptalVeIadeModel = (data) => {
  const schema = Joi.object({
    Durum: Joi.string()
      .valid("IPTAL", "IADE")
      .required()
      .messages({
        "string.base": "Durum bir metin olmalıdır",
        "any.only": "Durum yalnızca 'IPTAL' veya 'IADE' olabilir",
        "any.required": "Durum zorunludur",
      }),
    Siparis_ID: Joi.string()
      .required()
      .messages({
        "string.base": "Sipariş ID bir metin olmalıdır",
        "any.required": "Sipariş ID zorunludur",
      }),
    Tutar: Joi.number()
      .required()
      .messages({
        "number.base": "Tutar bir sayı olmalıdır",
        "any.required": "Tutar zorunludur",
      }),
  });

  return schema.validate(data);
};
