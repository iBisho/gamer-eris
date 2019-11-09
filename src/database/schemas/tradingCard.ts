import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The name of the game this is related to
  game: { type: String, lowercase: true },
  // The guild id
  guildID: String,
  // The channel id where the cards will be sent
  channelID: String
  // The name of the card that is able to be collected
})
