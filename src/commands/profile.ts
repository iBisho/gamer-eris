import { Command } from 'yuuko'
import { GuildSettings, UserSettings } from '../lib/types/settings'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'
import UserDefaults from '../constants/settings/user'

export default new Command([`profile`, `p`, `prof`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || !message.member) return

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
  if (!language) return

  const [id] = args
  const memberID = message.mentions.length ? message.mentions[0].id : id

  const member = message.channel.guild.members.get(memberID)
  if (!member) return

  const buffer = await Gamer.helpers.profiles.makeCanvas(message, member, Gamer)
  if (!buffer) return

  const response = await message.channel.createMessage('', { file: buffer, name: `profile.jpg` })

  const userSettings =
    ((await Gamer.database.models.user.findOne({
      id: message.channel.guild.id
    })) as UserSettings) || UserDefaults

  const backgroundData = constants.profiles.backgrounds.find(bg => bg.id === userSettings.profile.backgroundID)

  const isDefaultBackground = backgroundData && backgroundData.name === constants.profiles.defaultBackground

  const reaction = Gamer.helpers.discord.convertEmoji(constants.emojis.discord, `reaction`)
  if (isDefaultBackground && reaction) response.addReaction(reaction)
})
