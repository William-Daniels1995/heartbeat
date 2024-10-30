import request, { Response } from 'supertest'
import { app, shutdown } from '../../server'
import { connect, disconnect, flushall } from '../../src/redis'
import { Entry, getEntry, stopCleanupTimer } from '../../src/heartbeat'
import { sleep } from '../../src/utils/functions'

//Environment variables
const EXPIRY_AGE: number = 2000
const CLEANUP_INTERVAL: number = 5000

describe('End-to-End Flow', (): void => {
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

    //How long it will take until an entry will be deleted
    const waitTime: number = Math.ceil(EXPIRY_AGE / CLEANUP_INTERVAL) * CLEANUP_INTERVAL
    const timeout: number = waitTime + 5000

    test('Track and remove client after heartbeat expires', async (): Promise<void> => {
        //Register client heartbeat
        const group: string = 'clientE2E'
        const id: string = 'ed822cd8-2b55-49c1-b3bf-5352a0fae6ec'
        const res: Response = await request(app).post(`/api/v1/${group}/${id}`)
        expect(res.statusCode).toBe(200)

        //Ensure client is active
        const lookup: Entry | undefined = await getEntry(group, id)
        expect(lookup).toMatchObject({
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
            meta: expect.any(Object)
        })

        //Wait for heartbeat expiration and trigger cleanup
        await sleep(waitTime)

        //Verify entry is removed
        const entry: Entry | undefined = await getEntry(group, id)
        expect(entry).toBeUndefined()
    }, timeout)
})
