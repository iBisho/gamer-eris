import * as mongoose from 'mongoose'
import GuildSchema from './schemas/guild'

// Connect to the db
mongoose.connect(`mongoose://localhost/test`, { useNewUrlParser: true })

const db = mongoose.connection
db.on(`error`, () => console.error(`MongoDB connection error`))
db.once(`open`, () => {
  console.log(`MongoDB Connected!`)
  const GuildModel = mongoose.model('Guild', GuildSchema)
})
