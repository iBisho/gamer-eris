import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { sendMessage } from '../../lib/utils/eris'
import { MessageEmbed, userTag } from 'helperis'

export default new Command(`spy`, async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  if (!Gamer.vipGuildIDs.has(message.member.guild.id)) return

  const language = Gamer.getLanguage(message.member.guild.id)

  const [type, word] = args
  const helpCommand = Gamer.commandForName('help')
  if (!type) return helpCommand?.execute(message, ['spy'], { ...context, commandName: 'help' })
  if (!['add', 'remove', 'list'].includes(type.toLowerCase()))
    return helpCommand?.execute(message, ['spy'], { ...context, commandName: 'help' })

  if (type.toLowerCase() === 'list') {
    const spyRecords = await Gamer.database.models.spy.findOne({
      memberID: message.member.id,
      guildID: message.member.guild.id
    })
    if (!spyRecords) return sendMessage(message.channel.id, language('vip/spy:NONE'))

    const embed = new MessageEmbed()
      .setAuthor(userTag(message.author), message.author.avatarURL)
      .setDescription(spyRecords.words.join(', '))
      .setTimestamp()

    return sendMessage(message.channel.id, { embed: embed.code })
  }

  if (!word) return helpCommand?.execute(message, ['spy'], { ...context, commandName: 'help' })

  const isAdd = type === 'add'

  const records = Gamer.spyRecords.get(word)
  if (!records) {
    if (isAdd) {
      Gamer.spyRecords.set(word, [message.author.id])
      Gamer.database.models.spy.create({
        memberID: message.member.id,
        guildID: message.member.guild.id,
        words: [word.toLowerCase()]
      })
    }

    return sendMessage(message.channel.id, language(isAdd ? 'vip/spy:WORD_ADDED' : 'vip/spy:DONT_EXIST', { word }))
  }

  const details = await Gamer.database.models.spy.findOne({
    memberID: message.member.id,
    guildID: message.member.guild.id
  })

  if (isAdd) {
    if (records.includes(message.author.id))
      return sendMessage(message.channel.id, language('vip/spy:ALREADY_SPYING', { word }))

    records.push(message.author.id)

    details?.words.push(word.toLowerCase())
    details?.save()

    return sendMessage(message.channel.id, language('vip/spy:WORD_ADDED', { word }))
  }

  if (!records.includes(message.author.id))
    return sendMessage(message.channel.id, language('vip/spy:DONT_EXIST', { word }))

  Gamer.spyRecords.set(
    word,
    records.filter(id => id !== message.author.id)
  )
  if (details) {
    details.words = details.words.filter(w => w !== word.toLowerCase())
    details.save()
  }

  return sendMessage(message.channel.id, language('vip/spy:WORD_REMOVED', { word }))
})
