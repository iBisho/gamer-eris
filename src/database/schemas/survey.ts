import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The name of the survey
  name: String,
  // The questions to ask
  questions: [String],
  // The guild id where this survey was created
  guildID: String,
  // The user id for who created the id
  creatorID: String,
  // The channel id where the responses need to be sent
  channelID: String,
  // The responses that will be sent
  responses: [
    {
      // The user id of the person who filled out the survey
      authorID: String,
      // The answers to the questions this user gave
      answers: [String],
      // The message ids for the messages sent to the mods
      messageIDs: [String]
    }
  ]
})
