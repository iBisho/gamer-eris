import GamerClient from '../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'
import constants from '../constants'
import { EventListener } from 'yuuko'

export default new EventListener('guildCreate', async guild => {
  const Gamer = guild.shard.client as GamerClient

  Gamer.amplitude.push({
    authorID: guild.ownerID,
    guildID: guild.id,
    timestamp: Date.now(),
    type: 'GUILD_ADDED'
  })

  // Cancel out on topgg server
  if (['264445053596991498'].includes(guild.id)) return

  // Contact all Server Managers

  // DONT NEED TRANSLATING BECAUSE BY DEFAULT ALL GUILDS START IN ENGLISH LANGUAGE
  // Create the embed that will be sent to all the server managers
  const embed = new MessageEmbed()
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
    .addField(
      `Setting Up:`,
      `To set up the bot, the server owner can type **.setup** to begin the setup walkthrough to setup the features 1 by 1.`
    )
    .setTimestamp()
  if (guild.iconURL) embed.setThumbnail(guild.iconURL)

  await guild.fetchAllMembers()
  if (!Gamer.allMembersFetchedGuildIDs.has(guild.id)) Gamer.allMembersFetchedGuildIDs.add(guild.id)

  // Send dm to all users concurrently
  await Promise.all(
    guild.members.map(async member => {
      if (member.roles.length) {
        Gamer.database.models.roles
          .findOneAndUpdate(
            { memberID: member.id, guildID: member.guild.id },
            { memberID: member.id, guildID: member.guild.id, roleIDs: member.roles },
            { upsert: true }
          )
          .exec()
      }

      if (!member.permission.has('manageGuild') && !member.permission.has('administrator')) return

      // Member has permissions to manage guild so send dm
      try {
        Gamer.helpers.levels.completeMission(member, `guildadded`, guild.id)
        const dmChannel = await member.user.getDMChannel()
        // Need await to be able to catch and ingore the dm closed error
        await dmChannel.createMessage({ embed: embed.code })
      } catch {
        // Catch incase they have dms blocked
      }
    })
  )
})
