import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`tagcreate`, `tc`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return
  const Gamer = context.client as GamerClient

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name, type, ...text] = args
  if (!name || !type || !text.length) return helpCommand.execute(message, [`tagcreate`], context)

  const tagName = name.toLowerCase()

  const tagExists = await Gamer.database.models.tag.findOne({ guildID: message.channel.guild.id, name: tagName })
  if (tagExists) return message.channel.createMessage(language(`tags/tagcreate:EXISTS`, { name }))

  // get type of embed
  const allowedTagTypes = [
    { name: `basic`, allowed: [`basic`, language(`tags/tagcreate:BASIC`).toLowerCase()] },
    { name: `advanced`, allowed: [`advanced`, language(`tags/tagcreate:ADVANCED`).toLowerCase()] }
  ]

  const validType = allowedTagTypes.find(types => types.allowed.includes(type.toLowerCase()))
  if (!validType) return helpCommand.execute(message, [`tagcreate`], context)

  try {
    const emojis = await Gamer.database.models.emoji.find()
    const transformed = Gamer.helpers.transform.variables(
      text.join(' '),
      message.author,
      message.channel.guild,
      message.author,
      emojis
    )
    const embedCode = JSON.parse(transformed)
    if (typeof embedCode.image === 'string') embedCode.image = { url: embedCode.image }
    if (typeof embedCode.thumbnail === 'string') embedCode.thumbnail = { url: embedCode.thumbnail }
    if (embedCode.color === 'RANDOM') embedCode.color = Math.floor(Math.random() * (0xffffff + 1))
    if (embedCode.timestamp) embedCode.timestamp = new Date().toISOString()

    message.channel.createMessage({ content: embedCode.plaintext, embed: embedCode })
    const payload = {
      embedCode: text.join(' '),
      guildID: message.channel.guild.id,
      mailOnly: false,
      name: tagName,
      type: validType.name
    }

    const tag = await Gamer.database.models.tag.create(payload)
    Gamer.tags.set(`${payload.guildID}.${tagName}`, tag)
    return message.channel.createMessage(language(`tags/tagcreate:SAVED`, { name }))
  } catch (error) {
    return message.channel.createMessage(['```js', error, '```'].join('\n'))
  }
})
