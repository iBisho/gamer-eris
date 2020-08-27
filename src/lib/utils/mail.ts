import {
  Message,
  Guild,
  CategoryChannel,
  Constants,
  Overwrite,
  TextChannel,
  User,
  GuildChannel,
  PrivateChannel
} from 'eris'
import { GuildSettings } from '../types/settings'
import GamerClient from '../structures/GamerClient'
import { GamerMail } from '../types/gamer'
import { MessageEmbed, highestRole } from 'helperis';
import nodefetch from 'node-fetch'
import { deleteMessage, sendMessage } from './eris'

const channelNameRegex = /^-+|[^\w-]|-+$/g

export default class {
  Gamer: GamerClient

  constructor(client: GamerClient) {
    this.Gamer = client
  }

  async handleDM(message: Message, content: string) {
    // DM will be in english always
    const language = this.Gamer.getLanguage()
    if (!content.length) return message.channel.createMessage(language(`mails/mail:NEED_CONTENT`))

    const mails = await this.Gamer.database.models.mail.find({ userID: message.author.id })
    // If the user has no mails and hes trying to create a mail it needs to error because mails must be created within a guild.
    let [mail] = mails
    if (!mail) return message.channel.createMessage(language(`mails/mail:NEW_MAIL_IN_DM_ERROR`))

    // A user can have multiple mails open in difference servers
    if (mails.length > 1) {
      // The first arg should be mail id if multiple mails. Ex: .mail 2 mail content here
      const [mailID] = content
      if (mailID) {
        const id = parseInt(mailID, 10)
        if ((!id && id !== 0) || id > mails.length) {
          const mailData = mails
            .map((mail, index) => {
              const guild = this.Gamer.guilds.get(mail.guildID)
              return `**[${index}]** ${guild ? guild.name : mail.guildID}`
            })
            .join('\n')
          return message.channel.createMessage(language(`mails/mail:NEED_MAIL_ID`, { mails: mailData }))
        }
        // User provided some id number
        mail = mails[id]
        // Remove the id from the content string
        content = content.substring(2)
      }
    }

    if (!mail) return

    const guild = this.Gamer.guilds.get(mail.guildID)
    if (!guild) return

    const guildSettings = await this.Gamer.database.models.guild.findOne({ guildID: guild.id })

    this.sendToMods(message, guild, guildSettings, content, mail)
    return message.channel.createMessage(language(`mails/mail:REPLY_SENT_TO_MODS`))
  }

  async handleSupportChannel(message: Message, content: string, guildSettings: GuildSettings) {
    if (!message.guildID || !message.member) return

    const mail = await this.Gamer.database.models.mail.findOne({
      guildID: message.guildID,
      userID: message.author.id
    })
    // If the user doesn't have an open mail we need to create one
    if (!mail) return this.createMail(message, content, guildSettings)

    const language = this.Gamer.getLanguage(message.guildID)

    // User does have an open mail
    this.sendToMods(message, message.member.guild, guildSettings, content, mail)
    const response = await message.channel
      .createMessage(language(`mails/mail:REPLY_SENT_TO_MODS`))
      .catch(() => undefined)
    return setTimeout(() => response?.delete().catch(() => undefined), 10000)
  }

