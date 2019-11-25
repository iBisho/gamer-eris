import { Guild, CategoryChannel, Permission, Overwrite } from 'eris'
import { GuildSettings } from '../types/settings'
import GamerClient from '../structures/GamerClient'
import i18next = require('i18next')
import GamerEmbed from '../structures/GamerEmbed'
import constants from '../../constants'

export default class {
  async createVerificationSystem(
    Gamer: GamerClient,
    language: i18next.TFunction,
    guild: Guild,
    guildSettings: GuildSettings
  ) {
    const REASON = language(`settings/setverify:REASON`)
    const overwrites: Overwrite[] = [
      { id: Gamer.user.id, allow: 3072, deny: 0, type: 'member' },
      { id: guild.id, allow: 0, deny: 1024, type: 'role' }
    ]
    if (guildSettings.staff.adminRoleID)
      overwrites.push({ id: guildSettings.staff.adminRoleID, allow: 3072, deny: 0, type: 'role' })
    for (const id of guildSettings.staff.modRoleIDs) overwrites.push({ id, allow: 3072, deny: 0, type: 'role' })

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
        `• **${guildSettings.prefix}verify end**`
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
    for (const channel of guild.channels.values()) {
      if (channel.parentID === category.id || channel.id === category.id) continue

      if (!channel.permissionsOf(Gamer.user.id).has(`manageChannels`)) continue

      if (channel.parentID) {
        const parent = guild.channels.get(channel.parentID) as CategoryChannel

        let isSynced = true
        for (const key of channel.permissionOverwrites.keys()) {
          const perm = channel.permissionOverwrites.get(key) as Permission
          const parentPerm = parent.permissionOverwrites.get(key)
          // If the parent has this user/role permission and they are the exact same perms then check next permission
          if (parentPerm && parentPerm.allow === perm.allow && parentPerm.deny === perm.deny) continue

          isSynced = false
          break
        }
        if (isSynced) continue
      }
      // Update the channel perms
      await channel.editPermission(role.id, 0, 1024, `role`)
    }

    const embed = new GamerEmbed()
      .setDescription([language('settings/setverify:THRILLED'), ``, `• **${guildSettings.prefix}verify**`].join('\n'))
      .setAuthor(language('settings/setverify:WELCOME'), `https://i.imgur.com/0LxU5Yy.jpg`)
      .setTitle(language('settings/setverify:PROCESS'))
      .setFooter(language('settings/setverify:HELP'))

    await verifyChannel.createMessage({ embed: embed.code })

    return true
  }

  async createFeedbackSystem(
    Gamer: GamerClient,
    language: i18next.TFunction,
    guild: Guild,
    guildSettings: GuildSettings
  ) {
    const REASON = language(`settings/setfeedback:SETUP_REASON`)
    // Create the category first and edit its permissions so that the other two channels can be syned easily
    const category = await guild.createChannel(language(`settings/setfeedback:CATEGORY_NAME`), 4, {
      reason: REASON,
      permissionOverwrites: [
        { id: guild.id, allow: 0, deny: 2112, type: `role` },
        { id: Gamer.user.id, allow: 347200, deny: 0, type: `member` }
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

    const gamertag = `${Gamer.user.username}#${Gamer.user.discriminator}`

    const embed = new GamerEmbed()
      .setAuthor(language(`settings/setfeedback:IDEA_FROM`, { user: gamertag }), Gamer.user.avatarURL)
      .setThumbnail(Gamer.user.avatarURL)
      .addField(language(`settings/setfeedback:IDEA_QUESTION_1`), language(`settings/setfeedback:IDEA_ANSWER_1`))
      .addField(language(`settings/setfeedback:IDEA_QUESTION_2`), language(`settings/setfeedback:IDEA_ANSWER_2`))
      .setImage('https://i.imgur.com/2L9ePkb.png')
      .setTimestamp()

    const bugsEmbed = new GamerEmbed()
      .setAuthor(language(`settings/setfeedback:BUGS_FROM`, { user: gamertag }), Gamer.user.avatarURL)
      .setColor(`#F44A41`)
      .setThumbnail(Gamer.user.avatarURL)
      .addField(language(`settings/setfeedback:BUGS_QUESTION_1`), language(`settings/setfeedback:BUGS_ANSWER_1`))
      .addField(language(`settings/setfeedback:BUGS_QUESTION_2`), language(`settings/setfeedback:BUGS_ANSWER_2`))
      .setImage(`https://i.imgur.com/lQr66JV.png`)
      .setTimestamp()
    // Send example idea
    ideaChannel.createMessage({ embed: embed.code })
    // Send example bug
    bugsChannel.createMessage({ embed: bugsEmbed.code })
  }
}
