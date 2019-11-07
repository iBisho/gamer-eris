import { Member, Role } from 'eris'
import { MemberSettings, UserSettings, GuildSettings } from '../types/settings'
import GamerClient from '../structures/GamerClient'
import constants from '../../constants'
import { GamerLevel, GamerMission } from '../types/gamer'

export default class {
  // Holds the guildID.memberID for those that are in cooldown per server
  memberCooldowns = new Map<string, number>()
  // Holds the userID for those that are in cooldown in global xp system
  userCooldowns = new Map<string, number>()

  Gamer: GamerClient

  constructor(client: GamerClient) {
    this.Gamer = client
  }

  // The override cooldown is useful for XP command when you want to force add XP like daily command
  async addLocalXP(member: Member, xpAmountToAdd = 1, overrideCooldown = false, reason?: string) {
    // If the member is in cooldown cancel out
    if (!overrideCooldown && this.checkCooldown(member)) return

    const memberSettings = ((await this.Gamer.database.models.member.findOne({ memberID: member.id })) ||
      new this.Gamer.database.models.member({
        memberID: member.id,
        guildID: member.guild.id,
        id: `${member.guild.id}.${member.id}`
      })) as MemberSettings

    const userSettings = (await this.Gamer.database.models.user.findOne({ userID: member.id })) as UserSettings | null

    let multiplier = 1
    if (userSettings)
      for (const boost of userSettings.leveling.boosts) {
        if (!boost.active || !boost.activatedAt) continue
        if (boost.timestamp && boost.activatedAt + boost.timestamp < Date.now()) continue
        multiplier += boost.multiplier
      }

    const totalXP = xpAmountToAdd * multiplier + memberSettings.leveling.xp
    memberSettings.leveling.xp = totalXP
    memberSettings.leveling.lastUpdatedAt = Date.now()

    // Get the details on the users next level
    const nextLevelInfo = constants.levels.find(lvl => lvl.level === memberSettings.leveling.level + 1)
    // User did not level up
    if (nextLevelInfo && nextLevelInfo.xpNeeded > totalXP) {
      memberSettings.save()
      return
    }

    // User did level up

    const newLevel = constants.levels.find(level => level.xpNeeded > totalXP)
    // Past max xp for highest level so just no more levelups needed
    if (!newLevel) {
      memberSettings.save()
      return
    }

    // Add one level and set the XP to whatever is left
    memberSettings.leveling.level = newLevel.level
    memberSettings.save()

    // Now we need to check if the user went up a level

    // Fetch all custom guild levels data
    const allGuildLevels = (await this.Gamer.database.models.level.find({ guildID: member.guild.id })) as GamerLevel[]
    if (!allGuildLevels) return
    // Find if this level has any custom data
    const levelData = allGuildLevels.find(data => data.level === newLevel.level)
    // If it has roles to give then give them to the user
    if (!levelData || !levelData.roleIDs.length) return

    const bot = member.guild.members.get(this.Gamer.user.id)
    if (!bot) return
    // Check if the bots role is high enough to manage the role
    const botsRoles = bot.roles.sort(
      (a, b) => (bot.guild.roles.get(b) as Role).position - (bot.guild.roles.get(a) as Role).position
    )
    const [botsHighestRoleID] = botsRoles
    const botsHighestRole = bot.guild.roles.get(botsHighestRoleID)
    if (!botsHighestRole) return

    const rolesToAdd = []
    for (const roleID of levelData.roleIDs) {
      const role = member.guild.roles.get(roleID)
      // If the role is too high for the bot to manage skip
      if (!role || botsHighestRole.position <= role.position) continue
      if (reason) member.addRole(roleID, reason)
      else rolesToAdd.push(roleID)
    }
    if (!rolesToAdd.length) return

    const guildSettings = (await this.Gamer.database.models.guild.findOne({
      id: member.guild.id
    })) as GuildSettings | null
    const language = this.Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
    for (const roleID of rolesToAdd) member.addRole(roleID, language?.(`leveling/xp:ROLE_ADD_REASON`))
  }

