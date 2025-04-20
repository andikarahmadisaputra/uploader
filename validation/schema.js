const Joi = require("joi");

const loginSchema = Joi.object({
  username: Joi.string().min(3).alphanum().required().messages({
    "string.base": "Username must be a string.",
    "string.empty": "Username is required.",
    "string.min": "Username must be at least 3 characters.",
    "string.alphanum": "Username can only contain letters and numbers.",
    "any.required": "Username is required.",
  }),
  password: Joi.string().min(8).required().messages({
    "string.base": "Password must be a string.",
    "string.empty": "Password is required.",
    "string.min": "Password must be at least 8 characters.",
    "any.required": "Password is required.",
  }),
});

const createUserSchema = Joi.object({
  username: Joi.string().min(3).alphanum().required().messages({
    "string.base": "Username must be a string.",
    "string.empty": "Username is required.",
    "string.min": "Username must be at least 3 characters.",
    "string.alphanum": "Username can only contain letters and numbers.",
    "any.required": "Username is required.",
  }),
  password: Joi.string().min(8).required().messages({
    "string.base": "Password must be a string.",
    "string.empty": "Password is required.",
    "string.min": "Password must be at least 8 characters.",
    "any.required": "Password is required.",
  }),
  name: Joi.string().min(3).required().messages({
    "string.base": "Name must be a string.",
    "string.empty": "Name is required.",
    "string.min": "Name must be at least 3 characters.",
    "any.required": "Name is required.",
  }),
  gender: Joi.string().valid("male", "female").required().messages({
    "any.only": "Gender must be either 'male' or 'female'.",
    "string.base": "Gender must be a string.",
    "string.empty": "Gender is required.",
    "any.required": "Gender is required.",
  }),
});

const editUserSchema = Joi.object({
  username: Joi.string().min(3).alphanum().required().messages({
    "string.base": "Username must be a string.",
    "string.empty": "Username is required.",
    "string.min": "Username must be at least 3 characters.",
    "string.alphanum": "Username can only contain letters and numbers.",
    "any.required": "Username is required.",
  }),
  name: Joi.string().min(3).required().messages({
    "string.base": "Name must be a string.",
    "string.empty": "Name is required.",
    "string.min": "Name must be at least 3 characters.",
    "any.required": "Name is required.",
  }),
  gender: Joi.string().valid("male", "female").required().messages({
    "any.only": "Gender must be either 'male' or 'female'.",
    "string.base": "Gender must be a string.",
    "string.empty": "Gender is required.",
    "any.required": "Gender is required.",
  }),
});

const passwordUserSchema = Joi.object({
  password: Joi.string().min(8).required().label("Password").messages({
    "string.base": "Password must be a string.",
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters long",
    "any.required": "Password is required.",
  }),

  passwordConfirm: Joi.any()
    .valid(Joi.ref("password"))
    .required()
    .label("Password confirmation")
    .messages({
      "any.only": "Password confirmation does not match password",
      "any.required": "Password confirmation is required",
    }),
});

module.exports = {
  loginSchema,
  createUserSchema,
  editUserSchema,
  passwordUserSchema,
};
