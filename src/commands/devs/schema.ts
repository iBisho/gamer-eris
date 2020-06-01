import { Command } from 'yuuko'
import Gamer from '../..'

export default new Command('schema', async message => {
  if (message.author.id !== '130136895395987456') return

  const sortedGuilds = [...Gamer.guilds.values()].sort((a, b) => b.memberCount - a.memberCount)

  for (const guild of sortedGuilds) {
    if (guild.memberCount !== guild.members.size) await guild.fetchAllMembers()

    for (const member of guild.members.values()) {
      const settings = await Gamer.database.models.user.findOne({ userID: member.id })
      if (!settings) continue

      if (!settings.guildIDs) settings.guildIDs = [guild.id]
      else if (!settings.guildIDs.includes(guild.id)) settings.guildIDs.push(guild.id)
      await settings.save()
    }
  }

  return message.channel.createMessage('done updating schema')
})
