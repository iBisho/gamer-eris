import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { sendMessage } from '../../lib/utils/eris'

export default new Command(
  [`resetanalyze`, `resetanalytics`, `analyzereset`, `analyticsreset`],
  async (message, _args, context) => {
    if (!message.member) return

    const Gamer = context.client as GamerClient

    const guildID = message.member.guild.id
    const language = Gamer.getLanguage(guildID)

    const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.member.guild.id })
    if (!guildSettings?.vip.isVIP) return sendMessage(message.channel.id, language(`vip/analyze:NEED_VIP`))

    // If the user is not an admin/mod cancel out
    if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings))
      return sendMessage(message.channel.id, language('common:NOT_MOD_OR_ADMIN'))

    Gamer.database.models.analytics.deleteMany({ guildID }).exec()

    return sendMessage(message.channel.id, language(`vip/resetanalyze:ANALYZE_RESETTED`))
  }
)
