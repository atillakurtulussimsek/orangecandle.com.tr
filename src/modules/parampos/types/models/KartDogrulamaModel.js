import Joi from "joi";

export const KartDogrulamaModel = (data) => {
  const schema = Joi.object({
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
    Return_URL: Joi.string().max(256).allow(""),
    Data1: Joi.string().max(250).allow(""),
    Data2: Joi.string().max(250).allow(""),
    Data3: Joi.string().max(250).allow(""),
    Data4: Joi.string().max(250).allow(""),
    Data5: Joi.string().max(250).allow(""),
  });

  return schema.validate(data);
};
