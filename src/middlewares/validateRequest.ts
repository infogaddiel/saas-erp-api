import { RequestHandler } from 'express';
import Joi from 'joi';

const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'params' | 'query' = 'body'): RequestHandler => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });

    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors: details });
    }

    // Replace with the validated value
    req[property] = value;
    next();
  };
};

export default validateRequest;
