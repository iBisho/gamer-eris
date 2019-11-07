import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings, GuildSettingsDefault } from '../lib/types/settings'
import Constants from '../constants/index'
import GuildDefaults from '../constants/settings/guild'

export default new Command(
  [`server`, `si`, `sinfo`, `serverinfo`, `gi`, `ginfo`, `guildinfo`],
  async (message, _args, context) => {
    const Gamer = context.client as GamerClient
    if (message.channel instanceof PrivateChannel) return

    const guild = message.channel.guild
    const settings =
      ((await Gamer.database.models.guild.findOne({ id: guild.id })) as GuildSettings | null) ||
      (GuildDefaults as GuildSettingsDefault)

    const language = Gamer.i18n.get(settings ? settings.language : 'en-US')
    if (!language || !settings) return null

    const owner = Gamer.users.get(guild.ownerID)
    const relevantPersonality = Constants.personalities.find(
      personality => personality.id === (settings ? settings.language : 'en-US')
    )
    const languageName = relevantPersonality ? relevantPersonality.name : `Unknown`
    const verifyCategory = settings.verify.categoryID ? guild.channels.get(settings.verify.categoryID) : undefined
    const mailCategory = settings.mails.categoryID ? guild.channels.get(settings.mails.categoryID) : undefined

    const NONE = language(`common:NONE`)
    const ENABLED = language(`common:ENABLED`)
    const DISABLED = language(`common:DISABLED`)
    const STATSVALUE = language(`basic/server:STATSVALUE`, {
      createdAt: new Date(guild.createdAt).toISOString().substr(0, 10),
      owner: owner ? owner.username : language(`common:NOT_AVAILABLE`),
      channelCount: guild.channels.size,
      memberCount: guild.memberCount,
      roleCount: guild.roles.size
    })

    const serverSettings = {
      language: languageName,
      modRoles: settings.staff.modRoleIDs.length
        ? settings.staff.modRoleIDs.map((roleID: string) => `<@&${roleID}>`).join(` `)
        : NONE,
      admins: settings.staff.adminRoleID ? `<@${settings.staff.adminRoleID}>` : NONE,
      ideaEnabled: settings.feedback.idea.channelID ? ENABLED : DISABLED,
      bugsEnabled: settings.feedback.bugs.channelID ? ENABLED : DISABLED,
      autorole: settings.moderation.roleIDs.autorole ? `<@&${settings.moderation.roleIDs.autorole}>` : NONE,
      publicRoles: settings.moderation.roleIDs.public.length
        ? settings.moderation.roleIDs.public.map((roleID: string) => `<@&${roleID}>`).join(` `)
        : NONE,
      verifyRole: settings.verify.roleID ? `<@&${settings.verify.roleID}>` : NONE,
      verifyCategory: verifyCategory ? verifyCategory.name : NONE,
      verificationChannels: settings.verify.channelIDs.length,
      mailCategory: mailCategory ? mailCategory.name : NONE
    }

    const SETTINGSVALUE = language(`basic/server:SETTINGSVALUE`, {
      language: serverSettings.language,
      modRoles: serverSettings.modRoles,
      admins: serverSettings.admins,
      ideaEnabled: serverSettings.ideaEnabled,
      bugEnabled: serverSettings.bugsEnabled
    })

    const MODERATIONVALUE = language(`basic/server:MODERATIONVALUE`, {
      autoAssignRole: serverSettings.autorole,
      publicRoles: serverSettings.publicRoles,
      verifyRole: serverSettings.verifyRole,
      mailCategory: serverSettings.mailCategory,
      verifyCategory: serverSettings.verifyCategory,
      verificationChannels: serverSettings.verificationChannels
    })

    const embed = new GamerEmbed()
      .setAuthor(language(`basic/server:TITLE`))
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL || ``)
      .setFooter(guild.id)
      .addField(language(`basic/server:STATSNAME`), STATSVALUE)
      .addField(language(`basic/server:SETTINGSNAME`), SETTINGSVALUE)
      .addField(language(`basic/server:MODERATIONNAME`), MODERATIONVALUE)

    return message.channel.createMessage({ embed: embed.code })
  }
)
