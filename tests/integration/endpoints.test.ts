import request, { Response } from 'supertest'
import { app, shutdown } from '../../server'
import { connect, disconnect, flushall } from '../../src/redis'
import { setEntry, stopCleanupTimer } from '../../src/heartbeat'

describe('API Endpoints', (): void => {
    beforeAll(async (): Promise<void> => {
        await connect()
    })

    afterAll(async (): Promise<void> => {
        stopCleanupTimer()
        await flushall()
        await disconnect()
        await shutdown()
    })

    beforeEach(async (): Promise<void> => {
        await flushall()
    })

    //Create heartbeat
    test('POST /:group/:id should register a heartbeat', async (): Promise<void> => {
        //Register client heartbeat
        const group: string = 'testGroup'
        const id: string = '8fc66602-52ff-4e98-9099-0a3caa35078c'

        const res: Response = await request(app).post(`/api/v1/${group}/${id}`)
        const { createdAt, updatedAt }: { createdAt: number; updatedAt: number }  = res.body

        expect(res.statusCode).toBe(200)
        expect(createdAt).toEqual(updatedAt)
        expect(res.body).toMatchObject({
            id,
            group,
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
            meta: expect.any(Object)
        })
    })

    //Update heartbeat
    test('POST /:group/:id should register a heartbeat', async (): Promise<void> => {
        //Insert value into redis
        const group: string = 'testGroup'
        const id: string = '39738366-7765-4fdb-bb8e-a7a63a01494b'

        await setEntry(group, id)

        const res: Response = await request(app).post(`/api/v1/${group}/${id}`)
        const { createdAt, updatedAt }: { createdAt: number; updatedAt: number } = res.body

        expect(res.statusCode).toBe(200)
        expect(createdAt).not.toEqual(updatedAt)
        expect(res.body).toMatchObject({
            id,
            group,
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
            meta: expect.any(Object)
        })
    })

    test('GET / should return active groups', async (): Promise<void> => {
        //Insert value into redis
        await Promise.all([
            setEntry('testGroup', '32739383-53aa-4e0e-9409-58641d675c60'),
            setEntry('testGroup', 'bc6ee057-b23e-46f5-bfce-baf5b8aa27fc'),
            setEntry('testGroup2', 'ea298141-8355-4aab-8afe-8a85403a361a')
        ])

        //Get groups
        const res: Response = await request(app).get(`/api/v1/`)

        expect(res.statusCode).toBe(200)
        expect(res.body).toBeInstanceOf(Array)
        expect(res.body).toHaveLength(2)
        expect(res.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                group: "testGroup",
                instances: 2,
                createdAt: expect.any(Number),
                updatedAt: expect.any(Number)
              }),
              expect.objectContaining({
                group: "testGroup2",
                instances: 1,
                createdAt: expect.any(Number),
                updatedAt: expect.any(Number)
              })
            ])
        )
    })

    test('GET /:group should return active instances', async (): Promise<void> => {
        //Insert value into redis
        await Promise.all([
            setEntry('testGroup', '32739383-53aa-4e0e-9409-58641d675c60'),
            setEntry('testGroup', 'bc6ee057-b23e-46f5-bfce-baf5b8aa27fc'),
            setEntry('testGroup2', 'ea298141-8355-4aab-8afe-8a85403a361a')
        ])

        //Get groups
        const group: string = 'testGroup'
        const res: Response = await request(app).get(`/api/v1/${group}`)

        expect(res.statusCode).toBe(200)
        expect(res.body).toBeInstanceOf(Array)
        expect(res.body).toHaveLength(2)
        expect(res.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                group: "testGroup",
                id: "32739383-53aa-4e0e-9409-58641d675c60",
                createdAt: expect.any(Number),
                updatedAt: expect.any(Number),
                meta: expect.any(Object)
              }),
              expect.objectContaining({
                group: "testGroup",
                id: "bc6ee057-b23e-46f5-bfce-baf5b8aa27fc",
                createdAt: expect.any(Number),
                updatedAt: expect.any(Number),
                meta: expect.any(Object)
              })
            ])
        )
    })

    test('DELETE /:group/:id should remove an entry', async (): Promise<void> => {
        //Insert entry
        const group: string = 'testGroup'
        const id: string = '32739383-53aa-4e0e-9409-58641d675c60'
        await setEntry(group, id)

        //Delete entry
        const res: Response = await request(app).delete(`/api/v1/${group}/${id}`)
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual(1)
    })
})
