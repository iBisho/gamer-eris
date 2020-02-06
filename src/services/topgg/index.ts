import fastify from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'http'

type TopGGRouter = fastify.Plugin<Server, IncomingMessage, ServerResponse, {}>

const topGGRouter: TopGGRouter = (fastify, _opts, done) => {
  // Verifying webhook
  fastify.get('/dblwebhook', async (req, res) => {
    console.log(req, res)
  })

  fastify.post('/dblwebhook', async (req, res) => {
    console.log('posssting', req, res)
  })

  done()
}

export default topGGRouter