  async addGlobalXP(member: Member, xpAmountToAdd = 1) {
    if (this.checkCooldown(member, true)) return

    const userSettings = ((await this.Gamer.database.models.user.findOne({ id: member.id })) ||
      new this.Gamer.database.models.user({ userID: member.id })) as UserSettings

    let multiplier = 1
    if (userSettings)
      for (const boost of userSettings.leveling.boosts) {
        if (!boost.active || !boost.activatedAt) continue
        if (boost.timestamp && boost.activatedAt + boost.timestamp < Date.now()) continue
        multiplier += boost.multiplier
      }

    const totalXP = xpAmountToAdd * multiplier + userSettings.leveling.xp
    userSettings.leveling.xp = totalXP

    // Get the details on the users next level
    const nextLevelInfo = constants.levels.find(lvl => lvl.level === userSettings.leveling.level + 1)
    // User did not level up
    if (nextLevelInfo && nextLevelInfo.xpNeeded > totalXP) {
      userSettings.save()
      return
    }

    // User did level up

    const newLevel = constants.levels.find(level => level.xpNeeded > totalXP)
    // Past max xp for highest level so just no more levelups needed
    if (!newLevel) {
      userSettings.save()
      return
    }

    // Add one level
    userSettings.leveling.level = newLevel.level
    userSettings.save()
  }

  async removeXP(member: Member, reason: string, xpAmountToRemove = 1) {
    if (xpAmountToRemove < 1) return

    const settings = (await this.Gamer.database.models.member.findOne({ id: member.id })) as MemberSettings | null
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
    const bot = member.guild.members.get(this.Gamer.user.id)
    if (!oldLevel || !bot || !bot.permission.has('manageRoles')) return

    // Fetch all custom guild levels data
    const allGuildLevels = (await this.Gamer.database.models.level.find({ guildID: member.guild.id })) as GamerLevel[]
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

      member.removeRole(roleID, reason)
    }
  }

  checkCooldown(member: Member, isGlobal = false) {
    const now = Date.now()
    if (isGlobal) {
      // If the user is on cooldown return true
      const userCooldown = this.userCooldowns.get(member.id)
      if (userCooldown && now - userCooldown < 60000) return true
      // If the member is not on cooldown we need to add them or is older than 1 minute
      this.userCooldowns.set(member.id, now)
      // Return false because user is not on cooldown
      return false
    }

    // This is for a SERVER XP system

    // Since the member id are not unique per guild we add guild id to make it unique
    const uniqueMemberID = `${member.guild.id}.${member.id}`
    // If the member is on cooldown return true
    const memberCooldown = this.memberCooldowns.get(uniqueMemberID)
    if (memberCooldown && now - memberCooldown < 60000) return true
    // If the member is not on cooldown we need to add them
    this.memberCooldowns.set(uniqueMemberID, now)
    return false
  }

  async completeMission(member: Member, commandName: string, guildID: string) {
    // Check if this is a daily mission from today
    const mission = this.Gamer.missions.find(m => m.commandName === commandName)
    if (!mission) return

    // Find the data for this user regarding this mission or make it for them
    const missionData = ((await this.Gamer.database.models.mission.findOne({
      userID: member.id,
      commandName: commandName
    })) ||
      new this.Gamer.database.models.mission({
        userID: member.id,
        commandName,
        guildID
      })) as GamerMission

    // If the user already got the rewards for this mission
    if (missionData.completed) return

    // The mission has not been completed so just increment by 1
    if (missionData.amount + 1 < mission.amount) {
      missionData.amount += 1
      missionData.save()
      return
    }

    missionData.completed = true
    missionData.save()
    // The mission should be completed now so need to give XP.
    this.addLocalXP(member, mission.reward, true)
    this.addGlobalXP(member, mission.reward)
  }
}
