import { Guild, CategoryChannel, Overwrite, TextChannel, NewsChannel, Message } from 'eris'
import { GuildSettings } from '../types/settings'
import GamerClient from '../structures/GamerClient'
import { MessageEmbed, userTag } from 'helperis'
import constants from '../../constants'

const reactionRoleData = [
  { name: 'red', hex: '#ff0000', emoji: constants.emojis.colors.red },
  { name: 'purplered', hex: '#33032b', emoji: constants.emojis.colors.purplered },
  { name: 'purple', hex: '#4b0082', emoji: constants.emojis.colors.purple },
  { name: 'pinkpurple', hex: '#c000ff', emoji: constants.emojis.colors.pinkpurple },
  { name: 'pink', hex: '#ff5f9a', emoji: constants.emojis.colors.pink },
  { name: 'pastelyellow', hex: '#fffad1', emoji: constants.emojis.colors.pastelyellow },
  { name: 'pastelred', hex: '#ff876c', emoji: constants.emojis.colors.pastelred },
  { name: 'pastelpurple', hex: '#dac2dc', emoji: constants.emojis.colors.pastelpurple },
  { name: 'pastelpink', hex: '#fbccd3', emoji: constants.emojis.colors.pastelpink },
  { name: 'pastelorange', hex: '#f7af4b', emoji: constants.emojis.colors.pastelorange },
  { name: 'pastelgreen', hex: '#bdecb6', emoji: constants.emojis.colors.pastelgreen },
  { name: 'pastelblue', hex: '#c8dcf4', emoji: constants.emojis.colors.pastelblue },
  { name: 'orange', hex: '#fe6019', emoji: constants.emojis.colors.orange },
  { name: 'limegreen', hex: '#65ff00', emoji: constants.emojis.colors.limegreen },
  { name: 'lightorange', hex: '#ff9a00', emoji: constants.emojis.colors.lightorange },
  { name: 'lightblue', hex: '#4fadab', emoji: constants.emojis.colors.lightblue },
  { name: 'brown', hex: '#4f3205', emoji: constants.emojis.colors.brown },
  { name: 'brightyellow', hex: '#ffff00', emoji: constants.emojis.colors.brightyellow },
  { name: 'brightpink', hex: '#ff0078', emoji: constants.emojis.colors.brightpink },
  { name: 'blue', hex: '#223480', emoji: constants.emojis.colors.blue }
]

export default class {
  Gamer: GamerClient

  constructor(client: GamerClient) {
    this.Gamer = client
  }

  async createVerificationSystem(guild: Guild, guildSettings: GuildSettings) {
    const language = this.Gamer.getLanguage(guild.id)

    const REASON = language(`settings/setverify:REASON`)
    const overwrites: Overwrite[] = [
      { id: this.Gamer.user.id, allow: 3072, deny: 0, type: 'member' },
      { id: guild.id, allow: 0, deny: 1024, type: 'role' }
    ]
    if (guildSettings.staff.adminRoleID)
      overwrites.push({ id: guildSettings.staff.adminRoleID, allow: 3072, deny: 0, type: 'role' })
    guildSettings.staff.modRoleIDs.forEach(id => overwrites.push({ id, allow: 3072, deny: 0, type: 'role' }))

    const category = await guild.createChannel(language(`basic/verify:CATEGORY_NAME`), 4, {
      reason: REASON,
      permissionOverwrites: overwrites
    })

    // Create the verify role
    const role = await guild.createRole({ name: language(`basic/verify:VERIFY_ROLENAME`) })
    // Create the channel inside the category so it has the proper permissions
    const verifyChannel = await guild.createChannel(language(`basic/verify:CHANNEL_NAME`), 0, {
      reason: REASON,
      parentID: category.id
    })

    verifyChannel.editPermission(role.id, 3072, 0, `role`)

    guildSettings.verify.categoryID = category.id
    guildSettings.verify.enabled = true
    guildSettings.verify.roleID = role.id
    guildSettings.verify.firstMessageJSON = JSON.stringify({
      description: [
        language('settings/setverify:THANKS'),
        ``,
        language('settings/setverify:UNLOCK'),
        `**${guildSettings.prefix}verify end**`
      ].join('\n'),
      author: {
        name: language('settings/setverify:AMAZING'),
        // eslint-disable-next-line @typescript-eslint/camelcase
        icon_url: 'https://i.imgur.com/0LxU5Yy.jpg'
      },
      image: 'https://i.imgur.com/oN4YjaY.gif'
    })

    guildSettings.save()
    // Edit all necessary channels with the verify role to prevent users from seeing any channels except the verify channel
    guild.channels.forEach(channel => {
      if (channel.parentID === category.id || channel.id === category.id) return

      const channelPerms = channel.permissionsOf(this.Gamer.user.id)
      if (!channelPerms.has(`manageChannels`) || !channelPerms.has(`manageRoles`) || !channelPerms.has('readMessages'))
        return

      if (channel.parentID) {
        const parent = guild.channels.get(channel.parentID) as CategoryChannel

        let isSynced = true
        channel.permissionOverwrites.forEach((permission, key) => {
          const parentPerm = parent.permissionOverwrites.get(key)
          // If the parent has this user/role permission and they are the exact same perms then check next permission
          if (parentPerm && parentPerm.allow === permission.allow && parentPerm.deny === permission.deny) return

          isSynced = false
        })

        if (isSynced) return
      }
      // Update the channel perms
      channel.editPermission(role.id, 0, 1024, `role`)
    })

    const embed = new MessageEmbed()
      .setDescription([language('settings/setverify:THRILLED'), ``, `**${guildSettings.prefix}verify**`].join('\n'))
      .setAuthor(language('settings/setverify:WELCOME'), `https://i.imgur.com/0LxU5Yy.jpg`)
      .setTitle(language('settings/setverify:PROCESS'))
      .setFooter(language('settings/setverify:HELP'))

    await verifyChannel.createMessage({ embed: embed.code })

    return true
  }

