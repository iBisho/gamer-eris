import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'
import { GamerTag } from '../lib/types/gamer'

export default new Command([`tagcreate`, `tc`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return
  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name, type, ...text] = args
  if (!name || !type || !text.length) return helpCommand.execute(message, [`tagcreate`], context)

  const tagName = name.toLowerCase()

  const tagExists = await Gamer.database.models.tag.findOne({ guildID: message.channel.guild.id, name: tagName })
  if (tagExists) return message.channel.createMessage(language(`tags/tagcreate:EXISTS`, { name }))

  // get type of embed
  const allowedTagTypes = [
    { name: `basic`, allowed: [`basic`, language(`tags/tagcreate:BASIC`)] },
    { name: `advanced`, allowed: [`advanced`, language(`tags/tagcreate:ADVANCED`)] },
    { name: `random`, allowed: [`random`, language(`tags/tagcreate:RANDOM`)] }
  ]

  const validType = allowedTagTypes.find(types => types.allowed.includes(type.toLowerCase()))
  if (!validType) return helpCommand.execute(message, [`tagcreate`], context)

  // if (validType.name === `random`) {
  //   tagContent = tagContent.split(` `).filter(url => this.client.helpers.utils.isValidURL(url))
  //   if (!tagContent.length) return message.respond(message.language.get(`tag:NO_URLS`))
  // } else if (tagContent.startsWith(`{`)) {
  //   const embedObj = this.client.helpers.utils.tryParseObjectString(tagContent)
  //   if (!embedObj) return message.respond(message.language.get(`BAD_EMBED`))
  // }

  const payload = {
    embedCode: text.join(' '),
    guildID: message.channel.guild.id,
    mailOnly: false,
    name: tagName,
    type: validType.name
  }

  const tag = (await Gamer.database.models.tag.create(payload)) as GamerTag
  Gamer.tags.set(`${payload.guildID}.${payload.name}`, tag)
  return message.channel.createMessage(language(`tags/tag:SAVED`, { name }))
})
