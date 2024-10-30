import { createClient, RedisClientType } from 'redis'
import { sleep } from './utils/functions'

// Define Redis types
export type Hash = { [key: string]: string }

// Retry configuration for Redis connection
const RETRY_ATTEMPTS: number = Number(process.env.REDIS_RETRY_ATTEMPTS) || 3
const RETRY_DELAY_MS: number = Number(process.env.REDIS_RETRY_DELAY_MS) || 1500

class RedisClient {
  private client: RedisClientType

  constructor() {
    const { REDIS_HOST_PROD, REDIS_HOST_TEST, REDIS_PORT, NODE_ENV } = process.env
    const isProd: boolean = NODE_ENV === 'production'
    const REDIS_HOST: string = ( isProd ? REDIS_HOST_PROD : REDIS_HOST_TEST ) || '127.0.0.1'

    this.client = createClient({
      url: `redis://${REDIS_HOST}:${REDIS_PORT || '6379'}`
    })

    // Connect to Redis and handle errors
    this.client.on('connect', (): void => {
      console.log('Connected to Redis')
    })

    this.client.on('error', console.error)

    //Connect to redis and retry upon failure
    this.connectWithRetries(RETRY_ATTEMPTS).catch(console.error)
  }

  //Connect to the redis server, retry if failed
  private async connectWithRetries(retries: number = RETRY_ATTEMPTS): Promise<void> {
    await this.client.connect().catch(console.error)

    if (this.client.isReady) return

    console.warn(`Redis connection failed. Retrying in ${RETRY_DELAY_MS} ms... (${retries} attempts left)`)
    
    if (retries > 0) {
      await sleep(RETRY_DELAY_MS)
      return this.connectWithRetries(retries - 1)
    }
  }

  //HSET: Sets fields in a hash
  async hset(key: string, value: Hash): Promise<number> {
    const data: number = await this.client.hSet(key, value)
    return data
  }

  //HGETALL: Gets all fields and values in a hash
  async hgetall(key: string): Promise<Hash> {
    const data: Hash = await this.client.hGetAll(key) as Hash
    return data
  }

  //DEL: Deletes a hash
  async del(key: string): Promise<number> {
    const data: number = await this.client.del(key)
    return data
  }

  //KEYS: Gets keys that match a pattern
  async keys(pattern: string): Promise<string[]> {
    const data: string[] = await this.client.keys(pattern)
    return data
  }

  //SADD: Adds an item to a set
  async sadd(key: string, value: string): Promise<number> {
    const data: number = await this.client.sAdd(key, value)
    return data
  }

  //SMEMBERS: Gets all the unique items in a set
  async smembers(key: string): Promise<string[]> {
    const data: string[] = await this.client.sMembers(key)
    return data
  }

  //SREM: Deletes an item from set
  async srem(key: string, value: string): Promise<number> {
    const data: number = await this.client.sRem(key, value)
    return data
  }

  //FLUSHDB: Clears data in the current database
  async flushdb(): Promise<string> {
    const data: string = await this.client.flushDb()
    return data
  }

  //FLUSHDB: Clears everything
  async flushall(): Promise<string> {
    const data: string = await this.client.flushAll()
    return data
  }

  //CONNECT: Connect to the Redis server
  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.connectWithRetries(RETRY_ATTEMPTS)
    }
  }

  //DISCONNECT: Gracefully close the Redis connection
  async disconnect(): Promise<string> {
    const data: string = await this.client.quit()
    return data
  }

  //ISCONNECTED: Check if the redis client is connected
  isConnected(): boolean {
    return this.client.isOpen && this.client.isReady
  }
}

const redisClient: RedisClient = new RedisClient()

//Graceful shutdown
const shutdown = async (): Promise<void> => {
  await redisClient.disconnect().catch(console.error)
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

//Export a singleton instance of the client
export default redisClient

//Export core functions
export const connect = (): Promise<void> => redisClient.connect()
export const isConnected = (): boolean => redisClient.isConnected()
export const disconnect = (): Promise<string> => redisClient.disconnect()

//Export data functions
export const hset = (key: string, hash: Hash): Promise<number> => redisClient.hset(key, hash)
export const hgetall = (key: string): Promise<Hash> => redisClient.hgetall(key)
export const del = (key: string): Promise<number> => redisClient.del(key)
export const keys = (pattern: string): Promise<string[]> => redisClient.keys(pattern)
export const sadd = (key: string, value: string): Promise<number> => redisClient.sadd(key, value)
export const smembers = (key: string): Promise<string[]> => redisClient.smembers(key)
export const srem = (key: string, value: string): Promise<number> => redisClient.srem(key, value)
export const flushdb = (): Promise<string> => redisClient.flushdb()
export const flushall = (): Promise<string> => redisClient.flushall()