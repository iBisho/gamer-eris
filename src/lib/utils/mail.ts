import { Message, Guild, CategoryChannel, Constants, Overwrite, TextChannel, User, GuildChannel } from 'eris'
import { GuildSettings } from '../types/settings'
import GamerClient from '../structures/GamerClient'
import { GamerMail } from '../types/gamer'
import GamerEmbed from '../structures/GamerEmbed'

const channelNameRegex = /^-+|[^\w-]|-+$/g

export default class {
  Gamer: GamerClient

  constructor(client: GamerClient) {
    this.Gamer = client
  }

  async handleDM(message: Message, content: string) {
    // DM will be in english always
    const language = this.Gamer.getLanguage()

    const mails = await this.Gamer.database.models.mail.find({ userID: message.author.id })
    // If the user has no mails and hes trying to create a mail it needs to error because mails must be created within a guild.
    if (!mails.length) return message.channel.createMessage(language(`mails/mail:NEW_MAIL_IN_DM_ERROR`))

    let [mail] = mails
    // A user can have multiple mails open in difference servers
    if (mails.length > 1) {
      // The first arg should be mail id if multiple mails. Ex: .mail 2 mail content here
      const [mailID] = content
      const id = parseInt(mailID, 10)
      if (!id || id > mails.length) {
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

    const guild = this.Gamer.guilds.get(mail.guildID)
    if (!guild) return

    const guildSettings = await this.Gamer.database.models.guild.findOne({ id: guild.id })

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
    const response = await message.channel.createMessage(language(`mails/mail:REPLY_SENT_TO_MODS`))
    return setTimeout(() => response.delete().catch(() => undefined), 10000)
  }

  async createMail(message: Message, content: string, guildSettings: GuildSettings | null, user?: User) {
    if (!message.guildID || !message.member) return

    const mailUser = user || message.author

    const language = this.Gamer.getLanguage(message.guildID)

    const botMember = message.member.guild.members.get(this.Gamer.user.id)
    if (!botMember || !botMember.permission.has('manageChannels') || !botMember.permission.has('manageRoles'))
      return message.channel.createMessage(language(`mails/mail:MISSING_PERMISSIONS`))

    if (!guildSettings?.mails.enabled) return message.channel.createMessage(language(`mails/mail:DISABLED`))

    const usernameToChannelName = mailUser.username.replace(channelNameRegex, ``).toLowerCase()
    const channelName = `${usernameToChannelName}${mailUser.discriminator}`

    const [firstWord] = content.split(' ')
    const label = await this.Gamer.database.models.label.findOne({
      guildID: message.guildID,
      name: firstWord.toLowerCase()
    })

    let category = label
      ? message.member.guild.channels.get(label.categoryID)
      : guildSettings.mails.categoryID
      ? message.member.guild.channels.get(guildSettings.mails.categoryID)
      : undefined

    // create a category if there is no category saved or the saved one is not existing anymore

    if (!category || !(category instanceof CategoryChannel)) {
      const overwrites: Overwrite[] = [
        { id: this.Gamer.user.id, allow: Constants.Permissions.readMessages, deny: 0, type: 'member' },
        { id: message.guildID, allow: 0, deny: Constants.Permissions.readMessages, type: 'role' }
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

    // Creates a text channel by default and we move it to the mail category
    const channel = await message.member.guild.createChannel(channelName, 0, { parentID: category.id })

    // if channel could not be created send an embed to the user so he can annoy the mods / admins
    if (!channel) return message.channel.createMessage(language(`mails/mail:CHANNEL_CREATE_FAILED`))

    this.Gamer.amplitude.push({
      authorID: mailUser.id,
      channelID: channel.id,
      guildID: message.guildID,
      messageID: message.id,
      timestamp: message.timestamp,
      type: 'MAIL_CREATE'
    })

    const topic = content.substring(0, content.length > 50 ? 50 : content.length)

    await this.Gamer.database.models.mail.create({
      id: channel.id,
      userID: mailUser.id,
      guildID: message.guildID,
      topic
    })

    const prefix = guildSettings.prefix

    const embed = new GamerEmbed()
      .setAuthor(
        language(`mails/mail:SENT_BY`, {
          user: message.member?.nick || mailUser.username,
          channel: (message.channel as GuildChannel).name
        }),
        mailUser.avatarURL
      )
      .setDescription(content)
      .addField(language(`mails/mail:SEND_REPLY`), language(`mails/mail:SEND_REPLY_INFO`, { prefix }), true)
      .addField(language(`mails/mail:CLOSE`), language(`mails/mail:CLOSE_INFO`, { prefix }), true)
      .setFooter(language(`mails/mail:USERID`, { id: mailUser.id }))
      .setTimestamp()
    if (message.attachments.length) embed.setImage(message.attachments[0].url)

    const alertRoleIDs = guildSettings?.mails.alertRoleIDs || []
    const modifiedRoleIDs: string[] = []
    for (const roleID of alertRoleIDs) {
      const role = message.member.guild.roles.get(roleID)
      // If role is already mentionable or cant find role skip
      if (!role || role.mentionable) continue
      // Make the role mentionable. Need to await so it can be mentionable when sending the message
      await role.edit({ mentionable: true })
      modifiedRoleIDs.push(roleID)
    }

    await channel.createMessage({
      content: alertRoleIDs.map(roleID => `<@&${roleID}>`).join(' '),
      embed: embed.code
    })

    // Disable the mentionable roles again after message is sent
    for (const roleID of modifiedRoleIDs) {
      const role = message.member.guild.roles.get(roleID)
      if (!role) continue
      role.edit({ mentionable: false })
    }

    if (!user) message.delete().catch(() => undefined)

    const response = await message.channel.createMessage(language(`mails/mail:CREATED`))
    return setTimeout(() => response.delete().catch(() => undefined), 10000)
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

    const embed = new GamerEmbed()
      .setAuthor(
        language(`mails/mail:FROM`, { user: `${message.author.username}#${message.author.discriminator}` }),
        message.author.avatarURL
      )
      .setDescription(content)
      .setFooter(language(`mails/mail:USERID`, { user: message.author.id }))
      .addField(language(`mails/mail:SEND_REPLY`), language(`mails/mail:SEND_REPLY_INFO`, { prefix }), true)
      .addField(language(`mails/mail:CLOSE`), language(`mails/mail:CLOSE_INFO`, { prefix }), true)
      .setTimestamp()

    if (message.attachments.length) embed.setImage(message.attachments[0].url)

    const channel = guild.channels.get(mail.id)
    if (!channel) return
    const botPerms = channel.permissionsOf(this.Gamer.user.id)
    if (!botPerms.has('readMessages') || !botPerms.has('sendMessages') || !botPerms.has('embedLinks')) return

    const botMember = guild.members.get(this.Gamer.user.id)
    if (!botMember?.permission.has('manageRoles')) return

    const alertRoleIDs = guildSettings?.mails.alertRoleIDs || []
    const modifiedRoleIDs: string[] = []
    for (const roleID of alertRoleIDs) {
      const role = guild.roles.get(roleID)
      // If role is already mentionable or cant find role skip
      if (!role || role.mentionable) continue
      // Make the role mentionable. Need to await so it can be mentionable when sending the message
      await role.edit({ mentionable: true })
      modifiedRoleIDs.push(roleID)
    }

    // Await so the message sends before we make roles unmentionable again
    await this.Gamer.createMessage(mail.id, {
      content: alertRoleIDs.map(roleID => `<@&${roleID}>`).join(' '),
      embed: embed.code
    })

    // Disable the mentionable roles again after message is sent
    for (const roleID of modifiedRoleIDs) {
      const role = guild.roles.get(roleID)
      if (!role) continue
      role.edit({ mentionable: false })
    }
  }

  async replyToMail(message: Message, content: string, mail: GamerMail) {
    if (!message.guildID || !message.member) return

    const tag = await this.Gamer.database.models.tag.findOne({
      guildID: message.guildID,
      mailOnly: true,
      name: content.toLowerCase()
    })

    const user = this.Gamer.users.get(mail.userID)
    if (!user) return

    const language = this.Gamer.getLanguage(message.guildID)

    // If the moderator is trying to send a tag
    if (tag) {
      // Fetch all emojis to transform variables
      const emojis = await this.Gamer.database.models.emoji.find()
      // Transform the tag string
      const transformed = this.Gamer.helpers.transform.variables(
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
      } catch (error) {
        // Something went wrong somewhere so show it failed
        return message.channel.createMessage(language(`mails/mail:DM_FAILED`, { name: tag.name }))
      }

      // Some error happened so cancel out
      if (!success) return
    }

    const embed = new GamerEmbed()
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
        language(`mails/mail:SEND_REPLY_INFO`, { prefix: this.Gamer.prefix })
      )
      .setTimestamp()
    if (message.attachments.length) embed.setImage(message.attachments[0].url)

    try {
      const dmChannel = await user.getDMChannel()
      await dmChannel.createMessage({ embed: embed.code })
    } catch (error) {
      return message.channel.createMessage(language(`mails/mail:DM_FAILED`))
    }

    // Reset the embeds fields
    embed.code.fields = []

    message.delete().catch(() => undefined)

    return message.channel.createMessage({ embed: embed.code })
  }

  async close(message: Message, content: string, guildSettings: GuildSettings | null, mail: GamerMail) {
    // If an empty string is passed cancel the command
    if (!message.guildID || !message.member || !content) return

    const language = this.Gamer.getLanguage(message.guildID)

    const botMember = message.member.guild.members.get(this.Gamer.user.id)
    if (!botMember || !botMember.permission.has('manageChannels'))
      return message.channel.createMessage(language(`mails/mail:MISSING_PERMISSIONS`))

    const prefix = guildSettings?.prefix || this.Gamer.prefix

    const tag = await this.Gamer.database.models.tag.findOne({
      guildID: message.guildID,
      mailOnly: true,
      name: content.toLowerCase()
    })

    const user = this.Gamer.users.get(mail.userID)
    if (!user) return

    // Delete the mail from the database
    await this.Gamer.database.models.mail.deleteOne({ guildID: message.guildID, userID: mail.userID })

    const dmEmbed = new GamerEmbed()
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
        const transformed = this.Gamer.helpers.transform.variables(
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

    if (!guildSettings?.moderation.logs.modlogsChannelID) return

    const modlogChannel = message.member.guild.channels.get(guildSettings.moderation.logs.modlogsChannelID)
    if (!modlogChannel || !(modlogChannel instanceof TextChannel)) return

    const botPerms = modlogChannel.permissionsOf(this.Gamer.user.id)
    if (!botPerms.has('readMessages') || !botPerms.has('sendMessages') || !botPerms.has('embedLinks')) return

    const logEmbed = new GamerEmbed()
      .setDescription(content)
      .setTitle(
        language(`mails/mail:LOG_CLOSE`, {
          user: message.author.username,
          channel: (message.channel as TextChannel).name
        })
      )
      .setThumbnail(message.author.avatarURL)
      .setFooter(message.author.username)
      .setTimestamp()
    return modlogChannel.createMessage({ embed: logEmbed.code })
  }
}
