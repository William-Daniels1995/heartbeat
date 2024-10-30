import { Hash, hset, hgetall, del, keys, sadd, smembers, srem } from './redis'

//UUID
type UUID = string

//Environment variables
const GROUPS_KEY: string = 'groups'
const EXPIRY_AGE: number = Number(process.env.EXPIRY_AGE) || 2000
const CLEANUP_INTERVAL: number = Number(process.env.CLEANUP_INTERVAL) || 3000

//Interfaces for different data structures
export interface Group {
  group: string
  instances: number
  createdAt: number
  updatedAt: number
}

export interface Entry {
  createdAt: number
  updatedAt: number
  meta: Record<string, unknown>
}

export type FullEntry = Entry & {
  id: UUID
  group: string
}

//Converts a json to redis entry
const constructHash = (fields: Entry): Hash => ({
  createdAt: fields.createdAt.toString(),
  updatedAt: fields.updatedAt.toString(),
  meta: JSON.stringify(fields.meta),
})

//Converts a redis entry to json
const deconstructHash = (instance: Hash): Entry => ({
  createdAt: parseInt(instance.createdAt),
  updatedAt: parseInt(instance.updatedAt),
  meta: JSON.parse(instance.meta)
})

/**
 * Gets an entry
 * @param {string} group - Group to query
 * @param {uuid} id - Id of entry
 * @returns {Promise<Entry | undefined>} An entry
 */
export const getEntry = async (group: string, id: UUID): Promise<Entry | undefined> => {
  const key: string = `app:${group}:${id}`

  //Lookup entry
  const instance: Hash = await hgetall(key)
  const exists: boolean = !!Object.keys(instance).length
  if (!exists) return undefined

  //Convert to json and return
  const data: Entry = deconstructHash(instance)
  return data
}

/**
 * Gets a list of instances in a group
 * @param {string} group - Group to query
 * @returns {Promise<FullEntry[]>} An array of instances
 */
export const getGroup = async (group: string): Promise<FullEntry[]> => {
  //Get a list of keys beloning to a group
  const keyList: string[] = await keys(`app:${group}:*`)
  console.log(`Found ${keyList.length} entries for group ${group}`)

  //For each key in the group, lookup the instance data
  const lookups = keyList.map(async (key: string): Promise<FullEntry> => {
    const instance: Hash = await hgetall(key)
    return { id: key.split(':')[2], group, ...deconstructHash(instance) }
  })

  //Lookup the group in parallel
  const instances: FullEntry[] = await Promise.all<FullEntry>(lookups)
  return instances
}

/**
 * Gets a list of groups with information
 * @returns {Promise<Group[]>} An array of groups
 */
export const getGroups = async(): Promise<Group[]> => {
  //Get a list of entry keys beloning to a group
  const groups: string[] = await smembers(GROUPS_KEY)
  console.log(`Found ${groups.length} groups`)

  //Get the data belonging to each group
  const groupData = groups.map(async (group: string): Promise<Group> => {
    const keyList: string[] = await keys(`app:${group}:*`)

    //Lookup each entry in a group
    const lookups = keyList.map(async (key: string): Promise<Entry> => {
      const data: Hash = await hgetall(key)
      return deconstructHash(data)
    })

    //Lookup each group entry in parallel
    const instances: Entry[] = await Promise.all(lookups)

    //Get the first and last heartbeat for a group
    const createdAt: number = Math.min(...instances.map((entry) => entry?.createdAt || Infinity)) || 0
    const updatedAt: number = Math.max(...instances.map((entry) => entry?.updatedAt || -Infinity)) || 0

    return { group, instances: instances.length, createdAt, updatedAt }
  })

  //Lookup the groups in parallel
  const instances: Group[] = await Promise.all<Group>(groupData)

  // Filter out groups with no instances
  return instances.filter((instance): instance is Group => instance.instances !== 0)
}

/**
 * Creates or updates an entry
 * @param {string} group - Group to add the entry to
 * @param {uuid} id - Id of the entry
 * @param {Record<string, unknown>} meta - Meta data of the entry
 * @returns {Promise<FullEntry>} The entry object
 */
export const setEntry = async (group: string, id: UUID, meta: Record<string, unknown> = {}): Promise<FullEntry> => {
  const key: string = `app:${group}:${id}`
  const now: number = Date.now()

  //Lookup entry
  const instance: Hash = await hgetall(key)
  const exists: boolean = !!Object.keys(instance).length

  //Create entry if no instance exists
  const create = async (group: string, key: string, meta: Record<string, unknown>): Promise<Entry> => {
    const fields: Entry = {createdAt: now, updatedAt: now, meta}
    console.log(`Creating ${key} at ${now.toString()}`)

    //Create the group if it's not already created
    await sadd('groups', group)

    //Insert the entry
    const hash: Hash = constructHash(fields)
    await hset(key, hash).catch(console.error)

    return fields
  }

  //Update entry if instance exists
  const update = async (key: string, instance: Hash, meta: Record<string, unknown>): Promise<Entry> => {
    const data: Entry = { ...deconstructHash(instance), updatedAt: now, meta }
    console.log(`Updating ${key} at ${now.toString()}`)

    //Update the entry
    const hash: Hash = constructHash(data)
    await hset(key, hash).catch(console.error)

    return data
  }

  //Create or update the fields
  const fields: Entry = exists ? await update(key, instance, meta) : await create(group, key, meta)
  return { id, group, ...fields }
}

/**
 * Delete an entry
 * @param {string} group - Group to delete the entry from
 * @param {uuid} id - Id of the entry
 * @returns {Promise<number>} The number of deleted entries
 */
export const deleteEntry = async (group: string, id: UUID): Promise<number> => {
  const key: string = `app:${group}:${id}`
  const now: number = Date.now()

  //Delete entry
  console.log(`Deleting ${key} at ${now.toString()}`)
  const data: number | void = await del(key).catch(console.error)

  //Delete group if needed
  const remainingKeys: string[] | void = await keys(`app:${group}:*`).catch(console.error)
  if (!remainingKeys?.length) await srem('groups', group).catch(console.error)

  return data || 0
}

/**
 * Remove expired entries
 * @returns {Promise<void>}
 */
const removeExpired = async (): Promise<void> => {
  const keyList: string[] = await keys('app:*')
  const now: number = Date.now()
  console.log(`Scanning for expired entries at expired at ${now.toString()}`)

  const expirationChecks = keyList.map(async (key: string) => {
    const group: string = key.split(':')[1]
    const now: number = Date.now()

    //Lookup entry
    const instance: Hash = await hgetall(key)
    const data: Entry = deconstructHash(instance)

    //Check the age of the entry to see if its expired
    const age: number = now - Math.max(data.createdAt, data.updatedAt)
    if (age < EXPIRY_AGE) return

    //Delete entry
    console.log(`Deleting ${key} at ${now.toString()}`)
    await del(key).catch(console.error)

    //Delete group if needed
    const remainingKeys: string[] | void = await keys(`app:${group}:*`).catch(console.error)
    if (!remainingKeys?.length) await srem('groups', group).catch(console.error)
  })
  
  await Promise.all(expirationChecks)
}

//Start the timer to detect expired entries
const cleanupTimer: NodeJS.Timeout = setInterval(removeExpired, CLEANUP_INTERVAL)
export const stopCleanupTimer = (): void => clearInterval(cleanupTimer)