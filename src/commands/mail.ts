import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'
import { GamerMail } from '../lib/types/gamer'

export default new Command([`mail`, `m`], async (message, args, context) => {
  const Gamer = context.client as GamerClient

  const content = args.join(' ')
  if (message.channel instanceof PrivateChannel) return Gamer.helpers.mail.handleDM(message, content)

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null
  // If the command was ran inside the support channel handle it as needed
  if (message.channel.id === guildSettings?.mails.supportChannelID)
    return Gamer.helpers.mail.handleSupportChannel(message, content, guildSettings)

  const userIsModOrAdmin =
    Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs || []) ||
    Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  // Will reply or create new mail if no mail is open for this user
  if (!userIsModOrAdmin) Gamer.helpers.mail.handleSupportChannel(message, content, guildSettings)
  // Since the user is a mod/admin we have to do extra steps

  const mails = (await Gamer.database.models.mail.find({
    guildID: message.channel.guild.id
  })) as GamerMail[]

  const mail = mails.find(m => m.id === message.channel.id)
  // If this is not a valid mail channel, create a new mail for the user
  if (!mail) return Gamer.helpers.mail.createMail(message, content, guildSettings)
  // If the first word is `close` then we need to close the mail
  const [closeMail] = args
  if (closeMail === `close`) {
    args.shift()
    return Gamer.helpers.mail.close(message, args.join(' '), guildSettings, mail)
  }
  // This allows mods to reply to mails
  return Gamer.helpers.mail.replyToMail(message, content, guildSettings, mail)
})
