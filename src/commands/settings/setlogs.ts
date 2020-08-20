import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { upsertGuild } from '../../database/mongoHandler'

export default new Command([`setlogs`, `logs`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const helpCommand = Gamer.commandForName(`help`)

  const settings = await upsertGuild(message.member.guild.id)
  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings?.staff.adminRoleID)) return

  const [type] = args
  if (!type) return helpCommand?.execute(message, [`setlogs`], { ...context, commandName: 'help' })

  switch (type.toLowerCase()) {
    case `setup`:
      await Gamer.helpers.scripts.createLogSystem(message.member.guild, settings)
      return message.channel.createMessage(language(`settings/setlogs:SETUP`, { mention: message.author.mention }))

    case `roles`: {
      if (!message.channelMentions)
      return message.channel.createMessage(language(`settings/setlogs:NEED_ROLELOGS_CHANNEL`))
  
      const [roleLogs] = message.channelMentions
      settings.moderation.logs.serverlogs.roles.channelID = roleLogs
      settings.moderation.logs.serverlogs.roles.createPublicEnabled = true
      settings.moderation.logs.serverlogs.roles.deletePublicEnabled = true
      settings.moderation.logs.serverlogs.roles.updatePublicEnabled = true
      settings.moderation.logs.serverlogs.roles.memberPublicEnabled = true
      settings.save()
      return message.channel.createMessage(language(`settings/setlogs:ROLELOGS_CHANNEL_UPDATED`, { channel: `<#${roleLogs}>` }))
      }
    case `member`: {
      if (!message.channelMentions)
      return message.channel.createMessage(language(`settings/setlogs:NEED_MEMBERLOGS_CHANNEL`))

      const [memberLogs] = message.channelMentions
      settings.moderation.logs.serverlogs.members.channelID = memberLogs
      settings.moderation.logs.serverlogs.members.addPublicEnabled = true
      settings.moderation.logs.serverlogs.members.nicknamePublicEnabled = true
      settings.save()
      return message.channel.createMessage(language(`settings/setlogs:MEMBERLOGS_CHANNEL_UPDATED`, { channel: `<#${memberLogs}>` }))
      }
    case `message`: {
      if (!message.channelMentions)
      return message.channel.createMessage(language(`settings/setlogs:NEED_MESSAGELOGS_CHANNEL`))

      const [messageLogs] = message.channelMentions
      settings.moderation.logs.serverlogs.messages.channelID = messageLogs
      settings.moderation.logs.serverlogs.messages.deletedPublicEnabled = true
      settings.save()
      return message.channel.createMessage(language(`settings/setlogs:MESSAGELOGS_CHANNEL_UPDATED`, { channel: `<#${messageLogs}>` }))
      }
    case `other`: {
      if (!message.channelMentions)
      return message.channel.createMessage(language(`settings/setlogs:NEED_OTHERLOGS_CHANNEL`))

      const [otherLogs] = message.channelMentions
      settings.moderation.logs.serverlogs.emojis.channelID = otherLogs
      settings.moderation.logs.serverlogs.emojis.createPublicEnabled = true
      settings.moderation.logs.serverlogs.emojis.deletePublicEnabled = true
      settings.moderation.logs.serverlogs.emojis.updatePublicEnabled = true
      settings.save()
      return message.channel.createMessage(language(`settings/setlogs:OTHERLOGS_CHANNEL_UPDATED`, { channel: `<#${otherLogs}>` }))
      }
    case `channel`: {
      if (!message.channelMentions)
      return message.channel.createMessage(language(`settings/setlogs:NEED_CHANNELLOGS_CHANNEL`))

      const [channelLogs] = message.channelMentions
      settings.moderation.logs.serverlogs.channels.channelID = channelLogs
      settings.moderation.logs.serverlogs.channels.createPublicEnabled = true
      settings.moderation.logs.serverlogs.channels.deletePublicEnabled = true
      settings.moderation.logs.serverlogs.channels.updatePublicEnabled = true
      settings.save()
      return message.channel.createMessage(language(`settings/setlogs:CHANNELLOGS_CHANNEL_UPDATED`, { channel: `<#${channelLogs}>`}))
      }
    case `public`: {
      if (!message.channelMentions)
      return message.channel.createMessage(language(`settings/setlogs:NEED_PUBLICLOGS_CHANNEL`))

      const [publicLogs] = message.channelMentions
      settings.moderation.logs.publiclogsChannelID = publicLogs
      settings.save()
      return message.channel.createMessage(language(`settings/setlogs:PUBLICLOGS_CHANNEL_UPDATED`, { channel: `<#${publicLogs}>`}))
      }
    case `voice`: {
      if (!message.channelMentions)
      return message.channel.createMessage(language(`settings/setlogs:NEED_VOICELOGS_CHANNEL`))

      const [voiceLogs] = message.channelMentions
      settings.moderation.logs.serverlogs.voice.channelID = voiceLogs
      settings.moderation.logs.serverlogs.voice.joinPublicEnabled = true
      settings.moderation.logs.serverlogs.voice.leavePublicEnabled = true
      settings.save()
      return message.channel.createMessage(language(`settings/setlogs:VOICELOGS_CHANNEL_UPDATED`, { channel: `<#${voiceLogs}>`}))
      }
    case `modlogs`: {
      if (!message.channelMentions)
      return message.channel.createMessage(language(`settings/setlogs:NEED_MODLOGS_CHANNEL`))

      const [modLogs] = message.channelMentions
      settings.moderation.logs.modlogsChannelID = modLogs
      settings.save()
      return message.channel.createMessage(language(`settings/setlogs:MODLOGS_CHANNEL_UPDATED`, { channel: `<#${modLogs}>`}))
      }
  }

  return helpCommand?.execute(message, [`setlogs`], { ...context, commandName: 'help' })
})