  async createMail(message: Message, content: string, guildSettings: GuildSettings | null, user?: User) {
    if (!message.member) return

    const mailUser = user || message.author
    const language = this.Gamer.getLanguage(message.member.guild.id)
    const botMember = await this.Gamer.helpers.discord.fetchMember(message.member.guild, this.Gamer.user.id)
    if (!botMember?.permission.has('manageChannels') || !botMember.permission.has('manageRoles'))
      return message.channel.createMessage(language(`mails/mail:MISSING_PERMISSIONS`))

    if (!guildSettings?.mails.enabled) return message.channel.createMessage(language(`mails/mail:DISABLED`))

    const usernameToChannelName = mailUser.username.replace(channelNameRegex, ``).toLowerCase()
    const channelName = `${usernameToChannelName}${mailUser.discriminator}`

    const [firstWord] = content.split(' ')
    const label = firstWord
      ? await this.Gamer.database.models.label.findOne({
          guildID: message.member.guild.id,
          name: firstWord.toLowerCase()
        })
      : undefined

    let category = label
      ? message.member.guild.channels.get(label.categoryID)
      : guildSettings.mails.categoryID
      ? message.member.guild.channels.get(guildSettings.mails.categoryID)
      : undefined

    // create a category if there is no category saved or the saved one is not existing anymore

    if (!category || !(category instanceof CategoryChannel)) {
      const overwrites: Overwrite[] = [
        { id: this.Gamer.user.id, allow: Constants.Permissions.readMessages, deny: 0, type: 'member' },
        { id: message.member.guild.id, allow: 0, deny: Constants.Permissions.readMessages, type: 'role' }
      ]
      const ids = guildSettings.staff.modRoleIDs
      if (guildSettings.staff.adminRoleID) ids.push(guildSettings.staff.adminRoleID)
      for (const id of ids) overwrites.push({ id, allow: Constants.Permissions.readMessages, deny: 0, type: 'role' })

      category = await message.member.guild.createChannel(language(`mails/mail:CATEGORY_NAME`), 4, {
        reason: language(`mails/mail:CATEGORY_CREATED_REASON`),
        permissionOverwrites: overwrites
      })

      guildSettings.mails.categoryID = category.id
      guildSettings.save()
    }

    const bot = await this.Gamer.helpers.discord.fetchMember(message.member.guild, this.Gamer.user.id)
    if (!bot?.permission.has('manageChannels'))
      return message.channel.createMessage(language(`mails/mail:CHANNEL_CREATE_FAILED`))
    // Make sure the category can be read since we need to create a channel inside this category
    if (!category.permissionsOf(this.Gamer.user.id).has('readMessages'))
      return message.channel.createMessage(language(`mails/mail:CHANNEL_CREATE_FAILED`))

    if (category.channels.size === 50) return message.channel.createMessage(language(`mails/mail:TOO_MANY_CHANNELS`))

    // Creates a text channel by default and we move it to the mail category
    const channel = await message.member.guild.createChannel(channelName, 0, { parentID: category.id })
    const finalContent = content.substring(label ? content.indexOf(' ') + 1 : 0)
    const topic = finalContent.substring(0, finalContent.length > 50 ? 50 : finalContent.length)

    const mail = await this.Gamer.database.models.mail.create({
      channelID: channel.id,
      userID: mailUser.id,
      guildID: message.member.guild.id,
      topic
    })

    // Add to cache manually as createChannel doesnt cache it
    message.member.guild.channels.add(channel)
    await this.sendToMods(message, message.member.guild, guildSettings, content, mail)
    if (!user) deleteMessage(message)
    const response = await message.channel.createMessage(language(`mails/mail:CREATED`))
    return deleteMessage(response, 10)
  }

