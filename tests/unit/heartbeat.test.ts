import { Entry, FullEntry, Group, setEntry, getEntry, stopCleanupTimer, getGroup, getGroups, deleteEntry } from '../../src/heartbeat'
import { connect, disconnect, flushall } from '../../src/redis'
import { sleep } from '../../src/utils/functions'

//Environment variables
const EXPIRY_AGE = 2000
const CLEANUP_INTERVAL = 5000

describe('Heartbeat Module', (): void => {
    beforeAll(async (): Promise<void> => {
        await connect()
    })

    afterAll(async (): Promise<void> => {
        stopCleanupTimer()
        await flushall()
        await disconnect()
    })

    beforeEach(async (): Promise<void> => {
        await flushall()
    })

    test('Create a new heartbeat entry', async (): Promise<void> => {
        const group: string = 'groupTest'
        const id: string = 'b5d66b1b-9c85-466a-af31-54886b1a58fe'

        const entry: FullEntry = await setEntry(group, id)
        const { createdAt, updatedAt }: { createdAt: number; updatedAt: number }  = entry

        expect(createdAt).toEqual(updatedAt)
        expect(entry).toMatchObject({
            id,
            group,
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
            meta: expect.any(Object)
        })
    })

    test('Update an existing heartbeat entry', async (): Promise<void> => {
        const group: string = 'groupTest'
        const id: string = 'b5d66b1b-9c85-466a-af31-54886b1a58fe'

        //Create heartbeat entry
        await setEntry(group, id)

        //Update entry
        const entry: FullEntry = await setEntry(group, id)
        const { createdAt, updatedAt }: { createdAt: number; updatedAt: number }  = entry

        expect(createdAt).not.toEqual(updatedAt)
        expect(entry).toMatchObject({
            id,
            group,
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
            meta: expect.any(Object)
        })
    })

    test('Get heartbeat entry', async (): Promise<void> => {
        const group: string = 'groupTest'
        const id: string = 'b5d66b1b-9c85-466a-af31-54886b1a58fe'

        //Create heartbeat entry
        await setEntry(group, id)

        //Get entry
        const entry: Entry | undefined = await getEntry(group, id)
        expect(entry).toMatchObject({
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
            meta: expect.any(Object)
        })
    })

    test('Get list of groups and summaries', async (): Promise<void> => {
        //Insert value into redis
        await Promise.all([
            setEntry('testGroup', '32739383-53aa-4e0e-9409-58641d675c60'),
            setEntry('testGroup', 'bc6ee057-b23e-46f5-bfce-baf5b8aa27fc'),
            setEntry('testGroup2', 'ea298141-8355-4aab-8afe-8a85403a361a')
        ])

        //Get groups
        const groups: Group[] = await getGroups()

        expect(groups).toEqual(
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

    test('Get list of entries in a group', async (): Promise<void> => {
        //Insert value into redis
        await Promise.all([
            setEntry('testGroup', '32739383-53aa-4e0e-9409-58641d675c60'),
            setEntry('testGroup', 'bc6ee057-b23e-46f5-bfce-baf5b8aa27fc'),
            setEntry('testGroup2', 'ea298141-8355-4aab-8afe-8a85403a361a')
        ])

        //Get group
        const groups: FullEntry[] = await getGroup('testGroup')

        expect(groups).toEqual(
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
    }),

    test('Delete heartbeat entry', async (): Promise<void> => {
        const group: string = 'groupTest'
        const id: string = 'b5d66b1b-9c85-466a-af31-54886b1a58fe'

        //Create heartbeat entry
        await setEntry(group, id)

        //Delete entry
        const deleted: number = await deleteEntry(group, id)
        expect(deleted).toEqual(1)
    })

    //How long it will take until an entry will be deleted
    const waitTime: number = Math.ceil(EXPIRY_AGE / CLEANUP_INTERVAL) * CLEANUP_INTERVAL
    const timeout: number = waitTime + 5000

    test('Remove heartbeat entry through the cleanup timer', async (): Promise<void> => {
        const group: string = 'groupTest'
        const id: string = 'b5d66b1b-9c85-466a-af31-54886b1a58fe'

        //Create heartbeat entry
        await setEntry(group, id)

        //Sleep
        await sleep(waitTime)

        //Verify entry is removed
        const entry: Entry | undefined = await getEntry(group, id)
        expect(entry).toBeUndefined()
        
    }, timeout)
})
