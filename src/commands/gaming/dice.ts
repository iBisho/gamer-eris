import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { evaluate } from 'mathjs'
import { MessageEmbed, userTag } from 'helperis'
import constants from '../../constants'

export default new Command([`dice`, `diceroll`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const [options, ...leftovers] = args

  const [first, second] = options?.split('d') || [1, 6]
  const amount = Number(first) || 1
  const maxValue = Number(second) || 6

  // Roll the dice
  const rolls = []
  const modifiedRolls = []

  const result = leftovers.length ? evaluate(leftovers.join(' ')) : 0

  for (let i = 0; i < amount; i++) {
    let randomNumber = Math.floor(Math.random() * maxValue)
    if (randomNumber === 0) randomNumber++
    rolls.push(randomNumber)

    if (result) {
      const modifier = Number(result)
      if (modifier) randomNumber += modifier
    }

    modifiedRolls.push(randomNumber)
  }

  if (!args.length) {
    const [side] = rolls
    const diceemoji =
      side === 1
        ? constants.emojis.dice.one
        : side === 2
        ? constants.emojis.dice.two
        : side === 3
        ? constants.emojis.dice.three
        : side === 4
        ? constants.emojis.dice.four
        : side === 5
        ? constants.emojis.dice.five
        : side === 6
        ? constants.emojis.dice.six
        : '🎲'
    return message.channel.createMessage(`${diceemoji} ${rolls[0].toString()}`)
  }

  const embed = new MessageEmbed()
    .setAuthor(userTag(message.author), message.author.avatarURL)
    .setDescription(language(`gaming/dice:REQUEST`, { value: args.join(' ') }))
    .addField(language(`gaming/dice:ROLLS`), rolls.join(', '))
  if (leftovers.length) embed.addField(language(`gaming/dice:FINAL_ROLLS`), modifiedRolls.join(', '))
  embed.addField(language(`gaming/dice:TOTAL`), rolls.reduce((subtotal, num) => subtotal + num, 0).toString())

  return message.channel.createMessage({ embed: embed.code })
})