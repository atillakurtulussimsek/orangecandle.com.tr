import Joi from "joi";

export const SakliKartSilmeModel = (data) => {
  const schema = Joi.object({
    KS_GUID: Joi.string().length(36).required().messages({
      "string.length": "KS_GUID 36 karakter uzunluğunda olmalıdır.",
    }),
    KK_Islem_ID: Joi.string().max(200).required().messages({
      "string.max": "KK_Islem_ID en fazla 200 karakter olabilir.",
    }),
  });

  return schema.validate(data);
};
