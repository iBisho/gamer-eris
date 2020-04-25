import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'

export default new Command(`embedset`, async (message, _args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  // const helpCommand = Gamer.commandForName(`help`)
  // if (!args.length) return helpCommand?.process(message, [`embed`], context)

  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return
  if (!guildSettings?.vip.isVIP) return

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
        `description`,
        `footericon`,
        `footertext`,
        `color`,
        `field`
      ]

      const args = msg.content.split(' ')
      const [type, ...fullValue] = args
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
            // eslint-disable-next-line @typescript-eslint/camelcase
            icon_url: transformed,
            name: embed.code.author?.name || language(`embedding/embedset:UNKNOWN_AUTHOR`),
            url: embed.code.author?.url
          }
          break
        case `authorname`:
          embed.code.author = {
            // eslint-disable-next-line @typescript-eslint/camelcase
            icon_url: embed.code.author?.icon_url,
            name: transformed,
            url: embed.code.author?.url
          }
          break
        case `authorurl`:
          embed.code.author = {
            // eslint-disable-next-line @typescript-eslint/camelcase
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
        case `description`:
          embed.setDescription(transformed)
          break
        case `footericon`:
          embed.code.footer = {
            text: embed.code.footer?.text || language(`embedding/embedset:UNKNOWN_FOOTER`),
            // eslint-disable-next-line @typescript-eslint/camelcase
            icon_url: transformed
          }
          break
        case `footertext`:
          embed.code.footer = {
            text: transformed,
            // eslint-disable-next-line @typescript-eslint/camelcase
            icon_url: embed.code.footer?.icon_url
          }
          break
        case `color`:
          if (!fullValue.join(' ').startsWith('#')) {
            message.channel.createMessage(language(`embedding/embedset:INVALID_HEX`))
            break
          }
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
          embed.addField(fieldName, fieldValue, Boolean(inline?.endsWith(' true')))
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

description Be advised that according to Discord's ToS, members must be at least 13 years of age in order to validly hold an account. Furthermore, users between 13 years of age, and the age of majority in their jurisdiction need consent from their legal guardian in order to participate.

https://discordapp.com/terms

Follow these rules for a safe and enjoyable community experience.

If you witness conduct that violates these rules, please @mention or direct message an available Administrator or Moderator. If none are readily available, you may use @Gamer Team for situations that require immediate intervention.

authorname %guild% %user%
authoricon %userimage%
thumbnail %guildimage%

field :smiley: 1. Be cool, kind, and civil.%% Treat all members with respect and express your thoughts in a constructive manner.
field :card_index: 2. Use an appropriate name and avatar. %% Avoid special characters, emoji, obscenities, and impersonation.
field :incoming_envelope: 3. Do not spam(Unless testing the bot spam filter ofcourse). %% Avoid excessive messages, images, formatting, emoji, commands, and @mentions.
field :loudspeaker: 4. No self-promotion or advertisements. %% This includes unsolicited references and links to other social media, servers, communities, and services in chat or direct messages.
field :shield: 5. No personal information. %% Protect your privacy and the privacy of others.
field :head_bandage: 6. No harassment, abuse, or bullying. %% We have zero-tolerance for harming others.
field :anger_right: 7. No racist, sexist, anti-LGBTQ+, or otherwise offensive content. %% We have zero-tolerance for hate speech.
field :classical_building: 8. No political or religious topics. %% These complex subjects result in controversial and offensive posts.
field :rotating_light: 9. No piracy, sexual, NSFW, or otherwise suspicious content. %% We do not condone illegal or suspicious discussions and activity.
field :thinking: 10. Rules are subject to common sense. %% These rules are not comprehensive and use of loopholes to violate the spirit of these rules is subject to enforcement.
field :scroll: 11. Discord Terms of Service and Community Guidelines apply. %% You must be at least 13 years old to use Discord, and abide by all other terms and guidelines.

footertext Thank You Minecraft we love you!
