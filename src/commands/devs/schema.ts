import { Command } from 'yuuko'
import Gamer from '../..'

export default new Command('schema', async message => {
  if (message.author.id !== '130136895395987456') return

  const sortedGuilds = [...Gamer.guilds.values()].sort((a, b) => b.memberCount - a.memberCount)

  for (const guild of sortedGuilds) {
    Gamer.helpers.logger.blue(`Starting ${guild.name} with ${guild.memberCount}`)
    if (guild.memberCount !== guild.members.size) await guild.fetchAllMembers()
    Gamer.helpers.logger.green(`Finished fetching ${guild.name}`)
    await Gamer.helpers.utils.sleep(1)
    for (const member of guild.members.values()) {
      Gamer.emit('guildMemberUpdate', guild, member)
      await Gamer.helpers.utils.sleep(1)
      Gamer.helpers.logger.yellow(`Finished ${member.username}`)
    }

    guild.members.clear()
  }

  return message.channel.createMessage('done updating schema')
})
