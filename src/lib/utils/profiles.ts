import { Canvas } from 'canvas-constructor'
import fetch from 'node-fetch'
import { Message, Member } from 'eris'
import GamerClient from '../structures/GamerClient'
import Constants from '../../constants/index'
import constants from '../../constants/index'

interface ProfileCanvasOptions {
  style?: string
  backgroundID?: number
}

const rectangleStartHeight = 50
const whiteMode = Constants.profiles.whiteMode
const darkMode = Constants.profiles.darkMode

export default class {
  Gamer: GamerClient

  defaultProfile: Buffer

  constructor(client: GamerClient) {
    this.Gamer = client

    this.defaultProfile = new Canvas(852, 581)
      .setAntialiasing(`subpixel`)
      .addBeveledImage(Constants.profiles.backgrounds[0].buffer, 345, 50, 457, 481, 25, true)
      .setAntialiasing(`subpixel`)
      .addImage(this.Gamer.buffers.profiles.whiteRectangle, 2, rectangleStartHeight)
      .addImage(this.Gamer.buffers.profiles.blueCircle, 40, 80)
      .setColor(whiteMode.userdivider)
      .addRect(158, 135, 240, 2)
      .setTextAlign(`left`)
      .setColor(whiteMode.xpbarText)
      .setTextFont(`20px LatoBold`)

      // clan info (logo, text)
      .addCircularImage(this.Gamer.buffers.botLogo, 555, 480, 50, true)
      .setColor(whiteMode.clanRectFilling)
      .addBeveledRect(590, 435, 200, 90)
      .setTextAlign(`left`)
      .setShadowColor(whiteMode.badgeShadow)
      .setShadowBlur(7)
      .setColor(whiteMode.badgeFilling)
      .addCircle(70, 480, 27.5)
      .fill()
      .addCircle(145, 480, 27.5)
      .fill()
      .addCircle(220, 480, 27.5)
      .fill()
      .addCircle(295, 480, 27.5)
      .fill()
      .addCircle(370, 480, 27.5)
      .fill()
      .addCircle(445, 480, 27.5)
      .fill()
      .resetShadows()
      .addRoundImage(this.Gamer.buffers.profiles.badges.shoptitans, 45, 455, 50, 50, 25, true)
      .addRoundImage(this.Gamer.buffers.profiles.badges.loud, 120, 455, 50, 50, 25, true)
      .toBuffer()
  }

  get getDefaultProfile() {
    return this.defaultProfile
  }

