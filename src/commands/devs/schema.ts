import { Command } from 'yuuko'
import Gamer from '../..'

export default new Command('schema', async message => {
  if (message.author.id !== '130136895395987456') return

  for (const guild of Gamer.guilds.values()) {
    await guild.fetchAllMembers()
    for (const member of guild.members.values()) {
      const settings = await Gamer.database.models.user.findOne({ userID: member.id })
      if (!settings) continue

      settings.guildIDs.push(guild.id)
      await settings.save()
    }
  }

  // console.log(await Gamer.database.models.user.find({ guildIDs: message.guildID }))

  return message.channel.createMessage('done updating schema')
})
