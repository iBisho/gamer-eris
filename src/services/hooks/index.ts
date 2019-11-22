import fastifyBuilder from 'fastify'
import twitchRouters from './../twitch/hooks'

const fastify = fastifyBuilder({
  logger: true
})

fastify.register(twitchRouters, { prefix: '/twitch' })

export default (port: number) => {
  fastify.listen(port || 3000, (err, address) => {
    if (err) throw err
    fastify.log.info(`server listening on ${address}`)
  })
}