  async createFeedbackSystem(guild: Guild, guildSettings: GuildSettings) {
    const language = this.Gamer.getLanguage(guild.id)

    const REASON = language(`settings/setfeedback:SETUP_REASON`)
    // Create the category first and edit its permissions so that the other two channels can be syned easily
    const category = await guild.createChannel(language(`settings/setfeedback:CATEGORY_NAME`), 4, {
      reason: REASON,
      permissionOverwrites: [
        { id: guild.id, allow: 0, deny: 2112, type: `role` },
        { id: this.Gamer.user.id, allow: 347200, deny: 0, type: `member` }
      ]
    })

    const ideaChannel = await guild.createChannel(language(`settings/setfeedback:IDEA_CHANNEL_NAME`), 0, {
      reason: REASON,
      parentID: category.id
    })
    const bugsChannel = await guild.createChannel(language(`settings/setfeedback:BUGS_CHANNEL_NAME`), 0, {
      reason: REASON,
      parentID: category.id
    })

    // Update all the feedback settings
    guildSettings.feedback.idea.channelID = ideaChannel.id
    guildSettings.feedback.bugs.channelID = bugsChannel.id
    guildSettings.feedback.idea.emojis.up = constants.emojis.gamerHug
    guildSettings.feedback.bugs.emojis.up = constants.emojis.gamerHeart
    guildSettings.feedback.idea.emojis.down = constants.emojis.gamerCry
    guildSettings.feedback.bugs.emojis.down = constants.emojis.gamerSick
    guildSettings.feedback.idea.questions = [
      language(`settings/setfeedback:IDEA_QUESTION_1`),
      language(`settings/setfeedback:IDEA_QUESTION_2`),
      language(`settings/setfeedback:IDEA_QUESTION_3`)
    ]
    guildSettings.feedback.bugs.questions = [
      language(`settings/setfeedback:BUGS_QUESTION_1`),
      language(`settings/setfeedback:BUGS_QUESTION_2`),
      language(`settings/setfeedback:BUGS_QUESTION_3`)
    ]
    guildSettings.save()

    const gamertag = `${this.Gamer.user.username}#${this.Gamer.user.discriminator}`

    const embed = new MessageEmbed()
      .setAuthor(language(`settings/setfeedback:IDEA_FROM`, { user: gamertag }), this.Gamer.user.avatarURL)
      .setThumbnail(this.Gamer.user.avatarURL)
      .addField(language(`settings/setfeedback:IDEA_QUESTION_1`), language(`settings/setfeedback:IDEA_ANSWER_1`))
      .addField(language(`settings/setfeedback:IDEA_QUESTION_2`), language(`settings/setfeedback:IDEA_ANSWER_2`))
      .setImage('https://i.imgur.com/2L9ePkb.png')
      .setTimestamp()

    const bugsEmbed = new MessageEmbed()
      .setAuthor(language(`settings/setfeedback:BUGS_FROM`, { user: gamertag }), this.Gamer.user.avatarURL)
      .setColor(`#F44A41`)
      .setThumbnail(this.Gamer.user.avatarURL)
      .addField(language(`settings/setfeedback:BUGS_QUESTION_1`), language(`settings/setfeedback:BUGS_ANSWER_1`))
      .addField(language(`settings/setfeedback:BUGS_QUESTION_2`), language(`settings/setfeedback:BUGS_ANSWER_2`))
      .setImage(`https://i.imgur.com/lQr66JV.png`)
      .setTimestamp()
    // Send example idea
    ideaChannel.createMessage({ embed: embed.code })
    // Send example bug
    bugsChannel.createMessage({ embed: bugsEmbed.code })
  }

