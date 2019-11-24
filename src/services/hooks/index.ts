import fastifyBuilder from 'fastify'
import twitchRouters from './../twitch/hooks'
import helmet from 'fastify-helmet'

const fastify = fastifyBuilder({
  logger: {
    prettyPrint: true
  }
})

fastify.register(helmet, {
  hidePoweredBy: {
    // :p
    setTo: 'PHP 4.2.0'
  }
})

fastify.register(twitchRouters, { prefix: '/twitch' })

export default (port: number) => {
  fastify.listen(port || 3000, '0.0.0.0')
}
