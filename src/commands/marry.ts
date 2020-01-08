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

  if (isMarried || (isSpouse && isSpouse.accepted))
    return message.channel.createMessage(language('fun/marry:YOU_ARE_MARRIED'))
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

      const prefix = Gamer.guildPrefixes.get(msg.channel.guild.id) || Gamer.prefix
      const data = collector.data as MarriageCollectorData
      switch (data.marriage.step) {
        case 0:
          // Create the possible gif search terms for each option
          const searchCriteria = ['love letter', 'romantic picnic', 'romantic dinner', 'wedding proposal']
          let [search] = searchCriteria

          // The user will respond with a multiple choice option
          switch (msg.content) {
            case '1':
              search = searchCriteria[0]
              break
            case '2':
              search = searchCriteria[1]
              break
            case '3':
              search = searchCriteria[2]
              break
            case '4':
              search = searchCriteria[3]
              break
            default:
              msg.channel.createMessage(language('fun/marry:INVALID_RESPONSE'))
              return
          }

          // Get a random gif regarding the option the user chose
          const data: TenorGif | undefined = await fetch(
            `https://api.tenor.com/v1/search?q=${search}&key=LIVDSRZULELA&limit=50`
          )
            .then(res => res.json())
            .catch(() => undefined)
          if (!data || !data.results.length) return

          const randomResult = Gamer.helpers.utils.chooseRandom(data.results)
          const [media] = randomResult.media

          const embed = new GamerEmbed()
            .setAuthor(
              language('fun/marry:PROPOSAL', { user: message.author.username, spouse: spouseUser.username }),
              message.author.avatarURL
            )
            .setDescription(
              language('fun/marry:HOW_TO_ACCEPT', {
                user: message.author.mention,
                prefix
              })
            )
            .setImage(media.gif.url)
            .setFooter(`Via Tenor`, spouseUser.avatarURL)

          // Send a message so the spouse is able to learn how to accept the marriage
          msg.channel.createMessage({
            content: `${message.author.mention} ${spouseUser.mention}`,
            embed: embed.code
          })
          // Embed that tells the user they can still continue the marriage simulation
          const thoughtOnlyEmbed = new GamerEmbed()
            .setAuthor(message.author.username, message.author.avatarURL)
            .setDescription(language('fun/marry:THOUGHT_ONLY'))
            .setImage('https://i.imgur.com/WwBfZfa.jpg')

          msg.channel.createMessage({ content: message.author.mention, embed: thoughtOnlyEmbed.code })
          msg.channel.createMessage(language('fun/marry:TIME_TO_SHOP', { mention: message.author.mention, prefix }))
          return
      }
    }
  })
})
