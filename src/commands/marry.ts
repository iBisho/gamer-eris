import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { MarriageCollectorData } from '../lib/types/gamer'
import constants from '../constants'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TenorGif } from '../lib/types/tenor'
import fetch from 'node-fetch'

export default new Command([`marry`, `propose`], async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  if (!message.mentions.length) return message.channel.createMessage(language(`fun/marry:NEED_SPOUSE`))
  const [spouseUser] = message.mentions
  if (spouseUser.id === message.author.id) return message.channel.createMessage(language(`fun/marry:NOT_SELF`))
  if (spouseUser.bot) return message.channel.createMessage(language(`fun/marry:NOT_BOT`))

  const [isMarried, isSpouse, spouseIsMarried, spouseIsSpouse, marriageData] = await Promise.all([
    Gamer.database.models.marriage.findOne({ authorID: message.author.id }),
    Gamer.database.models.marriage.findOne({ spouseID: message.author.id }),
    Gamer.database.models.marriage.findOne({ spouseID: spouseUser.id }),
    Gamer.database.models.marriage.findOne({ spouseID: spouseUser.id }),
    Gamer.database.models.marriage.findOne({
      authorID: message.author.id,
      spouseID: spouseUser.id
    })
  ])

  if (isMarried || isSpouse) return message.channel.createMessage(language('fun/marry:YOU_ARE_MARRIED'))
  if (spouseIsMarried || spouseIsSpouse) return message.channel.createMessage(language('fun/marry:SPOUSE_IS_MARRIED'))

  message.channel.createMessage(
    language('fun/marry:PROPOSE', { mention: message.author.mention, coins: constants.emojis.coin })
  )

  const marriage =
    marriageData ||
    (await Gamer.database.models.marriage.create({
      authorID: message.author.id,
      spouseID: spouseUser.id,
      step: 0
    }))

  return Gamer.collectors.set(message.author.id, {
    authorID: message.author.id,
    channelID: message.channel.id,
    createdAt: Date.now(),
    guildID: message.channel.guild.id,
    data: {
      marriage
    },
    callback: async (msg, collector) => {
      if (msg.channel instanceof PrivateChannel || msg.channel instanceof GroupChannel || !msg.member) return
      const CANCEL_OPTIONS = language(`common:CANCEL_OPTIONS`, { returnObjects: true })
      if (CANCEL_OPTIONS.includes(msg.content)) {
        message.channel.createMessage(language(`fun/marry:CANCELLED`, { mention: msg.author.mention }))
        return
      }

      const data = collector.data as MarriageCollectorData
      switch (data.marriage.step) {
        // If the user agrees to send the proposal
        case 0:
          // The user will respond with a multiple choice option
          const searchCriteria = ['love letter']
          switch (msg.content) {
            case '1':
              const data: TenorGif | undefined = await fetch(
                `https://api.tenor.com/v1/search?q=${searchCriteria[0]}&key=LIVDSRZULELA&limit=50`
              )
                .then(res => res.json())
                .catch(() => undefined)
              if (!data || !data.results.length) return

              const randomResult = data.results[Math.floor(Math.random() * data.results.length)]
              const [media] = randomResult.media

              const embed = new GamerEmbed()
                .setAuthor(language('fun/marry:PROPOSAL'), message.author.avatarURL)
                .setDescription(
                  language('fun/marry:HOW_TO_ACCEPT', {
                    user: spouseUser.mention,
                    prefix: Gamer.guildPrefixes.get(msg.channel.guild.id) || Gamer.prefix
                  })
                )
                .setImage(media.gif.url)
                .setFooter(`Via Tenor`, spouseUser.avatarURL)

              msg.channel.createMessage({ embed: embed.code })
              const thoughtOnlyEmbed = new GamerEmbed()
                .setAuthor(message.author.username, message.author.avatarURL)
                .setDescription(language('fun/marry:THOUGHT_ONLY'))
                .setImage('https://i.imgur.com/WwBfZfa.jpg')

              msg.channel.createMessage({ embed: thoughtOnlyEmbed.code })
              msg.channel.createMessage(language('fun/marry:TIME_TO_SHOP'))
              return
            case '2':
            case '3':
            case '4':
            default:
              msg.channel.createMessage(language('fun/marry:INVALID_RESPONSE'))
              return
          }
      }
    }
  })
})
