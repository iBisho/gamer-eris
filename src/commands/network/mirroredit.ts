import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`mirroredit`, `me`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const helpCommand = Gamer.commandForName('help')
  const [name, type] = args
  if (!name || !type) return helpCommand?.process(message, ['mirroredit'], context)

  if (!Gamer.vipGuildIDs.has(message.guildID))
    return message.channel.createMessage(language(`network/mirroredit:VIP_ONLY_GUILD`))

  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })
  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const mirror = await Gamer.database.models.mirror.findOne({
    name: name.toLowerCase(),
    sourceGuildID: message.member.guild.id
  })
  if (!mirror) return message.channel.createMessage(language(`network/mirroredit:NOT_FOUND`, { name }))

  switch (type.toLowerCase()) {
    case 'delete':
      mirror.deleteSourceMessages = !Boolean(mirror?.deleteSourceMessages)
      mirror.save()
      Gamer.mirrors.set(mirror.sourceChannelID, mirror)
      return message.channel.createMessage(
        language(`network/mirroredit:DELETED`, {
          status: language(mirror.deleteSourceMessages ? `common:ENABLED` : `common:DISABLED`)
        })
      )
    case 'anonymous':
      mirror.anonymous = !Boolean(mirror?.anonymous)
      mirror.save()
      Gamer.mirrors.set(mirror.sourceChannelID, mirror)
      return message.channel.createMessage(
        language(`network/mirroredit:ANONYMOUS`, {
          status: language(mirror.anonymous ? `common:ENABLED` : `common:DISABLED`)
        })
      )
    default:
      return
  }
})
