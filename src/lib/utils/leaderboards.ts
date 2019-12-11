import { Canvas } from 'canvas-constructor'
import fetch from 'node-fetch'
import GamerClient from '../structures/GamerClient'
import { Message, Member } from 'eris'
import { MemberSettings, UserSettings } from '../types/settings'
import constants from '../../constants'

// Canvas.registerFont(join(assetsFolder, `fonts/SF-Pro-Text-Heavy.otf`), `SFTHeavy`)
// Canvas.registerFont(join(assetsFolder, `fonts/SF-Pro-Text-Light.otf`), `SFTLight`)
// Canvas.registerFont(join(assetsFolder, `fonts/SF-Pro-Text-Bold.otf`), `SFTBold`)
// Canvas.registerFont(join(assetsFolder, `fonts/SF-Pro-Text-Regular.otf`), `SFTRegular`)
// Canvas.registerFont(join(assetsFolder, `fonts/SF-Pro-Text-Medium.otf`), `SFTMedium`)

export default class {
  Gamer: GamerClient

  constructor(client: GamerClient) {
    this.Gamer = client
  }

  async makeLocalCanvas(message: Message, member: Member, NO_POINTS: string, NOT_ENOUGH: string) {
    const allRelevantMembers = (await this.Gamer.database.models.member
      .find({
        guildID: member.guild.id
      })
      .sort(`-leveling.xp`)) as MemberSettings[]

    const index = allRelevantMembers.findIndex(data => data.memberID === member.id)
    const memberSettings = allRelevantMembers[index]
    if (!memberSettings) {
      message.channel.createMessage(NO_POINTS)
      return
    }

    const memberPosition = index >= 0 ? index + 1 : this.Gamer.users.size
    const nextRankUserData = index === 0 ? null : allRelevantMembers[index - 1]
    const prevRankUserData = allRelevantMembers[index + 1]
    if (!nextRankUserData && !prevRankUserData) {
      message.channel.createMessage(NOT_ENOUGH)
      return
    }

    const userAvatar = await fetch(member.user.avatarURL).then(res => res.buffer())
    const username = member.user.username.replace(
      /([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2694-\u2697]|\uD83E[\uDD10-\uDD5D])/g,
      ``
    )
    const topUsers = allRelevantMembers.slice(0, 3)

    const topUserData = []
    // Run a loop for the top 3 users
    for (const userData of topUsers) {
      // Get the user
      const user = this.Gamer.users.get(userData.memberID)
      if (!user) continue

      topUserData.push({
        avatarUrl: user.avatarURL,
        currentXP: userData.leveling.xp,
        username: user.username,
        discriminator: user.discriminator
      })
    }

    return this.buildCanvas(
      `SERVER`,
      userAvatar,
      username,
      member.user.discriminator,
      memberPosition,
      memberSettings.leveling.xp,
      nextRankUserData,
      memberSettings,
      prevRankUserData,
      topUserData
    )
  }

  async makeGlobalCanvas(message: Message, member: Member, NO_POINTS: string, NOT_ENOUGH: string) {
    // const userSettings = await this.Gamer.database.models.user.findOne({ userID: member.id })
    const allRelevantUsers = await this.Gamer.database.models.user
      .find({ 'leveling.xp': { $gte: 1 } })
      .sort(`-leveling.xp`)

    const index = allRelevantUsers.findIndex(data => data.userID === member.id)
    const userData = allRelevantUsers[index]
    if (!userData) {
      message.channel.createMessage(NO_POINTS)
      return
    }

    const memberPosition = index >= 0 ? index + 1 : this.Gamer.users.size
    const nextRankUserData = index === 0 ? null : allRelevantUsers[index - 1]
    const prevRankUserData = allRelevantUsers[index + 1]
    if (!nextRankUserData && !prevRankUserData) {
      message.channel.createMessage(NOT_ENOUGH)
      return
    }
    const userAvatar = await fetch(member.user.avatarURL).then(res => res.buffer())
    const username = member.user.username.replace(
      /([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2694-\u2697]|\uD83E[\uDD10-\uDD5D])/g,
      ``
    )
    const topUsers = await this.Gamer.database.models.user
      .find()
      .sort(`-leveling.xp`)
      .limit(3)

    const topUserData = []
    // Run a loop for the top 3 users
    for (const userData of topUsers) {
      // Get the user
      const user = this.Gamer.users.get(userData.userID)
      if (!user) continue

      topUserData.push({
        avatarUrl: user.avatarURL,
        currentXP: userData.leveling.xp,
        username: user.username,
        discriminator: user.discriminator
      })
    }

    return this.buildCanvas(
      `GLOBAL`,
      userAvatar,
      username,
      member.user.discriminator,
      memberPosition,
      userData.leveling.xp,
      nextRankUserData,
      userData,
      prevRankUserData,
      topUserData
    )
  }

