import { Request, Response, NextFunction } from 'express'
import { validateGroup, validateEntry, validateMeta } from '../../src/api/middleware'

describe('Validation Middleware', (): void => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction

    beforeEach((): void => {
        //Mock request values
        req = { params: {}, body: {} }
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
        next = jest.fn()
    })

    describe('validateGroup', (): void => {
        test('should pass validation for valid group parameter', (): void => {
            req.params = { group: 'validGroup' }
            validateGroup(req as Request, res as Response, next)

            expect(next).toHaveBeenCalled()
        })

        test('should fail validation for missing group parameter', (): void => {
            req.params = {}
            validateGroup(req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) })
            expect(next).not.toHaveBeenCalled()
        })

        test('should fail validation for invalid group parameter type', (): void => {
            req.params = { group: 123 as any }
            validateGroup(req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) })
            expect(next).not.toHaveBeenCalled()
        })
    })

    describe('validateEntry', (): void => {
        test('should pass validation for valid group and id parameters', (): void => {
            req.params = { group: 'validGroup', id: '571f09f5-715c-404b-ae1c-6543cd322d2f' }
            validateEntry(req as Request, res as Response, next)
            expect(next).toHaveBeenCalled()
            expect(res.status).not.toHaveBeenCalled()
        })

        test('should fail validation for missing id parameter', (): void => {
            req.params = { group: 'validGroup' }
            validateEntry(req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) })
            expect(next).not.toHaveBeenCalled()
        })

        test('should fail validation for invalid UUID id parameter', (): void => {
            req.params = { group: 'validGroup', id: 'invalid-uuid' }
            validateEntry(req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) })
            expect(next).not.toHaveBeenCalled()
        })

        test('should fail validation for missing group parameter', (): void => {
            req.params = { id: '123e4567-e89b-12d3-a456-426614174000' }
            validateEntry(req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) })
            expect(next).not.toHaveBeenCalled()
        })
    })

    describe('validateMeta', (): void => {
        test('should pass validation for valid meta object in body', (): void => {
            req.body = { meta: { key: 'value' } }
            validateMeta(req as Request, res as Response, next)

            expect(next).toHaveBeenCalled()
            expect(res.status).not.toHaveBeenCalled()
        })

        test('should fail validation for incorrect meta field type', (): void => {
            req.body = { meta: 'notAnObject' }
            validateMeta(req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) })
            expect(next).not.toHaveBeenCalled()
        })
    })
})
