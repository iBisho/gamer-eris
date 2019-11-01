import { Command } from 'yuuko'
import fetch from 'node-fetch'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'

export default new Command(`urban`, async (message, args, context) => {
  const Gamer = context.client as GamerClient

  const guildSettings =
    message.channel instanceof PrivateChannel
      ? null
      : ((await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null)
  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : 'en-US')
  if (!language) return null

  // Check all permissions before running command
  if (!(message.channel instanceof PrivateChannel)) {
    if (!message.channel.nsfw)
      return message.channel
        .createMessage(language(`fun/urban:NSFW`))
        .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))
  }

  const term = args.join(` `)
  const data = (await fetch(`http://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`)
    .then(res => res.json())
    .catch(() => [])) as Urban

  const [highestRated] = data.list.sort((a, b) => b.thumbs_up - a.thumbs_up)

  const embed = new GamerEmbed()
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )
    .setTitle(Gamer.helpers.transform.splitCamelCase(term))
    .addField(language(`fun/urban:DEFINITION`), highestRated.definition)
    .addField(language(`fun/urban:EXAMPLE`), highestRated.example)
    .addField(language(`fun/urban:AUTHOR`), highestRated.author)
    .addField(`:thumbsup:`, highestRated.thumbs_up.toString(), true)
    .addField(`:thumbsdown:`, highestRated.thumbs_down.toString(), true)
    .setFooter(language(`fun/urban:CREDITS`))

  return message.channel.createMessage({ embed: embed.code })
})

export interface Urban {
  list: UrbanData[]
}

export interface UrbanData {
  definition: string
  permalink: string
  thumbs_up: number
  sound_urls: unknown[]
  author: string
  word: string
  defid: number
  current_vote: string
  written_on: Date
  example: string
  thumbs_down: number
}
