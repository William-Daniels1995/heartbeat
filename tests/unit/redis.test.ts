import { connect, disconnect, isConnected, flushdb, flushall, Hash, hset, hgetall, del, keys, sadd, smembers, srem } from '../../src/redis'

describe('Redis Client', (): void => {
    beforeEach(async (): Promise<void> => {
        await connect()
        await flushall()
    })

    afterEach(async (): Promise<void> => {
        const connected: boolean = isConnected()
        if (connected) {
            await flushall()
            await disconnect()
        }
    })

    describe('Connectivity', (): void => {
        it('Connect to redis', async (): Promise<void> => {
            const connected: boolean = isConnected()
            expect(connected).toEqual(true)
        })

        it('Disconnect from redis', async (): Promise<void> => {
            await disconnect()
            const connected: boolean = isConnected()
            expect(connected).toEqual(false)
        })
    })

    describe('Data Functions', (): void => {
        it('HSET and HGETALL should set and get a key pair value', async (): Promise<void> => {
            const key: string = 'app:testKey'

            //Insert key pair value
            const value: Hash = { field1: 'value1' }
            const result: number = await hset(key, value)
            expect(result).toEqual(1)

            //Get key pair value
            const instance: Hash = await hgetall(key)
            expect(instance).toMatchObject(value)
        })
        
        it('DEL should delete a hash', async (): Promise<void> => {
            const key: string = 'app:testKey'

            //Insert key pair value
            const value: Hash = { field1: 'value1' }
            await hset(key, value)

            //Delete key pair value
            const deleted: number = await del(key)
            expect(deleted).toEqual(1)
        })
        
        it('KEYS should return a list of keys matching a pattern', async (): Promise<void> => {
            //Insert key pair values
            const value: Hash = { field1: 'value1' }
            await hset('app:testKey', value)
            await hset('app:testKey2', value)

            const keyList: string[] = await keys('app:*')

            expect(keyList).toBeInstanceOf(Array)
            expect(keyList).toHaveLength(2)
        })
        
        it('SADD and SMEMBERS should insert values into a set and read the members', async (): Promise<void> => {
            const key: string = 'groups'

            const add: number = await sadd(key, 'testGroup')
            expect(add).toBe(1)

            const duplicate: number = await sadd(key, 'testGroup')
            expect(duplicate).toBe(0)
            
            const members: string[] = await smembers(key)
            expect(members).toBeInstanceOf(Array)
            expect(members).toHaveLength(1)
        })
        
        it('SREM should delete a value from a set', async (): Promise<void> => {
            const key: string = 'groups'
            const value: string = 'testGroup'

            //Add the value
            await sadd(key, value)

            //Delete the value
            const deleted: number = await srem(key, value)
            expect(deleted).toEqual(1)
        })

        it('FLUSHDB should clear the database', async (): Promise<void> => {
            //Insert key pair value
            const value: Hash = { field1: 'value1' }
            const insert: number = await hset('app:testKey', value)
            expect(insert).toEqual(1)

            //Flush the db
            await flushdb()

            //Check how many records are left
            const keyList: string[] = await keys('app:*')
            expect(keyList).toBeInstanceOf(Array)
            expect(keyList).toHaveLength(0)
        })

        it('FLUSHALL should clear everything', async (): Promise<void> => {
            //Insert key pair value
            const value: Hash = { field1: 'value1' }
            const insert: number = await hset('app:testKey', value)
            expect(insert).toEqual(1)

            //Flush everything
            await flushall()

            //Check how many records are left
            const keyList: string[] = await keys('*')
            expect(keyList).toBeInstanceOf(Array)
            expect(keyList).toHaveLength(0)
        })
    })
})