  async createLogSystem(guild: Guild, guildSettings: GuildSettings) {
    const language = this.Gamer.getLanguage(guild.id)

    const REASON = language(`settings/setlogs:REASON`)
    const overwrites: Overwrite[] = [
      { id: this.Gamer.user.id, allow: 3072, deny: 0, type: 'member' },
      { id: guild.id, allow: 0, deny: 1024, type: 'role' }
    ]

    if (guildSettings.staff.adminRoleID)
      overwrites.push({ id: guildSettings.staff.adminRoleID, allow: 3072, deny: 0, type: 'role' })
    guildSettings.staff.modRoleIDs.forEach(id => overwrites.push({ id, allow: 3072, deny: 0, type: 'role' }))

    const category = await guild.createChannel(language(`settings/setlogs:CATEGORY_NAME`), 4, {
      reason: REASON,
      permissionOverwrites: overwrites
    })

    const [roleLogsChannel, memberLogs, messageLogs, otherLogs, channelLogs, publicLogs] = await Promise.all([
      guild.createChannel(language(`settings/setlogs:ROLE_CHANNEL_NAME`), 0, { parentID: category.id }),
      guild.createChannel(language(`settings/setlogs:MEMBER_CHANNEL_NAME`), 0, { parentID: category.id }),
      guild.createChannel(language(`settings/setlogs:MESSAGE_CHANNEL_NAME`), 0, { parentID: category.id }),
      guild.createChannel(language(`settings/setlogs:OTHER_CHANNEL_NAME`), 0, { parentID: category.id }),
      guild.createChannel(language(`settings/setlogs:CHANNEL_CHANNEL_NAME`), 0, { parentID: category.id }),
      guild.createChannel(language(`settings/setlogs:PUBLIC_CHANNEL_NAME`), 0, { parentID: category.id })
    ])

    guildSettings.moderation.logs.publiclogsChannelID = publicLogs.id
    guildSettings.moderation.logs.serverlogs.channels.channelID = channelLogs.id
    guildSettings.moderation.logs.serverlogs.channels.createPublicEnabled = true
    guildSettings.moderation.logs.serverlogs.channels.deletePublicEnabled = true
    guildSettings.moderation.logs.serverlogs.channels.updatePublicEnabled = true
    guildSettings.moderation.logs.serverlogs.emojis.channelID = otherLogs.id
    guildSettings.moderation.logs.serverlogs.emojis.createPublicEnabled = true
    guildSettings.moderation.logs.serverlogs.emojis.deletePublicEnabled = true
    guildSettings.moderation.logs.serverlogs.emojis.updatePublicEnabled = true
    guildSettings.moderation.logs.serverlogs.members.channelID = memberLogs.id
    guildSettings.moderation.logs.serverlogs.members.addPublicEnabled = true
    guildSettings.moderation.logs.serverlogs.members.nicknamePublicEnabled = true
    guildSettings.moderation.logs.serverlogs.messages.channelID = messageLogs.id
    guildSettings.moderation.logs.serverlogs.messages.deletedPublicEnabled = true
    guildSettings.moderation.logs.serverlogs.roles.channelID = roleLogsChannel.id
    guildSettings.moderation.logs.serverlogs.roles.createPublicEnabled = true
    guildSettings.moderation.logs.serverlogs.roles.deletePublicEnabled = true
    guildSettings.moderation.logs.serverlogs.roles.updatePublicEnabled = true
    guildSettings.moderation.logs.serverlogs.roles.memberPublicEnabled = true

    if (!guildSettings.moderation.logs.modlogsChannelID) {
      const modlogChannel = await guild.createChannel(language(`settings/setlogs:MODLOG_CHANNEL_NAME`), 0, {
        parentID: category.id
      })

      guildSettings.moderation.logs.modlogsChannelID = modlogChannel.id
    }

    guild.channels.forEach(channel => {
      if (!(channel instanceof TextChannel) && !(channel instanceof NewsChannel)) return

      channel.messages.limit = 100
    })

    guildSettings.save()
  }

