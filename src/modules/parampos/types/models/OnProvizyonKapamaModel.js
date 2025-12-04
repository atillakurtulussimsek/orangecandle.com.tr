import Joi from "joi";
export const OnProvizyonKapamaModel = (data) => {
  const schema = Joi.object({
    Prov_ID: Joi.string().allow(""), 
    Prov_Tutar: Joi.string()
      .required(), 
    Siparis_ID: Joi.string().required(),
  });
  return schema.validate(data);
};