import Event from '../lib/structures/Event'
import { Guild } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import constants from '../constants'

export default class extends Event {
  async execute(guild: Guild) {
    const Gamer = guild.shard.client as GamerClient

    // Contact all Server Managers
    // Fetch all guild members since we don't cache them
    Gamer.helpers.logger.green(`Gamer joined new guild: ${guild.name} with ${guild.members.size} members.`)

    // DONT NEED TRANSLATING BECAUSE BY DEFAULT ALL GUILDS START IN ENGLISH LANGUAGE
    // Create the embed that will be sent to all the server managers
    const embed = new GamerEmbed()
      .setAuthor(`Alert: I was invited to ${guild.name}!`, guild.iconURL)
      .addField(
        `Why Was This Was Sent To You?`,
        `The bot was invited to ${guild.name} and you have the Manage Guild permission.`
      )
      .addField(
        `Need Help`,
        `If you need help please review our [Wiki](https://gamer.netlify.com) as we have nice explanations with pictures and guides.\n\nIf you still need further help, please contact us on our [Support Server](${constants.general.gamerServerInvite})`
      )
      .addField(`My Features:`, `To view a list of the bot's features, please type **.help all** in ${guild.name}`)
      .setTimestamp()
    if (guild.iconURL) embed.setThumbnail(guild.iconURL)

    Gamer.amplitude.push({
      authorID: guild.ownerID,
      guildID: guild.id,
      timestamp: Date.now(),
      type: 'GUILD_ADDED'
    })

    // Send dm to all users concurrently
    await Promise.all(
      guild.members.map(async member => {
        if (!member.permission.has('manageGuild') && !member.permission.has('administrator')) return

        // Member has permissions to manage guild so send dm
        try {
          const dmChannel = await member.user.getDMChannel()
          // Need await to be able to catch and ingore the dm closed error
          await dmChannel.createMessage({ embed: embed.code })
        } catch {
          // Catch incase they have dms blocked
        }
      })
    )
  }
}
