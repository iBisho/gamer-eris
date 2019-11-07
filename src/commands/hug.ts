import { Command } from 'yuuko'
import fetch from 'node-fetch'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { TenorGif } from '../lib/types/tenor'
import { GuildSettings } from '../lib/types/settings'
import { PrivateChannel } from 'eris'

export default new Command(`hug`, async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : 'en-US')
  if (!language) return

  const data: TenorGif | undefined = await fetch(`https://api.tenor.com/v1/search?q=hug&key=LIVDSRZULELA&limit=50`)
    .then(res => res.json())
    .catch(() => undefined)

  if (!data || !data.results.length) return message.channel.createMessage(language(`fun/advice:ERROR`))
  const randomResult = data.results[Math.floor(Math.random() * (data.results.length - 1))]
  const [media] = randomResult.media

  const user = message.mentions.length ? message.mentions[0] : message.author

  const embed = new GamerEmbed()
    .setAuthor(
      message.member ? message.member.nick || message.member.username : message.author.username,
      message.author.avatarURL
    )
    .setDescription(
      language(user.id === message.author.id ? `fun/hug:SELF` : `fun/hug:REPLY`, {
        mention: user.mention,
        author: message.author.mention
      })
    )
    .setImage(media.gif.url)
    .setFooter(`Via Tenor`)

  message.channel.createMessage({ embed: embed.code })

  return Gamer.helpers.levels.completeMission(message.member, `hug`, message.channel.guild.id)
})
