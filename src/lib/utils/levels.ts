import { Member } from 'eris'
import GamerClient from '../structures/GamerClient'
import constants from '../../constants'
import { milliseconds } from '../types/enums/time'
import { highestRole } from 'helperis'

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
  async addLocalXP(member: Member, xpAmountToAdd = 1, overrideCooldown = false) {
    // If the member is in cooldown cancel out
    if (!overrideCooldown && this.checkCooldown(member)) return

    const memberSettings =
      (await this.Gamer.database.models.member.findOne({ memberID: member.id, guildID: member.guild.id })) ||
      (await this.Gamer.database.models.member.create({
        memberID: member.id,
        guildID: member.guild.id,
        id: `${member.guild.id}.${member.id}`
      }))

    const userSettings = await this.Gamer.database.models.user.findOne({ userID: member.id })

    let multiplier = 1
    if (userSettings) {
      for (const boost of userSettings.leveling.boosts) {
        if (!boost.active || !boost.activatedAt) continue
        if (boost.timestamp && boost.activatedAt + boost.timestamp < Date.now()) continue
        multiplier += boost.multiplier
      }
    }

    const memberLevel =
      constants.levels.find(lvl => lvl.xpNeeded > (memberSettings.leveling.xp || 0)) || constants.levels[0]

    const totalXP = xpAmountToAdd * multiplier + memberSettings.leveling.xp
    memberSettings.leveling.xp = totalXP
    memberSettings.leveling.lastUpdatedAt = Date.now()

    // User did not level up
    if (memberLevel.xpNeeded > totalXP) {
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
    // Fetch all custom guild levels data
    const levelData = await this.Gamer.database.models.level.findOne({
      guildID: member.guild.id,
      level: newLevel.level
    })
    // If it has roles to give then give them to the user
    if (!levelData || !levelData.roleIDs.length) return

    const bot = await this.Gamer.helpers.discord.fetchMember(member.guild, this.Gamer.user.id)
    if (!bot) return

    // Check if the bots role is high enough to manage the role
    const botsHighestRole = highestRole(bot)
    const language = this.Gamer.getLanguage(member.guild.id)
    const REASON = language('leveling/xp:ROLE_ADD_REASON')

    for (const roleID of levelData.roleIDs) {
      const role = member.guild.roles.get(roleID)
      // If the role is too high for the bot to manage skip
      if (!role || botsHighestRole.position <= role.position) continue
      member.addRole(roleID, REASON)
      this.Gamer.amplitude.push({
        authorID: member.id,
        guildID: member.guild.id,
        timestamp: Date.now(),
        memberID: member.id,
        type: 'ROLE_ADDED'
      })
    }
  }

  async addGlobalXP(member: Member, xpAmountToAdd = 1, overrideCooldown = false) {
    if (!overrideCooldown && this.checkCooldown(member, true)) return
    const userSettings =
      (await this.Gamer.database.models.user.findOne({ userID: member.id })) ||
      (await this.Gamer.database.models.user.create({ userID: member.id }))

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
    if (nextLevelInfo && nextLevelInfo.xpNeeded > totalXP) return userSettings.save()

    // User did level up

    const newLevel = constants.levels.find(level => level.xpNeeded > totalXP)
    // Past max xp for highest level so just no more levelups needed
    if (!newLevel) return userSettings.save()
    // Add one level
    userSettings.leveling.level = newLevel.level
    return userSettings.save()
  }

  async removeXP(member: Member, xpAmountToRemove = 1) {
    if (xpAmountToRemove < 1) return

    const settings = await this.Gamer.database.models.member.findOne({ memberID: member.id, guildID: member.guild.id })
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
    const bot = await this.Gamer.helpers.discord.fetchMember(member.guild, this.Gamer.user.id)
    if (!oldLevel || !bot?.permission.has('manageRoles')) return

    // Fetch all custom guild levels data
    const levelData = await this.Gamer.database.models.level.findOne({
      guildID: member.guild.id,
      level: oldLevel.level
    })

    // If it has roles to give then give them to the user
    if (!levelData || !levelData.roleIDs.length) return

    // Check if the bots role is high enough to manage the role
    const botsHighestRole = highestRole(bot)

    const language = this.Gamer.getLanguage(member.guild.id)

    const REASON = language('leveling/xp:ROLE_REMOVE_REASON')

    for (const roleID of levelData.roleIDs) {
      const role = member.guild.roles.get(roleID)
      // If the role is too high for the bot to manage skip
      if (!role || botsHighestRole.position <= role.position) continue

      member.removeRole(roleID, REASON)
      this.Gamer.amplitude.push({
        authorID: member.id,
        guildID: member.guild.id,
        timestamp: Date.now(),
        memberID: member.id,
        type: 'ROLE_REMOVED'
      })
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
    const upvoted = await this.Gamer.database.models.upvote.findOne({
      userID: member.id,
      timestamp: { $gt: Date.now() - milliseconds.HOUR * 12 }
    })
    // Check if this is a daily mission from today
    const mission = this.Gamer.missions.find((m, index) => {
      if (index > 2 && !upvoted) return
      return m.commandName === commandName
    })
    if (!mission) return

    // Find the data for this user regarding this mission or make it for them
    const missionData = await this.Gamer.database.models.mission.findOne({
      userID: member.id,
      commandName: commandName
    })

    // If there was no data create it
    if (!missionData) {
      await this.Gamer.database.models.mission.create({
        userID: member.id,
        commandName,
        guildID,
        amount: 1,
        completed: mission.amount === 1
      })

      if (mission.amount === 1) {
        // The mission should be completed now so need to give XP.
        this.addLocalXP(member, mission.reward, true)
        this.addGlobalXP(member, mission.reward, true)
      }

      // Return void to prevent collectors from breaking
      return
    }

    // If the user already got the rewards for this mission
    if (missionData.completed) return

    missionData.amount += 1
    if (missionData.amount === mission.amount) missionData.completed = true

    missionData.save()

    // The mission should be completed now so need to give XP.
    this.addLocalXP(member, mission.reward, true)
    this.addGlobalXP(member, mission.reward, true)
  }
}