  // Create the mute system
  async createMuteSystem(guild: Guild, guildSettings: GuildSettings) {
    const language = this.Gamer.getLanguage(guild.id)

    // If the role is already set cancel creation
    if (guildSettings.moderation.roleIDs.mute && guild.roles.has(guildSettings.moderation.roleIDs.mute)) return

    // Create a new role
    const muteRole = await guild.createRole(
      {
        name: language(`moderation/mute:ROLE_NAME`)
      },
      language(`moderation/mute:SETUP_CREATED`)
    )
    guildSettings.moderation.roleIDs.mute = muteRole.id
    guildSettings.save()

    guild.channels.forEach(channel => {
      // Skip if the verify category
      if (
        (channel.parentID && channel.parentID === guildSettings.verify.categoryID) ||
        channel.id === guildSettings.verify.categoryID
      )
        return

      const botPerms = channel.permissionsOf(this.Gamer.user.id)
      // If no permissions in this channel to manage it skip
      if (!botPerms.has(`manageChannels`) || !botPerms.has(`manageRoles`) || !botPerms.has('readMessages')) return

      // If the permissions are synced with the category channel skip
      if (channel.parentID) {
        const category = guild.channels.get(channel.parentID)
        if (!category) return

        if (category.permissionOverwrites === channel.permissionOverwrites) return
      }

      // Update the channel perms
      channel.editPermission(muteRole.id, 0, 1024, `role`, language(`moderation/mute:MUTE_ROLE_REASON`))
    })

    return muteRole
  }

  async createReactionRoleColors(message: Message) {
    const member = message.member
    const language = this.Gamer.getLanguage(member?.guild.id)
    if (!member || member.guild.roles.size + 20 > 250)
      return message.channel.createMessage(language(`roles/reactionrolecreate:MAX_ROLES`))

    const hasPermission = this.Gamer.helpers.discord.checkPermissions(message.channel, this.Gamer.user.id, [
      `readMessages`,
      `sendMessages`,
      `embedLinks`,
      `externalEmojis`,
      `readMessageHistory`,
      `addReactions`
    ])
    if (!hasPermission) return message.channel.createMessage(language(`roles/reactionrolecreate:MISSING_PERMISSION`))

    const reactionRole = await this.Gamer.database.models.reactionRole.findOne({
      name: 'colors',
      guildID: member?.guild.id
    })

    if (reactionRole)
      return message.channel.createMessage(language(`roles/reactionrolecreate:NAME_EXISTS`, { name: 'colors' }))

    const exists = await this.Gamer.database.models.roleset.findOne({
      name: 'colors',
      guildID: member?.guild.id
    })
    if (exists) return message.channel.createMessage(language(`roles/rolesetcreate:EXISTS`, { name: 'colors' }))

    // Create all 20 roles

    const roles = await Promise.all(
      reactionRoleData.map(data =>
        member.guild.createRole(
          { name: data.name, color: parseInt(data.hex.replace('#', ''), 16) },
          language('roles/reactionrolecreate:SETUP_REASON', { username: encodeURIComponent(userTag(message.author)) })
        )
      )
    )

    // Send a message
    const embed = new MessageEmbed()
      .setAuthor(language('roles/reactionrolecreate:COLOR_WHEEL'), 'https://i.imgur.com/wIrhA5A.jpg')
      .setDescription(language('roles/reactionrolecreate:PICK_COLOR'))
      .addField(language('roles/reactionrolecreate:DONT_FORGET'), language('roles/reactionrolecreate:ONLY_ONE'))
      .setFooter(language('roles/reactionrolecreate:CUSTOMIZE_PICKER'), member.guild.iconURL)
    const baseMessage = await message.channel.createMessage({ embed: embed.code })

    // Create reaction role
    this.Gamer.database.models.reactionRole.create({
      name: 'colors',
      reactions: roles.map((role, index) => ({
        reaction: this.Gamer.helpers.discord.convertEmoji(reactionRoleData[index].emoji, `reaction`),
        roleIDs: [role.id]
      })),
      messageID: baseMessage.id,
      channelID: baseMessage.channel.id,
      guildID: member?.guild.id,
      authorID: message.author.id
    })

    // Create a roleset
    await this.Gamer.database.models.roleset.create({
      name: 'colors',
      roleIDs: roles.map(role => role.id),
      guildID: member?.guild.id
    })

    // Create all 20 reactions
    return reactionRoleData.forEach(data => {
      const reaction = this.Gamer.helpers.discord.convertEmoji(data.emoji, `reaction`)
      if (reaction) baseMessage.addReaction(reaction)
    })
  }
}
