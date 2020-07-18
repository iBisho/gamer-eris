import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { VoiceChannel } from 'eris'

export default new Command(`move`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const [channelID, newChannelID] = args
  if (!channelID) return message.channel.createMessage(language(`moderation/move:NEED_CHANNEL`))

  const channel = message.member.guild.channels.get(channelID)
  // If not a valid voice channel cancel
  if (!channel || !(channel instanceof VoiceChannel))
    return message.channel.createMessage(language(`moderation/move:NEED_CHANNEL`))

  const hasPermission = channel.permissionsOf(Gamer.user.id).has(`voiceMoveMembers`)
  const userHasPermission = channel.permissionsOf(message.author.id).has(`voiceMoveMembers`)

  // Check if the bot has the Move Members permissions
  if (!hasPermission) return message.channel.createMessage(language(`moderation/move:NEED_MOVE_MEMBERS`))
  if (!userHasPermission) return message.channel.createMessage(language(`moderation/move:MISSING_PERM`))

  const newChannel = newChannelID ? message.member.guild.channels.get(newChannelID) : undefined

  const REASON = language(`moderation/move:REASON`, {
    user: `${message.author.username}#${message.author.discriminator}`
  })

  if (!Gamer.allMembersFetchedGuildIDs.has(message.member.guild.id)) {
    await message.member.guild.fetchAllMembers()
    Gamer.allMembersFetchedGuildIDs.add(message.member.guild.id)
  }

  // If a valid new channel was provided we simply move all the users in the channel over
  if (newChannel) {
    channel.voiceMembers?.forEach(async member => {
      // Will force fetch uncached members
      await Gamer.helpers.discord.fetchMember(member.guild, member.id)
      member.edit({ channelID: newChannel.id }, REASON)
    })
  } else {
    if (!message.mentions.length) return message.channel.createMessage(language(`moderation/move:NEED_MEMBERS`))
    message.mentions.forEach(async user => {
      if (!message.member) return

      const member = await Gamer.helpers.discord.fetchMember(message.member.guild, user.id)
      if (!member || !member.voiceState.channelID) return
      member.edit({ channelID }, REASON)
    })
  }

  return message.channel.createMessage(language(`moderation/move:SUCCESS`))
})
