import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`mail`, `m`], async (message, args, context) => {
  const Gamer = context.client as GamerClient

  const content = args.join(' ')
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel)
    return Gamer.helpers.mail.handleDM(message, content)

  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })
  if (!guildSettings) return

  // If the command was ran inside the support channel handle it as needed
  if (message.channel.id === guildSettings.mails.supportChannelID)
    return Gamer.helpers.mail.handleSupportChannel(message, content, guildSettings)

  const userIsModOrAdmin =
    Gamer.helpers.discord.isModerator(message, guildSettings.staff.modRoleIDs) ||
    Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)
  // Will reply or create new mail if no mail is open for this user
  if (!userIsModOrAdmin) return Gamer.helpers.mail.handleSupportChannel(message, content, guildSettings)

  // Since the user is a mod/admin we have to do extra steps
  const mail = await Gamer.database.models.mail.findOne({
    guildID: message.guildID,
    id: message.channel.id
  })

  // If this is not a valid mail channel, treat it as if a mod is sending their own mail command
  if (!mail) return Gamer.helpers.mail.handleSupportChannel(message, content, guildSettings)
  // If the first word is `close` then we need to close the mail
  const language = Gamer.getLanguage(message.guildID)

  const CLOSE_OPTIONS = language(`mails/mail:CLOSE_OPTIONS`, { returnObjects: true })
  const [closeMail] = args
  if (closeMail && CLOSE_OPTIONS.includes(closeMail.toLowerCase())) {
    args.shift()
    return Gamer.helpers.mail.close(message, args.join(' '), guildSettings, mail)
  }
  // This allows mods to reply to mails
  return Gamer.helpers.mail.replyToMail(message, guildSettings, content, mail)
})