  async sendToMods(
    message: Message,
    guild: Guild,
    guildSettings: GuildSettings | null,
    content: string,
    mail: GamerMail
  ) {
    const prefix = guildSettings?.prefix || this.Gamer.prefix
    const language = this.Gamer.getLanguage(guild.id)

    const embed = new MessageEmbed()
      // .setAuthor(language(`mails/mail:FROM`, { user: userTag(message.author) }), message.author.avatarURL)
      .setAuthor(
        language(`mails/mail:SENT_BY`, {
          user: message.member?.nick || message.author.username,
          channel: message.channel instanceof GuildChannel ? message.channel.name : 'DM'
        }),
        message.author.avatarURL
      )
      .setDescription(content)
      .setFooter(language(`mails/mail:USERID`, { id: message.author.id }))
      .addField(language(`mails/mail:SEND_REPLY`), language(`mails/mail:SEND_REPLY_INFO`, { prefix }), true)
      .addField(language(`mails/mail:CLOSE`), language(`mails/mail:CLOSE_INFO`, { prefix }), true)
      .setTimestamp()

    const channel = guild.channels.get(mail.channelID)
    if (!channel || !(channel instanceof TextChannel)) return

    const hasPermission = this.Gamer.helpers.discord.checkPermissions(channel, this.Gamer.user.id, [
      'readMessages',
      'sendMessages',
      'embedLinks',
      'attachFiles'
    ])
    if (!hasPermission) return

    const botMember = await this.Gamer.helpers.discord.fetchMember(guild, this.Gamer.user.id)
    if (!botMember?.permission.has('manageRoles')) return

    const alertRoleIDs = guildSettings?.mails.alertRoleIDs || []
    const modifiedRoleIDs: string[] = []
    for (const roleID of alertRoleIDs) {
      const role = guild.roles.get(roleID)
      // If role is already mentionable or cant find role skip
      if (!role || role.mentionable) continue
      if (highestRole(botMember).position < role.position) continue;
      // Make the role mentionable. Need to await so it can be mentionable when sending the message
      await role.edit({ mentionable: true })
      modifiedRoleIDs.push(roleID)
    }

    // Await so the message sends before we make roles unmentionable again
    await this.Gamer.createMessage(mail.channelID, {
      content: alertRoleIDs
        .filter(id => guild.roles.has(id))
        .map(roleID => `<@&${roleID}>`)
        .join(' '),
      embed: embed.code
    })

    const [attachment] = message.attachments
    if (attachment) {
      if (message.channel instanceof PrivateChannel) {
        embed.setImage(attachment.proxy_url)
      } else {
        try {
          const buffer = await nodefetch(attachment.proxy_url).then(res => {
            return res.buffer()
          })
          await channel.createMessage('', {
            file: buffer,
            name: attachment.filename
          })
        } catch (error) {
          console.log('mail ', error)
        }
      }
    }

    // Disable the mentionable roles again after message is sent
    for (const roleID of modifiedRoleIDs) {
      const role = guild.roles.get(roleID)
      if (!role) continue
      role.edit({ mentionable: false })
    }

    this.logMail(guildSettings, embed)
  }

  async replyToMail(message: Message, guildSettings: GuildSettings | null, content: string, mail: GamerMail) {
    if (!message.guildID || !message.member) return

    const tag = await this.Gamer.database.models.tag.findOne({
      guildID: message.guildID,
      mailOnly: true,
      name: content.toLowerCase()
    })

    const user = await this.Gamer.helpers.discord.fetchUser(mail.userID)
    if (!user) return

    const language = this.Gamer.getLanguage(message.guildID)

    // If the moderator is trying to send a tag
    if (tag) {
      // Fetch all emojis to transform variables
      const emojis = await this.Gamer.database.models.emoji.find()
      // Transform the tag string
      const transformed = await this.Gamer.helpers.transform.variables(
        tag.embedCode,
        user,
        message.member.guild,
        message.author,
        emojis
      )

      let success = false
      try {
        // Convert the string to JSON
        const embed = JSON.parse(transformed)
        // Get the user dm and send the embed
        const dmChannel = await user.getDMChannel()
        await dmChannel.createMessage({ content: embed.plaintext, embed: embed })
        // Tell the user who sent them the message above because the tag might not be clear
        dmChannel.createMessage(
          language(`mails/mail:TAG_SENT_BY`, { user: message.author.username, guild: message.member.guild.name })
        )
        // Tell the mod the message was sent
        message.channel.createMessage(language(`mails/mail:TAG_SENT`, { name: tag.name }))
        // Show the tag sent to the mods
        message.channel.createMessage({ content: embed.plaintext, embed: embed })
        success = true

        this.logMail(guildSettings, embed)
      } catch (error) {
        // Something went wrong somewhere so show it failed
        return message.channel.createMessage(language(`mails/mail:DM_FAILED`, { name: tag.name }))
      }

      // Some error happened so cancel out
      if (!success) return
    }

    const embed = new MessageEmbed()
      .setAuthor(
        language(`mails/mail:REPLY_FROM`, {
          user: message.member?.nick || message.author.username,
          guild: message.member.guild.name
        }),
        message.author.avatarURL
      )
      .setDescription(content)
      .addField(
        language(`mails/mail:SEND_REPLY`),
        language(
          guildSettings?.mails.supportChannelID ? `mails/mail:SEND_REPLY_INFO` : `mails/mail:SEND_REPLY_INFO_SUPPORT`,
          {
            prefix: this.Gamer.prefix,
            channel: `<#${guildSettings?.mails.supportChannelID}>`
          }
        )
      )
      .setFooter(mail.topic)
      .setTimestamp()

    const [attachment] = message.attachments
    if (attachment) embed.setImage(attachment.url)

    try {
      const dmChannel = await user.getDMChannel()
      await dmChannel.createMessage({ embed: embed.code })
    } catch (error) {
      return message.channel.createMessage(language(`mails/mail:DM_FAILED`))
    }

    this.logMail(guildSettings, embed)
    // Reset the embeds fields
    embed.code.fields = []

    deleteMessage(message)

    return message.channel.createMessage({ embed: embed.code })
  }