  public async makeVoiceCanvas(message: Message, member: Member, NO_POINTS: string, NOT_ENOUGH: string) {
    const allRelevantUsers = await this.Gamer.database.models.member
      .find({ guildID: member.guild.id })
      .sort(`-leveling.voicexp`)

    const index = allRelevantUsers.findIndex(data => data.memberID === member.id)
    const memberSettings = allRelevantUsers[index]
    if (!memberSettings) {
      message.channel.createMessage(NO_POINTS)
      return
    }
    const memberPosition = index >= 0 ? index + 1 : this.Gamer.users.size
    const nextRankUserData = index === 0 ? null : allRelevantUsers[index - 1]
    const prevRankUserData = allRelevantUsers[index + 1]
    if (!nextRankUserData && !prevRankUserData) {
      message.channel.createMessage(NOT_ENOUGH)
      return
    }

    const userAvatar = await fetch(member.user.avatarURL).then(res => res.buffer())
    const username = member.user.username.replace(
      /([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2694-\u2697]|\uD83E[\uDD10-\uDD5D])/g,
      ``
    )

    const topUsers = allRelevantUsers.slice(0, 3)

    const topUserData = []
    // Run a loop for the top 3 users
    for (const userData of topUsers) {
      // Get the user
      const user = this.Gamer.users.get(userData.memberID)
      if (!user) continue

      topUserData.push({
        avatarUrl: user.avatarURL,
        currentXP: userData.leveling.voicexp,
        username: user.username,
        discriminator: user.discriminator
      })
    }

    return this.buildCanvas(
      `VOICE`,
      userAvatar,
      username,
      member.user.discriminator,
      memberPosition,
      memberSettings.leveling.voicexp,
      nextRankUserData,
      memberSettings,
      prevRankUserData,
      topUserData
    )
  }

  public async buildCanvas(
    type: `SERVER` | `GLOBAL` | `VOICE`,
    avatarBuffer: Buffer,
    username: string,
    discriminator: string,
    memberPosition: number,
    userXP: number,
    nextRankUserData: MemberSettings | UserSettings | null,
    memberData: MemberSettings | UserSettings,
    prevRankUserData: MemberSettings | UserSettings,
    topUsers: TopUserLeaderboard[]
  ) {
    const canvas = new Canvas(636, 358)
      // set left background (white or black)
      .setAntialiasing(`subpixel`)
      .addImage(this.Gamer.buffers.leaderboards.background, 0, 0)
      // user avatar pic + blue circle
      .addCircularImage(avatarBuffer, 120, 80, 50, true)
      // user name and discrimininator
      .setColor(`#ffffff`)
      .setTextAlign(`center`)
      .setTextFont(`26px SFTBold`)
      .addResponsiveText(username, 120, 155, 200)
      .setColor(`#ffffff`)
      .setTextAlign(`center`)
      .setTextFont(`16px SFTRegular`)
      .addText(`#${discriminator}`, 120, 175)

      // server or global level
      .setTextFont(`24px SFTBold`)
      .setTextAlign(`center`)
      .addText(`Rank ${memberPosition}`, 120, 220)

      // XP display with beveled rect
      .setColor(`#ffffff`)
      .addBeveledRect(45, 235, 150, 30, 25)
      .restore()
      .setColor(`#2c2c2c`)
      .setTextAlign(`center`)
      .setTextFont(`18px SFTBold`)
      .addResponsiveText(`${this.transformXP(userXP)} EXP`, 120, 257, 140)
      .setColor(`#ffffff`)
      .setTextFont(`14px SFTBold`)
      .setTextAlign(`center`)
      .addText(
        nextRankUserData
          ? `${this.transformXP(nextRankUserData.leveling.xp)} EXP Behind`
          : `${this.transformXP(memberData.leveling.xp - prevRankUserData.leveling.xp)} EXP Ahead`,
        120,
        300
      )

      // HEADER
      .setColor(`#2c2c2c`)
      .setTextFont(`18px SFTHeavy`)
      .addText(type, 355, 50)
      .setTextFont(`18px SFTLight`)
      .addText(`LEADERBOARD`, 465, 50)

      // table headers
      .setTextFont(`16px SFTBold`)
      .setColor(`#8b8b8b`)
      .addText(`#`, 275, 95)
      .addText(`Name`, 370, 95)
      .addText(`Level`, 480, 95)
      .addText(`EXP`, 540, 95)
      .addText(`Prize`, 600, 95)

    let userY = 140
    let position = 1

    for (const userData of topUsers) {
      try {
        const avatarBuffer = await fetch(userData.avatarUrl).then(res => res.buffer())
        canvas.addCircularImage(avatarBuffer, 315, userY - 10, 20, true)
      } catch {}

      const currentLevel =
        constants.levels.find(level => level.xpNeeded > userData.currentXP) ||
        constants.levels[constants.levels.length - 1]
      canvas
        .setColor(`#46a3ff`)
        .setTextFont(`18px SFTMedium`)
        .addText(position.toString(), 275, userY)
        .setColor(`#363636`)
        // .addCircle(315, userY - 10, 22)
        .setColor(`#2c2c2c`)
        .setTextAlign(`left`)
        .setTextFont(`18px SFTMedium`)
        .addResponsiveText(userData.username, 350, userY - 12, 110)
        .setTextFont(`13px SFTRegular`)
        .addText(`#${userData.discriminator}`, 350, userY + 8)
        .setTextAlign(`center`)
        .setTextFont(`18px SFTMedium`)
        .addText(currentLevel.level.toString(), 485, userY)
        .addResponsiveText(userData.currentXP.toString(), 540, userY, 100)
        .addImage(this.Gamer.buffers.leaderboards.rectangle, 585, userY - 24)

      // Update for next loop
      position++
      userY += 90
    }

    return canvas.toBufferAsync()
  }

  public transformXP(xp: number) {
    if (xp < 10000) return xp

    const thousand = 1000
    const hundred = 100
    const ten = 10
    const quotientThousand = Math.floor(xp / thousand)
    const remainderThousand = xp % thousand
    const quotientHundred = Math.floor(remainderThousand / hundred)
    const remainderHundred = remainderThousand % hundred
    const quotientTen = Math.floor(remainderHundred / ten)

    return `${quotientThousand}.${quotientHundred}${quotientTen} K`
  }
}

export interface TopUserLeaderboard {
  avatarUrl: string
  currentXP: number
  username: string
  discriminator: string
}
