import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'

export default new Command(`embedset`, async (message, _args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return
  if (!guildSettings?.vip.isVIP) 
   return message.channel.createMessage(language(`embedding/embedset:NEED_VIP`))

  const emojis = await Gamer.database.models.emoji.find()

  // VIP EVENT CREATE
  const helperMessage = await Gamer.helpers.discord.embedResponse(
    message,
    language(`embedding/embedset:HELPER_MESSAGE`)
  )
  const embed = new MessageEmbed()
  const embedMessage = await message.channel.createMessage({ embed: embed.code })

  return Gamer.collectors.set(message.author.id, {
    authorID: message.author.id,
    channelID: message.channel.id,
    createdAt: Date.now(),
    guildID: message.guildID,
    data: {},
    callback: async (msg, collector) => {
      if (!msg.guildID || !msg.member) return

      const CANCEL_OPTIONS = language(`common:CANCEL_OPTIONS`, { returnObjects: true })
      if ([...CANCEL_OPTIONS, 'q', 'quit'].includes(msg.content)) {
        msg.channel.createMessage(language(`embedding/embedset:CANCELLED`, { mention: msg.author.mention }))
        return helperMessage.delete().catch(() => undefined)
      }

      const options = [
        `plaintext`,
        `text`,
        `authoricon`,
        `authorname`,
        `authorurl`,
        `title`,
        `titleurl`,
        `thumbnail`,
        `image`,
        `description`,
        `footericon`,
        `footertext`,
        `color`,
        `field`
      ]

      const args = msg.content.split(' ')
      const [type, ...fullValue] = args
      if (!type) return

      collector.createdAt = Date.now()

      if (!options.includes(type.toLowerCase())) {
        message.channel.createMessage(language(`embedding/embedset:INVALID_EDIT`, { mention: msg.author.mention }))
        return Gamer.collectors.set(message.author.id, collector)
      }

      let plaintext = ''
      const transformed = await Gamer.helpers.transform.variables(
        fullValue.join(' '),
        msg.author,
        msg.member.guild,
        msg.author,
        emojis
      )

      switch (type.toLowerCase()) {
        case `plaintext`:
        case `text`:
          plaintext = transformed
          break
        case `authoricon`:
          embed.code.author = {
            icon_url: transformed,
            name: embed.code.author?.name || language(`embedding/embedset:UNKNOWN_AUTHOR`),
            url: embed.code.author?.url
          }
          break
        case `authorname`:
          embed.code.author = {
            icon_url: embed.code.author?.icon_url,
            name: transformed,
            url: embed.code.author?.url
          }
          break
        case `authorurl`:
          embed.code.author = {
            icon_url: embed.code.author?.icon_url,
            name: embed.code.author?.name || language(`embedding/embedset:UNKNOWN_AUTHOR`),
            url: fullValue.join(' ')
          }
          break
        case `title`:
          embed.setTitle(transformed)
          break
        case `titleurl`:
          embed.code.url = fullValue.join(' ')
          break
        case `thumbnail`:
          embed.setThumbnail(transformed)
          break
        case `image`:
          embed.setImage(transformed)
          break
        case `description`:
          embed.setDescription(transformed)
          break
        case `footericon`:
          embed.code.footer = {
            text: embed.code.footer?.text || language(`embedding/embedset:UNKNOWN_FOOTER`),
            icon_url: transformed
          }
          break
        case `footertext`:
          embed.code.footer = {
            text: transformed,
            icon_url: embed.code.footer?.icon_url
          }
          break
        case `color`:
          embed.setColor(fullValue.join(' '))
          break
        case `timestamp`:
          embed.setTimestamp()
          break
        case `field`:
          if (!fullValue.join(' ').includes('%%')) {
            message.channel.createMessage(language(`embedding/embedset:INVALID_FIELD`))
            break
          }

          const [fieldName, fieldValue, inline] = fullValue.join(' ').split('%%')
          if (fieldName && fieldValue) embed.addField(fieldName, fieldValue, Boolean(inline?.endsWith(' true')))
          break
        default:
          // If they used the command wrong show them the help
          msg.channel.createMessage(language(`events/eventcreate:INVALID_TIME`, { mention: msg.author.mention }))
          return Gamer.collectors.set(message.author.id, collector)
      }

      // Save any change to the events
      embedMessage.edit({ content: plaintext, embed: embed.code })
      msg.delete(language(`common:CLEAR_SPAM`)).catch(() => undefined)

      return Gamer.collectors.set(message.author.id, collector)
    }
  })
})
