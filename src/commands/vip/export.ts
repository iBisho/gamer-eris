import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { TextChannel } from 'eris'

export default new Command(`export`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  // If they are using default settings, they won't be vip server
  if (!guildSettings?.vip.isVIP) return message.channel.createMessage(language(`vip/export:NEED_VIP`))

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  const [messageID] = args
  if (!messageID) return helpCommand.execute(message, [`export`], { ...context, commandName: 'help' })

  const channel = message.channelMentions.length
    ? message.member.guild.channels.get(message.channelMentions[0]) || message.channel
    : message.channel

  if (
    !(channel instanceof TextChannel) ||
    ![guildSettings.feedback.bugs.channelID, guildSettings.feedback.idea.channelID].includes(channel.id)
  )
    return

  message.channel.createMessage(language(`vip/export:PATIENCE`, { mention: message.author.mention }))

  const feedbackMessage = await channel.getMessage(messageID)
  // Get all messages after this message id
  const feedbackMessages = await channel.getMessages(100, undefined, messageID)
  if (!feedbackMessage && !feedbackMessages.length) return

  const [embed] = feedbackMessage.embeds
  if (!embed || !embed.fields) return

  const csvArray = [embed.fields.map(field => field.name).join(`;`), embed.fields.map(field => field.value).join(`;`)]
  for (const msg of feedbackMessages) {
    const [msgEmbed] = msg.embeds
    if (!msgEmbed || !msgEmbed.fields) continue
    csvArray.push(msgEmbed.fields.map(field => field.value).join(';'))
  }

  return message.channel.createMessage(language(`vip/export:CSV`), {
    file: Buffer.from(csvArray.join(`\n`)),
    name: `output.csv`
  })
})
