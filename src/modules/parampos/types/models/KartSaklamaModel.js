import Joi from "joi";

export const KartSaklamaModel = (data) => {
  const schema = Joi.object({
    KK_Sahibi: Joi.string().required(),
    KK_No: Joi.string().creditCard().required(),
    KK_SK_Ay: Joi.string()
      .pattern(/^[0-9]{2}$/)
      .required(),
    KK_SK_Yil: Joi.string()
      .pattern(/^[0-9]{2}$/)
      .required(),
    KK_Kart_Adi: Joi.string().required(),
    KK_Islem_ID: Joi.string().allow(""),
  });

  return schema.validate(data);
};
