import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { upsertGuild } from '../../database/mongoHandler'

export default new Command([`resetanalyze`, `resetanalytics`, `analyzereset`, `analyticsreset`], async (message, _args, context) => {
  const Gamer = context.client as GamerClient

  if (!message.member) return


const guildID = message.member.guild.id
const language = Gamer.getLanguage(guildID)


  {
    const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.member.guild.id })

    if (!guildSettings?.vip.isVIP) return message.channel.createMessage(language(`vip/analyze:NEED_VIP`))

    // If the user is not an admin/mod cancel out
    if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings))
     return message.channel.createMessage(language('common:NOT_MOD_OR_ADMIN'))
  }

  const guildSettings = await upsertGuild(message.member.guild.id)
  // Only mods or admins can delete analytics
  Gamer.database.models.analytics.deleteMany({ guildID }).exec()

  // If the bot should reset the VIP
  guildSettings.vip.isVIP = true
  guildSettings.save()


  return message.channel.createMessage(language(`vip/resetanalyze:ANALYZE_RESETTED`))
})