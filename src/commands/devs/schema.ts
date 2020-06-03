import { Command } from 'yuuko'
import Gamer from '../..'

export default new Command('schema', async message => {
  if (message.author.id !== '130136895395987456') return

  const sortedGuilds = [...Gamer.guilds.values()].sort((a, b) => b.memberCount - a.memberCount)
  sortedGuilds.shift()

  sortedGuilds.forEach(async guild => {
    if (guild.memberCount > 5) return

    if (guild.memberCount !== guild.members.size) await guild.fetchAllMembers()
    Gamer.helpers.logger.green(`Finished fetching ${guild.name}`)

    guild.members.forEach(member => {
      Gamer.database.models.roles
        .findOneAndUpdate(
          { memberID: member.id, guildID: guild.id },
          { memberID: member.id, guildID: guild.id, roleIDs: member.roles },
          { upsert: true }
        )
        .exec()
    })
  })

  return message.channel.createMessage('done updating schema')
})
