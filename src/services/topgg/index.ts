import fastify from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'http'
import config from '../../../config'
import database from '../../database/mongodb'

type TopGGRouter = fastify.Plugin<Server, IncomingMessage, ServerResponse, {}>

const topGGRouter: TopGGRouter = (fastify, _opts, done) => {
  fastify.post('/dblwebhook', async req => {
    // Confirm this is a valid request using our auth passcode
    if (req.headers.authorization !== config.topgg.auth) return

    // const body: {
    //   bot: '270010330782892032',
    //   user: '130136895395987456',
    //   type: 'test',
    //   query: '?test=data&notRandomNumber=8',
    //   isWeekend: false
    //   },
    const now = Date.now()
    const votesMade = req.body.isWeekend ? 2 : 1
    const upvote = await database.models.upvote.findOne({ userID: req.body.user })

    if (upvote) {
      upvote.amount += votesMade
      upvote.weeklyCount += votesMade
      upvote.timestamp = now
      upvote.luckySlots += 50
      upvote.save()
    } else
      database.models.upvote.create({
        userID: req.body.user,
        amount: votesMade,
        timestamp: now,
        weeklyCount: votesMade,
        luckySlots: 50
      })
  })

  done()
}

export default topGGRouter
