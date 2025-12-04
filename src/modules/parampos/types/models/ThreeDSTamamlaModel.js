import Joi from "joi";

export const ThreeDSTamamlaModel = (data) => {
  const schema = Joi.object({
    UCD_MD: Joi.string().required(),
    Islem_GUID: Joi.string().required(),
    Siparis_ID: Joi.string().required(),
  });

  return schema.validate(data);
};
