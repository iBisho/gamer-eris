import { Member, Role } from 'eris'
import { MemberSettings } from '../types/settings'
import GamerClient from '../structures/GamerClient'
import constants from '../../constants'
import { GamerLevel } from '../types/gamer'
import * as i18next from 'i18next'

export default class {
  // Holds the guildID.memberID for those that are in cooldown per server
  memberCooldowns = new Set()
  // Holds the userID for those that are in cooldown in global xp system
  userCooldowns = new Set()

  // async addXP(guild: Guild, member: Member, xpAmountToAdd: number, isGlobal = false, overrideCooldown = false) {
  //   // The override cooldown is useful for XP command when you want to force add XP
  //   if (!overrideCooldown) {
  //     // If the member is in cooldown cancel out
  //     const isInCooldown = this.checkCooldown(member, isGlobal)
  //     if (isInCooldown) return null
  //   }

  //   // Sync settings first so we can pluck the latest values
  //   if (isGlobal) await member.user.settings.sync()
  //   else await member.settings.sync()

  //   // Get the relevant values
  //   const [currentXP, currentLevel] = (isGlobal
  //     ? member.user.settings.pluck(UserSettings.Leveling.XP, UserSettings.Leveling.Level)
  //     : member.settings.pluck(MemberSettings.Leveling.XP, MemberSettings.Leveling.Level)) as [number, number]

  //   const totalXP = currentXP + xpAmountToAdd

  //   // Update his relevant XP
  //   if (isGlobal) await member.user.settings.update(UserSettings.Leveling.XP, totalXP)
  //   else await member.settings.update(MemberSettings.Leveling.XP, totalXP)

  //   // Update Level for the member locally
  //   const nextLevelInfo = this.client.helpers.constants.levels.find(lvl => lvl.level === currentLevel + 1)
  //   if (nextLevelInfo && nextLevelInfo.xpNeeded > totalXP) return null
  //   const newLevel = this.client.helpers.constants.levels.find(level => level.xpNeeded > totalXP)
  //   // Past max xp for highest level so just no more levelups needed
  //   if (!newLevel) return null
  //   // Add one level and set the XP to whatever is left
  //   if (isGlobal) {
  //     const userCurrency = member.user.settings.get(UserSettings.Leveling.Currency) as number
  //     await member.user.settings.update([
  //       [UserSettings.Leveling.Level, newLevel.level],
  //       [UserSettings.Leveling.XP, totalXP],
  //       [UserSettings.Leveling.Currency, userCurrency + 25 + newLevel.level]
  //     ])
  //   } else {
  //     await member.settings.update([
  //       [MemberSettings.Leveling.Level, newLevel.level],
  //       [MemberSettings.Leveling.XP, totalXP]
  //     ])
  //   }

  //   return isGlobal ? null : this.handleGuildLevelUp(guild, member, newLevel)
  // }

  // async handleGuildLevelUp(guild: Guild, member: Member, newLevel: GamerLevel) {
  //   if (member.manageable) {
  //     // Fetch all custom guild levels data
  //     const allGuildLevels = (await this.client.providers.default
  //       .getAllIndex(`levels`, guild.id, `guildID`)
  //       .catch(() => [])) as Level[]

  //     if (allGuildLevels) {
  //       // Find if this level has any custom data
  //       const levelData = allGuildLevels.find(data => data.level === newLevel.level)

  //       // If it has roles to give then give them to the user
  //       if (levelData && levelData.roleIDs.length)
  //         await this.client.helpers.discord.addRoles(member, levelData.roleIDs, `Level up role rewarded.`)
  //     }
  //   }

  //   // Now see if there is a valid channel in the settings
  //   const [levelUpChannel] = (await guild.settings.resolve(GuildSettings.Leveling.LevelUpChannelID)) as [TextChannel]
  //   if (!levelUpChannel || !levelUpChannel.postEmbedable) return null

  //   // Create a embed to tell the user they leveled up
  //   const embed = new GamerEmbed()
  //     .setAuthor(member.displayName, member.user.displayAvatarURL())
  //     .setDescription(guild.language.get(`LEVEL_DEFAULT_LEVEL_MESSAGE`))
  //   // Send the embed to the level up channel
  //   return levelUpChannel.send(embed)
  // }

  async removeXP(Gamer: GamerClient, member: Member, xpAmountToRemove: number, language: i18next.TFunction) {
    if (xpAmountToRemove < 1) return

    const settings = (await Gamer.database.models.member.findOne({ id: member.id })) as MemberSettings | null
    if (!settings) return

    // If the XP is less than 0 after removing then set it to 0
    const difference = settings.leveling.xp - xpAmountToRemove
    settings.leveling.xp = difference > 0 ? difference : 0
    // Find the new level based on the remaining XP
    const newLevel = constants.levels.find(level => level.xpNeeded > settings.leveling.xp)
    if (!newLevel) {
      settings.save()
      return
    }
    // If the level has not dropped
    if (settings.leveling.level === newLevel.level) {
      settings.save()
      return
    }
    // The level changed so first update settings
    settings.leveling.level = newLevel.level
    settings.save()

    // Need to check if roles need to be updated now for level rewards
    const oldLevel = constants.levels.find(level => level.level === settings.leveling.level)
    const bot = member.guild.members.get(Gamer.user.id)
    if (!oldLevel || !bot || !bot.permission.has('manageRoles')) return

    // Fetch all custom guild levels data
    const allGuildLevels = (await Gamer.database.models.level.find({ guildID: member.guild.id })) as GamerLevel[] | null
    if (!allGuildLevels) return
    // Find if this level has any custom data
    const levelData = allGuildLevels.find(data => data.level === oldLevel.level)
    // If it has roles to give then give them to the user
    if (!levelData || !levelData.roleIDs.length) return

    // Check if the bots role is high enough to manage the role
    const botsRoles = bot.roles.sort(
      (a, b) => (bot.guild.roles.get(b) as Role).position - (bot.guild.roles.get(a) as Role).position
    )
    const [botsHighestRoleID] = botsRoles
    const botsHighestRole = bot.guild.roles.get(botsHighestRoleID)
    if (!botsHighestRole) return

    for (const roleID of levelData.roleIDs) {
      const role = member.guild.roles.get(roleID)
      // If the role is too high for the bot to manage skip
      if (!role || botsHighestRole.position <= role.position) continue

      member.removeRole(roleID, language(`leveling/xp:ROLE_REMOVE_REASON`))
    }
  }

  // checkCooldown(member: Member, isGlobal: boolean) {
  //   if (isGlobal) {
  //     // If the user is on cooldown return true
  //     if (this.userCooldowns.has(member.id)) return true
  //     // If the member is not on cooldown we need to add them
  //     this.userCooldowns.add(member.id)
  //     // After one minute remove them from the cooldowns
  //     setTimeout(() => this.userCooldowns.delete(member.id), 60000)
  //     // Return false because user is not on cooldown
  //     return false
  //   }

  //   // This is for a SERVER XP system

  //   // Since the member id are not unique per guild we add guild id to make it unique
  //   const uniqueMemberID = member.uniqueMemberID
  //   // If the member is on cooldown return true.
  //   if (this.memberCooldowns.has(uniqueMemberID)) return true
  //   // If the member is not on cooldown we need to add them
  //   this.memberCooldowns.add(uniqueMemberID)
  //   // After 1 minute we can remove this members cooldown
  //   setTimeout(() => this.memberCooldowns.delete(uniqueMemberID), 60000)
  // }
}
