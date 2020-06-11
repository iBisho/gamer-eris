import { Command } from 'yuuko'
import Gamer from '../..'
import { TextChannel, NewsChannel } from 'eris'

export default new Command('schema', async message => {
  const events = await Gamer.database.models.event.find()
  for (const event of events) {
    if (event.adChannelID) {
      const channel = Gamer.getChannel(event.adChannelID)
      if (channel) {
        if (channel instanceof TextChannel || channel instanceof NewsChannel) {
          event.guildID = channel.guild.id
        }
      }
    } else if (event.alertRoleIDs.length) {
      const guild = Gamer.guilds.find(guild => event.alertRoleIDs.some(id => guild.roles.has(id)))
      if (guild) {
        event.guildID = guild.id
      }
    } else if (event.allowedRoleIDs.length) {
      const guild = Gamer.guilds.find(guild => event.allowedRoleIDs.some(id => guild.roles.has(id)))
      if (guild) {
        event.guildID = guild.id
      }
    }

    event.save()
  }

  return message.channel.createMessage('done updating schema')
})
