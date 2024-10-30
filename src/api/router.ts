import { Router, Request, Response, RequestHandler } from 'express'
import { getGroup, getGroups, setEntry, deleteEntry, Entry, FullEntry, Group } from "../heartbeat"

const router: Router = Router()
import { validateGroup, validateEntry, validateMeta } from './middleware'

//Request parameters
interface Params {
  group?: string
  id?: string
}

//Request body
interface Body {
  meta?: Record<string, unknown>
}

/**
 * GET /
 * Gets a list of groups with summaries
 * @returns Array of group objects
 */
router.get( '/', ( async (req: Request<Params>, res: Response): Promise<void> => {
  const data: Group[] = await getGroups()
  res.json(data)
}) as RequestHandler)

/**
 * GET /:group
 * Gets a list of entries from a group
 * @param {string} group - Group of entry
 * @returns Array of heartbeat objects
 */
router.get( '/:group', validateGroup, ( async (req: Request<Params>, res: Response): Promise<void> => {
  const { group = '' } = req.params as Params
  const data: FullEntry[] = await getGroup(group)
  res.json(data)
}) as RequestHandler)

/**
 * POST /:group/:id
 * Sends a heartbeat to the server
 * Creates or updates heartbeat
 * @param {string} group - Group of entry
 * @param {uuid} id - Id of entry
 * @returns Object of heartbeat entry
 */
router.post( '/:group/:id', validateEntry, validateMeta, ( async (req: Request<Params>, res: Response): Promise<void> => {
  const { group = '', id = '' } = req.params as Params
  const { meta = {} } = req.body as Body
  const data: FullEntry = await setEntry(group, id, meta)
  res.json(data)
}) as RequestHandler)

/**
 * DELETE /:group/:id
 * Deletes a heartbeat entry from the server
 * @param {string} group - Group of entry
 * @param {uuid} id Id of entry
 * @returns Number of deleted entries
 */
router.delete( '/:group/:id', validateEntry, ( async (req: Request<Params>, res: Response): Promise<void> => {
  const { group = '', id = '' } = req.params as Params
  const data: number = await deleteEntry(group, id)
  res.json(data)
}) as RequestHandler)

export default router