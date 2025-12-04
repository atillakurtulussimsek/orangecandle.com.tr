import Joi from "joi";

export const DekontModel = (data) => {
  const schema = Joi.object({
    Dekont_ID: Joi.string()
      .required()
      .messages({
        "string.base": "Dekont ID bir metin olmalıdır",
        "any.required": "Dekont ID zorunludur",
      }),
    E_Posta: Joi.string()
      .email()
      .max(100)
      .messages({
        "string.base": "E-posta adresi bir metin olmalıdır",
        "string.email": "Geçerli bir e-posta adresi giriniz",
        "string.max": "E-posta adresi en fazla 100 karakter olmalıdır",
      }),
  });

  return schema.validate(data);
};
