import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'
import { MessageEmbed } from 'helperis'
import { TenorGif } from '../../lib/types/tenor'
import fetch from 'node-fetch'

export default new Command([`marry`, `propose`], async (message, _args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  if (!message.mentions.length) return message.channel.createMessage(language(`fun/marry:NEED_SPOUSE`))

  const [spouseUser] = message.mentions
  if (spouseUser.id === message.author.id) return message.channel.createMessage(language(`fun/marry:NOT_SELF`))

  if (spouseUser.bot) return message.channel.createMessage(language(`fun/marry:NOT_BOT`))

  const marriageData = await Gamer.database.models.marriage
    .findOne()
    .or([
      { authorID: message.author.id },
      { spouseID: message.author.id, accepted: true },
      { spouseID: message.author.id, authorID: spouseUser.id }
    ])

  // The user is already in a marriage
  if (marriageData) {
    // User initiated the marriage
    if (marriageData.authorID === message.author.id) {
      // User is married to someone else
      if (marriageData.spouseID !== spouseUser.id)
        return message.channel.createMessage(language('fun/marry:YOU_ARE_MARRIED', { mention: message.author.mention }))
      // Shopping is not complete
      if (marriageData.step === 0)
        return message.channel.createMessage(language('fun/marry:SHOPPING_LEFT', { mention: message.author.mention }))
    }

    // User is the spouse and has already accepted
    else if (marriageData.spouseID === message.author.id && marriageData.accepted) {
      // User is married to someone else
      if (marriageData.authorID !== spouseUser.id)
        return message.channel.createMessage(language('fun/marry:YOU_ARE_MARRIED', { mention: message.author.mention }))

      // Shopping is not complete
      if (marriageData.step === 0)
        return message.channel.createMessage(language('fun/marry:SHOPPING_LEFT', { mention: message.author.mention }))
    }

    // User is the spouse and has not yet accepted
    else {
      marriageData.accepted = true
      marriageData.save()

      message.channel.createMessage(
        language('fun/marry:MARRIED_IN_THOUGHT', { mention: message.author.mention, spouse: spouseUser.username })
      )

      // Shopping is not complete
      if (marriageData.step === 0)
        return message.channel.createMessage(language('fun/marry:SHOPPING_LEFT', { mention: message.author.mention }))
    }

    // Prevent a new marriage from creating by cancelling out
    return
  }

  // Since the user is not in a marriage we can begin a marriage simulation for them
  message.channel.createMessage(
    language('fun/marry:PROPOSE', { mention: message.author.mention, coins: constants.emojis.coin })
  )

  const marriage = new Gamer.database.models.marriage({
    authorID: message.author.id,
    spouseID: spouseUser.id,
    step: 0,
    accepted: false
  })
  await marriage.save()

  return Gamer.collectors.set(message.author.id, {
    authorID: message.author.id,
    channelID: message.channel.id,
    createdAt: Date.now(),
    guildID: message.guildID,
    data: {
      marriage
    },
    callback: async msg => {
      if (msg.channel instanceof PrivateChannel || msg.channel instanceof GroupChannel || !msg.member) return
      const CANCEL_OPTIONS = language(`common:CANCEL_OPTIONS`, { returnObjects: true })
      if (CANCEL_OPTIONS.includes(msg.content)) {
        message.channel.createMessage(language(`fun/marry:CANCELLED`, { mention: msg.author.mention }))
        return
      }

      const prefix = Gamer.guildPrefixes.get(msg.channel.guild.id) || Gamer.prefix
      // const data = collector.data as MarriageCollectorData

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

      const embed = new MessageEmbed()
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

      if (!Gamer.guildsDisableTenor.has(msg.channel.guild.id)) {
        // Get a random gif regarding the option the user chose
        const data: TenorGif | undefined = await fetch(
          `https://api.tenor.com/v1/search?q=${search}&key=LIVDSRZULELA&limit=50`
        )
          .then(res => res.json())
          .catch(() => undefined)
        if (!data || !data.results?.length) return

        const randomResult = Gamer.helpers.utils.chooseRandom(data.results)
        const [media] = randomResult.media

        embed.setImage(media.gif.url).setFooter(`Via Tenor`, spouseUser.avatarURL)
      }

      // Send a message so the spouse is able to learn how to accept the marriage
      msg.channel.createMessage({
        content: `${message.author.mention} ${spouseUser.mention}`,
        embed: embed.code
      })
      // Embed that tells the user they can still continue the marriage simulation
      const thoughtOnlyEmbed = new MessageEmbed()
        .setAuthor(message.author.username, message.author.avatarURL)
        .setDescription(language('fun/marry:THOUGHT_ONLY'))
        .setImage('https://i.imgur.com/WwBfZfa.jpg')

      msg.channel.createMessage({ content: message.author.mention, embed: thoughtOnlyEmbed.code })
      msg.channel.createMessage(language('fun/marry:TIME_TO_SHOP', { mention: message.author.mention, prefix }))
    }
  })
})
