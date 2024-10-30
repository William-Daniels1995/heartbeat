import { Request, Response, NextFunction, RequestHandler } from 'express'
import Joi, { ObjectSchema, ValidationError } from 'joi'

//Custom Types for Request Parameters
interface GroupRequest { group: string }
interface IdRequest { id: string }
interface MetaRequest { meta: object }
interface EntryRequest extends GroupRequest, IdRequest {}

/**
 * Validates path
 * @param {object} schema - Joi schema object to validate request parameters
 * @returns Express middleware that validates req.params
 */
const validatePath = (schema: ObjectSchema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params)
    if (error) return validationError(res, error)
    return next()
  }
}

/**
 * Validates body
 * @param {object} schema - Joi schema object to validate request parameters
 * @returns Express middleware that validates req.body
 */
const validateBody = (schema: ObjectSchema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body)
    if (error) return validationError(res, error)
    return next()
  }
}

//Schema for group
const groupSchema: ObjectSchema<GroupRequest> = Joi.object({
  group: Joi.string().required(),
})

//Schema for group & id
const entrySchema: ObjectSchema<EntryRequest> = Joi.object({
  id: Joi.string().uuid({ version: ['uuidv4', 'uuidv5'] }).required(),
  group: Joi.string().required()
})

//Schema for meta data
const metaSchema: ObjectSchema<MetaRequest> = Joi.object({
  meta: Joi.object()
})

//Utility to handle validation errors
const validationError = (res: Response, error?: ValidationError): void => {
  const message: string = error?.details?.[0]?.message || 'Validation error'
  res.status(400).json({ error: message })
}

export const validateGroup: RequestHandler = validatePath(groupSchema)
export const validateEntry: RequestHandler = validatePath(entrySchema)
export const validateMeta: RequestHandler = validateBody(metaSchema)
