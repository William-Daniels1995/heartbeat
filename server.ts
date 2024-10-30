import cors from 'cors'
import express, { type Express, Request, Response } from 'express'
import router from './src/api/router'
import redis from './src/redis'
import { Server } from 'http'
import dotenv from 'dotenv'

const app: Express = express()
let server: Server

//Load environment variables from .env file
dotenv.config()

const PORT: number = Number(process.env.PORT) || 3000
const CORS_ORIGIN: string = process.env.CORS_ORIGIN || ''

//Middleware
const middleware = (): void => {
  //JSON & URL encoded bodies
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  //CORS setup for secure cross origin requests
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
}

//Routes
const routes = (): void => {
  //API setup
  app.use('/api/v1', router)

  //Health check endpoint
  app.get('/health', (req: Request, res: Response): void => { res.status(200).send('OK') })
}

//Initalise server
const init = async (): Promise<void> => {
  //Connect to Redis
  await redis.connect().catch(console.error)

  //Configure server
  middleware()
  routes()

  //Start the server
  server = app.listen(PORT, (): void => console.log(`Server running on port ${PORT}`))
}

//Shutdown the server
const shutdown = async (): Promise<void> => {
  if (!server) return
  await new Promise<void>((resolve, reject) => {
    server.close((err): void => (err ? reject(err) : resolve()))
  })
}

init()
export { app, shutdown }