import * as mongoose from 'mongoose'
import GuildSchema from './schemas/guild'
import TradingCardSchema from './schemas/tradingCards'

// Connect to the db
mongoose.connect(`mongodb://localhost/:27017/test`, { useNewUrlParser: true })

const db = mongoose.connection
db.on(`error`, () => console.error(`MongoDB connection error`))
db.once(`open`, () => {
  console.log(`MongoDB Connected!`)
	const GuildModel = mongoose.model('Guild', GuildSchema)
	const TradingCardModel = mongoose.model('TradingCards', TradingCardSchema)
})