  async makeCanvas(message: Message, member: Member, Gamer: GamerClient, options?: ProfileCanvasOptions) {
    const [memberSettings, userSettings, isMarried, isSpouse] = await Promise.all([
      Gamer.database.models.member.findOne({
        memberID: member.id,
        guildID: member.guild.id
      }),
      Gamer.database.models.user.findOne({ userID: member.id }),
      Gamer.database.models.marriage.findOne({ authorID: member.id }),
      Gamer.database.models.marriage.findOne({ spouseID: member.id, accepted: true })
    ])

    // Select the background theme & id from their settings if no override options were provided
    const style = (options && options.style) || userSettings?.profile?.theme || 'white'
    const backgroundID = (options && options.backgroundID) || userSettings?.profile?.backgroundID || 1

    const useDefaultProfile = style === 'white' && backgroundID === 1
    // Get background data OR If the background is invalid then set it to default values
    const backgroundData =
      Constants.profiles.backgrounds.find(b => b.id === backgroundID) ||
      Constants.profiles.backgrounds.find(b => b.id === 1)
    if (!backgroundData) return

    // SERVER XP DATA
    const serverLevelDetails = Constants.levels.find(lev => lev.xpNeeded > (memberSettings?.leveling.xp || 0))
    const globalLevelDetails = Constants.levels.find(lev => lev.xpNeeded > (userSettings?.leveling?.xp || 0))
    const previousServerLevelDetails =
      Constants.levels.find(lev => lev.level === (serverLevelDetails?.level || 0) - 1) || constants.levels[0]
    const previousGlobalLevelDetails =
      Constants.levels.find(lev => lev.level === (globalLevelDetails?.level || 0) - 1) || constants.levels[0]
    if (!serverLevelDetails || !globalLevelDetails || !previousServerLevelDetails || !previousGlobalLevelDetails) return

    const memberLevel = serverLevelDetails.level
    const totalMemberXP = memberSettings?.leveling.xp || 0
    const globalLevel = globalLevelDetails.level
    const totalGlobalXP = userSettings?.leveling?.xp || 0
    // Since XP is stored as TOTAL and is not reset per level we need to make a cleaner version
    // Create the cleaner xp based on the level of the member
    let memberXP = totalMemberXP
    if (memberLevel >= 1) {
      const previousLevel = Constants.levels.find(lev => lev.level === memberLevel - 1)
      if (!previousLevel) return

      memberXP = totalMemberXP - previousLevel.xpNeeded
    }
    // Create the cleaner xp based on the level of the user
    let globalXP = totalGlobalXP
    if (globalLevel >= 1) {
      const previousLevel = Constants.levels.find(lev => lev.level === globalLevel - 1)
      if (!previousLevel) return
      globalXP = totalGlobalXP - previousLevel.xpNeeded
    }

    // Calculate Progress
    const xpBarWidth = 360

    // Marriage calculations
    const marriage = isMarried || (isSpouse && isSpouse.accepted ? isSpouse : undefined)
    const mRatio = (marriage?.love || 0) / 100
    const mProgress = xpBarWidth * mRatio

    const sRatio =
      memberXP / (serverLevelDetails.xpNeeded - previousServerLevelDetails.xpNeeded || serverLevelDetails.xpNeeded)
    const sProgress = xpBarWidth * sRatio
    const gRatio = globalXP / (globalLevelDetails.xpNeeded - previousGlobalLevelDetails.xpNeeded)
    const gProgress = xpBarWidth * gRatio

    // STYLES EVALUATION AND DATA

    const mode = style === `black` ? darkMode : whiteMode
    const leftBackground =
      style === `black` ? Gamer.buffers.profiles.blackRectangle : Gamer.buffers.profiles.whiteRectangle

    const canvasWidth = backgroundData.vipNeeded ? 952 : 852

    const language = Gamer.getLanguage(member.guild.id)

    const canvas = useDefaultProfile
      ? new Canvas(canvasWidth, 581).addImage(this.defaultProfile, 0, 0)
      : new Canvas(canvasWidth, 581)

    if (!useDefaultProfile) {
      // SET USER OR DEFAULT BACKGROUND
      if (backgroundData.vipNeeded) canvas.setAntialiasing(`subpixel`).addImage(backgroundData.buffer, 345, 0)
      else canvas.setAntialiasing(`subpixel`).addBeveledImage(backgroundData.buffer, 345, 50, 457, 481, 25, true)

      // set left background (white or black)
      canvas
        .setAntialiasing(`subpixel`)
        .addImage(leftBackground, 2, rectangleStartHeight)

        // user avatar pic + blue circle
        .addImage(Gamer.buffers.profiles.blueCircle, 40, 80)

        // clan info (logo, text)
        .addCircularImage(Gamer.buffers.botLogo, 555, 480, 50, true)
        .setColor(mode.clanRectFilling)
        .addBeveledRect(590, 435, 200, 90)
        .setTextAlign(`left`)

        // all badgeholders
        .setShadowColor(mode.badgeShadow)
        .setShadowBlur(7)
        .setColor(mode.badgeFilling)
        .addCircle(70, 480, 27.5)
        .fill()
        .addCircle(145, 480, 27.5)
        .fill()
        .addCircle(220, 480, 27.5)
        .fill()
        .addCircle(295, 480, 27.5)
        .fill()
        .addCircle(370, 480, 27.5)
        .fill()
        .addCircle(445, 480, 27.5)
        .fill()
        .resetShadows()
        .addRoundImage(Gamer.buffers.profiles.badges.shoptitans, 45, 455, 50, 50, 25, true)
        .addRoundImage(Gamer.buffers.profiles.badges.loud, 120, 455, 50, 50, 25, true)

      // user badges
      if (Gamer.helpers.discord.isBotOwnerOrMod(message) || userSettings?.vip?.isVIP) {
        canvas.addRoundImage(Gamer.buffers.profiles.badges.vip, 195, 455, 50, 50, 25, true)
        // Spots to add user custom badges
        // canvas.addRoundImage(Gamer.buffers.profiles.badges.shoptitans, 120, 455, 50, 50, 25, true)
        //   .addRoundImage(Gamer.buffers.profiles.badges.playstation, 195, 455, 50, 50, 25, true)
        //   .addRoundImage(Gamer.buffers.profiles.badges.xbox, 270, 455, 50, 50, 25, true)
        //   .addRoundImage(Gamer.buffers.profiles.badges.mobile, 345, 455, 50, 50, 25, true)
        //   .addRoundImage(Gamer.buffers.profiles.badges.steam, 420, 455, 50, 50, 25, true)
      }
    }

    const avatarUrl = member.user.dynamicAvatarURL(`png`, 2048)
    try {
      const avatarBuffer = await fetch(avatarUrl).then(res => res.buffer())
      canvas.addCircularImage(avatarBuffer, 89, 130, 42, true)
    } catch (error) {
      console.error(`Error while fetching avatar url in profiles ${avatarUrl}`)
    }

    // user name and discrimininator
    const username = member.user.username.replace(
      /([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2694-\u2697]|\uD83E[\uDD10-\uDD5D])/g,
      ``
    )

    const spouse = marriage
      ? await Gamer.helpers.discord.fetchUser(
          Gamer,
          marriage.authorID === member.id ? marriage.spouseID : marriage.authorID
        )
      : undefined
    const spouseUsername = spouse?.username.replace(
      /([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2694-\u2697]|\uD83E[\uDD10-\uDD5D])/g,
      ``
    )

    canvas
      .setColor(mode.clanName)
      .setTextFont(`16px LatoBold`)
      .addText(language('leveling/profile:COINS', { amount: userSettings?.leveling?.currency || 0 }), 600, 463)
      .setColor(mode.userdivider)
      .addRect(158, 135, 240, 2)
      .setColor(mode.username)
      .setTextAlign(`left`)
      .setTextFont(`26px LatoBold`)
      .addResponsiveText(username, 160, 120, 200)
      .setColor(mode.discriminator)
      .setTextAlign(`left`)
      .setTextFont(`18px LatoBold`)
      .addText(`#${member.user.discriminator}`, 160, 165)

      // level bar texts
      .setColor(mode.xpbarText)
      .setTextAlign(`left`)
      .setTextFont(`20px LatoBold`)
      .addText(language(`leveling/profile:SERVER_XP`), 45, 225)
      .addText(language(`leveling/profile:LEVEL`), 350, 225)
      .addText(language(`leveling/profile:GLOBAL_XP`), 45, 300)
      .addText(language(`leveling/profile:LEVEL`), 350, 300)
      .addResponsiveText(
        spouse
          ? language(`leveling/profile:MARRIED`, { username: `${spouseUsername}#${spouse.discriminator}` })
          : language(`leveling/profile:NOT_MARRIED`),
        45,
        375,
        450
      )
      .setTextFont(`30px LatoHeavy`)
      .addText(memberLevel.toString(), 310, 225)
      .addText(globalLevel.toString(), 310, 300)

      // all xp bars
      .setColor(mode.xpbarFilling)
      .addBeveledRect(45, 240, xpBarWidth, 30, 25)
      .addBeveledRect(45, 310, xpBarWidth, 30, 25)
      .addBeveledRect(45, 390, xpBarWidth, 30, 25)

    // server xp bar filling
    // The if checks solve a crucial bug in canvas DO NOT REMOVE.
    // The global bar breaks and is always fill if u have server level 0 without the if checks
    if (sProgress) {
      canvas
        .setShadowColor(`rgba(155, 222, 239, .5)`)
        .setShadowBlur(7)
        .printLinearGradient(45, 240, 45 + sProgress, 285, [
          { position: 0, color: `#5994f2` },
          { position: 0.25, color: `#8bccef` },
          { position: 0.5, color: `#9bdeef` },
          { position: 0.75, color: `#9befe7` }
        ])
        .addBeveledRect(45, 240, sProgress, 30, 25)
    }

    // global xp bar filling
    if (gProgress) {
      canvas
        .setShadowColor(`rgba(155, 222, 239, .5)`)
        .setShadowBlur(7)
        .printLinearGradient(45, 310, 45 + gProgress, 395, [
          { position: 0, color: `#5994f2` },
          { position: 0.25, color: `#8bccef` },
          { position: 0.5, color: `#9bdeef` },
          { position: 0.75, color: `#9befe7` }
        ])
        .addBeveledRect(45, 310, gProgress, 30, 25)
    }

    // marriage love meter filling
    if (mProgress) {
      canvas
        .printLinearGradient(45, 390, 45 + mProgress, 395, [
          { position: 0, color: `#ff9a8b` },
          { position: 0.25, color: `#ff8f88` },
          { position: 0.5, color: `#ff8386` },
          { position: 0.75, color: `#ff7786` }
        ])
        .addBeveledRect(45, 390, mProgress, 30, 25)
    }

    canvas
      // server xp bar text
      .setColor(sRatio > 0.6 ? mode.xpbarRatioUp : mode.xpbarRatioDown)
      .setTextAlign(`left`)
      .setTextFont(`16px LatoBold`)
      .addText(
        `${memberXP}/${
          serverLevelDetails.xpNeeded - previousServerLevelDetails?.xpNeeded || serverLevelDetails.xpNeeded
        }`,
        190,
        260
      )
      // global xp bar text
      .addText(`${globalXP}/${globalLevelDetails.xpNeeded - previousGlobalLevelDetails?.xpNeeded}`, 190, 330)
      // global xp bar text
      .addText(`${marriage?.love || 0}%`, 190, 410)

    return canvas.toBufferAsync()
  }
}