  async close(message: Message, content: string, guildSettings: GuildSettings | null, mail: GamerMail) {
    // If an empty string is passed cancel the command
    if (!message.guildID || !message.member || !content) return

    const language = this.Gamer.getLanguage(message.guildID)

    const botMember = await this.Gamer.helpers.discord.fetchMember(message.member.guild, this.Gamer.user.id)
    if (!botMember?.permission.has('manageChannels'))
      return message.channel.createMessage(language(`mails/mail:MISSING_PERMISSIONS`))

    const prefix = guildSettings?.prefix || this.Gamer.prefix

    const tag = await this.Gamer.database.models.tag.findOne({
      guildID: message.guildID,
      mailOnly: true,
      name: content.toLowerCase()
    })

    const user = await this.Gamer.helpers.discord.fetchUser(mail.userID)
    if (!user) return

    // Delete the mail from the database
    this.Gamer.database.models.mail.deleteOne({ guildID: message.guildID, userID: mail.userID }).exec()

    const dmEmbed = new MessageEmbed()
      .setAuthor(
        language(`mails/mail:CLOSED_BY`, {
          user: message.member?.nick || message.author.username,
          guild: message.member.guild.name
        }),
        message.author.avatarURL
      )
      .setDescription(content)
      .addField(language(`mails/mail:CLOSED`), language(`mails/mail:CLOSED_INFO`, { prefix }))
      .setTimestamp()

    try {
      // Get the user dm and send the embed
      const dmChannel = await user.getDMChannel()
      // If the moderator is trying to send a tag
      if (tag) {
        // Fetch all emojis to transform variables
        const emojis = await this.Gamer.database.models.emoji.find()
        // Transform the tag string
        const transformed = await this.Gamer.helpers.transform.variables(
          tag.embedCode,
          user,
          message.member.guild,
          message.author,
          emojis
        )
        // Convert the string to JSON
        const embed = JSON.parse(transformed)
        await dmChannel.createMessage({ content: embed.plaintext, embed: embed })
      }
      // Alerts the user that mail closed
      // If the tag was sent still send this because it tells the user who sent them the message above
      // because the tag might not be clear and that the mail is closed
      await dmChannel.createMessage({ embed: dmEmbed.code })
    } catch {}

    const channel = message.channel as GuildChannel
    channel.delete(language(`mails/mail:CHANNEL_DELETE_REASON`, { user: encodeURIComponent(message.author.username) }))

    return this.logMail(guildSettings, dmEmbed)
  }

  logMail(guildSettings: GuildSettings | null, embed: MessageEmbed) {
    if (!guildSettings?.mails.logChannelID) return

    sendMessage(guildSettings.mails.logChannelID, { embed: embed.code })
  }
}
