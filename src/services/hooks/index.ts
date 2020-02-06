import fastifyBuilder from 'fastify'
import twitchRouters from './../twitch/hooks'
import helmet from 'fastify-helmet'
import topGGRouter from '../topgg'

const fastify = fastifyBuilder({
  logger: false
})

fastify.register(helmet, {
  hidePoweredBy: {
    // :p
    setTo: 'PHP 4.2.0'
  }
})

fastify.register(twitchRouters, { prefix: '/twitch' })
fastify.register(topGGRouter)

export default (port: number) => {
  fastify.listen(port || 3000, '0.0.0.0')
}
