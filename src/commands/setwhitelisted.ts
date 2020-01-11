import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command(`setwhitelisted`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const language = Gamer.getLanguage(message.channel.guild.id)

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  let settings = await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings?.staff.adminRoleID)) return
  if (!settings) settings = await Gamer.database.models.guild.create({ id: message.channel.guild.id })

  const [type] = args
  if (!type) return helpCommand.process(message, [`setwhitelisted`], context)

  switch (type.toLowerCase()) {
    case `enable`:
      if (settings.moderation.filters.url.enabled)
        return message.channel.createMessage(language(`settings/setwhitelisted:ALREADY_ENABLED`))
      settings.moderation.filters.url.enabled = true
      settings.save()
      return message.channel.createMessage(language(`settings/setwhitelisted:ENABLED`))
    case `disable`:
      if (!settings.moderation.filters.url.enabled)
        return message.channel.createMessage(language(`settings/setwhitelisted:ALREADY_DISABLED`))
      settings.moderation.filters.url.enabled = false
      settings.save()
      return message.channel.createMessage(language(`settings/setwhitelisted:DISABLED`))
    case `role`:
      if (!message.roleMentions.length)
        return message.channel.createMessage(language(`settings/setwhitelisted:NEED_ROLE`))
      const [roleID] = message.roleMentions
      const roleExists = settings.moderation.filters.url.roleIDs.includes(roleID)
      if (!roleExists) settings.moderation.filters.url.roleIDs.push(roleID)
      else settings.moderation.filters.url.roleIDs = settings.moderation.filters.url.roleIDs.filter(id => id !== roleID)
      settings.save()

      return message.channel.createMessage(
        language(roleExists ? `settings/setwhitelisted:ROLE_REMOVED` : `settings/setwhitelisted:ROLE_ADDED`)
      )
    case `channel`:
      if (!message.channelMentions || !message.channelMentions.length)
        return message.channel.createMessage(language(`settings/setwhitelisted:NEED_CHANNEL`))
      const [channelID] = message.channelMentions
      const channelExists = settings.moderation.filters.url.channelIDs.includes(channelID)
      if (!channelExists) settings.moderation.filters.url.channelIDs.push(channelID)
      else
        settings.moderation.filters.url.channelIDs = settings.moderation.filters.url.channelIDs.filter(
          id => id !== channelID
        )
      settings.save()

      return message.channel.createMessage(
        language(channelExists ? `settings/setwhitelisted:CHANNEL_REMOVED` : `settings/setwhitelisted:CHANNEL_ADDED`)
      )
    case `user`:
      if (!message.mentions.length) return message.channel.createMessage(language(`settings/setwhitelisted:NEED_USER`))
      const userID = message.mentions[0].id
      const userExists = settings.moderation.filters.url.userIDs.includes(userID)
      if (!userExists) settings.moderation.filters.url.userIDs.push(userID)
      else settings.moderation.filters.url.userIDs = settings.moderation.filters.url.userIDs.filter(id => id !== userID)
      settings.save()

      return message.channel.createMessage(
        language(userExists ? `settings/setwhitelisted:USER_REMOVED` : `settings/setwhitelisted:USER_ADDED`)
      )
    case `url`:
      // Remove the type and the leftover should be the urls
      args.shift()
      if (!args.length) return message.channel.createMessage(language(`settings/setwhitelisted:NEED_URL`))

      const [url] = args
      const urlExists = settings.moderation.filters.url.urls.includes(url)

      if (!urlExists) settings.moderation.filters.url.urls.push(url)
      else settings.moderation.filters.url.urls = settings.moderation.filters.url.urls.filter(id => id !== url)
      settings.save()

      return message.channel.createMessage(
        language(urlExists ? `settings/setwhitelisted:URL_REMOVED` : `settings/setwhitelisted:URL_ADDED`)
      )
  }

  return
})
