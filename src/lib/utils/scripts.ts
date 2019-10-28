import { Guild, CategoryChannel, Permission } from 'eris'
import { GuildSettings } from '../types/settings'
import GamerClient from '../structures/GamerClient'
import i18next = require('i18next')
import GamerEmbed from '../structures/GamerEmbed'

export default class {
  async createVerificationSystem(
    Gamer: GamerClient,
    language: i18next.TFunction,
    guild: Guild,
    guildSettings: GuildSettings
  ) {
    const REASON = language(`settings/setverify:REASON`)
    const category = await guild.createChannel(language(`basic/verify:CATEGORY_NAME`), 4, REASON)
    const roleIDs = guildSettings.staff.modRoleIDs
    if (guildSettings.staff.adminRoleID) roleIDs.push(guildSettings.staff.adminRoleID)
    // Grant all mod roles and gamer bot permissions to see all verify channels
    for (const id of roleIDs) category.editPermission(id, 3072, 0, 'role')
    category.editPermission(Gamer.user.id, 3072, 0, 'user')
    // Remove permission from the everyone role to see verify channels
    category.editPermission(guild.id, 0, 1024, 'role')

    // Create the verify role
    const role = await guild.createRole({ name: language(`basic/verify:VERIFY_ROLENAME`) })
    // Create the channel inside the category so it has the proper permissions
    const verifyChannel = await guild.createChannel(language(`basic/verify:CHANNEL_NAME`), 0, REASON, category.id)
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
          if (parentPerm && (parentPerm.allow === perm.allow && parentPerm.deny === perm.deny)) continue

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
}
