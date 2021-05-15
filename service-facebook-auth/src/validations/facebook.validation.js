const Joi = require('joi');
const mongoose = require('mongoose');

const isObjectId = (value, helpers) => {
  if (mongoose.Types.ObjectId.isValid(value)) return true;
  return helpers.message('Invalid objectId')
};

module.exports = {
  saveToken: Joi.object({
    accessToken: Joi.string().required(),
  }),
  verifyToken: Joi.object({
    accessToken: Joi.string().required(),
  }),
  removeAccount: Joi.object({
    id: Joi.string().required(),
  }),
  removeObjects: Joi.object({
    ids: Joi.array().items(Joi.custom(isObjectId)).required(),
  }),
  getPages: Joi.object({
    id: Joi.string().required(),
    isClone: Joi.string()
  }),
  getPagesMess: Joi.object({
    isClone: Joi.string()
  }),
  subscribe: Joi.object({
    pageID: Joi.string().required(),
  }),
  getObject: Joi.object({
    ids: Joi.array().required(),
  }),
  idValid: Joi.object({
    id: Joi.custom(isObjectId).required(),
  }),
  picture: Joi.object({
    pageID: Joi.custom(isObjectId).required(),
    psid: Joi.string().required(),
  }),
};
