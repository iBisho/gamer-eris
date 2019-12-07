import { Canvas } from 'canvas-constructor'
import fetch from 'node-fetch'
import { Message, Member, PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../structures/GamerClient'
import Constants from '../../constants/index'
import MemberDefaults from '../../constants/settings/member'
import UserDefaults from '../../constants/settings/user'

interface ProfileCanvasOptions {
  style?: string
  backgroundID?: number
}

export default class {
  public async makeCanvas(message: Message, member: Member, Gamer: GamerClient, options?: ProfileCanvasOptions) {
    if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

    const memberSettings =
      (await Gamer.database.models.member.findOne({
        id: `${member.guild.id}.${member.id}`
      })) || MemberDefaults
    const userSettings = (await Gamer.database.models.user.findOne({ userID: member.id })) || UserDefaults
    // Select the background theme & id from their settings if no override options were provided
    const style = (options && options.style) || userSettings.profile.theme
    const backgroundID = (options && options.backgroundID) || userSettings.profile.backgroundID

    // Get background data OR If the background is invalid then set it to default values
    const backgroundData =
      Constants.profiles.backgrounds.find(b => b.id === backgroundID) ||
      Constants.profiles.backgrounds.find(b => b.id === 1)
    if (!backgroundData) return

    // SERVER XP DATA
    const serverLevelDetails = Constants.levels.find(lev => lev.xpNeeded > memberSettings.leveling.xp)
    const globalLevelDetails = Constants.levels.find(lev => lev.xpNeeded > userSettings.leveling.xp)
    if (!serverLevelDetails || !globalLevelDetails) return

    const memberLevel = serverLevelDetails.level
    const totalMemberXP = memberSettings.leveling.xp
    const globalLevel = globalLevelDetails.level
    const totalGlobalXP = userSettings.leveling.xp
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

    const sRatio = memberXP / serverLevelDetails.xpNeeded
    const sProgress = xpBarWidth * sRatio
    const gRatio = globalXP / globalLevelDetails.xpNeeded
    const gProgress = xpBarWidth * gRatio

    // STYLES EVALUATION AND DATA
    const whiteMode = Constants.profiles.whiteMode
    const darkMode = Constants.profiles.darkMode

    const mode = style === `black` ? darkMode : whiteMode
    const leftBackground =
      style === `black` ? Gamer.buffers.profiles.blackRectangle : Gamer.buffers.profiles.whiteRectangle

    const canvasWidth = backgroundData.vipNeeded ? 952 : 852
    const rectangleStartHeight = 50

    const canvas = new Canvas(canvasWidth, 581)
    // SET USER OR DEFAULT BACKGROUND
    if (backgroundData.vipNeeded) canvas.setAntialiasing(`subpixel`).addImage(backgroundData.buffer, 345, 0)
    else canvas.setAntialiasing(`subpixel`).addBeveledImage(backgroundData.buffer, 345, 50, 457, 481, 25, true)

    // set left background (white or black)
    canvas.setAntialiasing(`subpixel`).addImage(leftBackground, 2, rectangleStartHeight)

    // user avatar pic + blue circle
    canvas.addImage(Gamer.buffers.profiles.blueCircle, 40, 80)

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
    canvas
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
      .addText(`Server XP`, 45, 245)
      .addText(`LEVEL`, 350, 245)
      .addText(`Global XP`, 45, 355)
      .addText(`LEVEL`, 350, 355)
      .setTextFont(`30px LatoHeavy`)
      .addText(memberLevel.toString(), 310, 245)
      .addText(globalLevel.toString(), 310, 355)

      // all xp bars
      .setColor(mode.xpbarFilling)
      .addBeveledRect(45, 260, xpBarWidth, 30, 25)
      .addBeveledRect(45, 370, xpBarWidth, 30, 25)

    // server xp bar filling
    // The if checks solve a crucial bug in canvas DO NOT REMOVE.
    // The global bar breaks and is always fill if u have server level 0 without the if checks
    if (sProgress) {
      canvas
        .setShadowColor(`rgba(155, 222, 239, .5)`)
        .setShadowBlur(7)
        .printLinearGradient(45, 260, 45 + sProgress, 285, [
          { position: 0, color: `#5994f2` },
          { position: 0.25, color: `#8bccef` },
          { position: 0.5, color: `#9bdeef` },
          { position: 0.75, color: `#9befe7` }
        ])
        .addBeveledRect(45, 260, sProgress, 30, 25)
    }

    // global xp bar filling
    if (gProgress) {
      canvas
        .setShadowColor(`rgba(155, 222, 239, .5)`)
        .setShadowBlur(7)
        .printLinearGradient(45, 370, 45 + gProgress, 395, [
          { position: 0, color: `#5994f2` },
          { position: 0.25, color: `#8bccef` },
          { position: 0.5, color: `#9bdeef` },
          { position: 0.75, color: `#9befe7` }
        ])
        .addBeveledRect(45, 370, gProgress, 30, 25)
    }

    canvas
      // server xp bar text
      .setColor(sRatio > 0.6 ? mode.xpbarRatioUp : mode.xpbarRatioDown)
      .setTextAlign(`left`)
      .setTextFont(`16px LatoBold`)
      .addText(`${memberXP}/${serverLevelDetails.xpNeeded}`, 190, 280)

      // global xp bar text
      .setColor(gRatio > 0.6 ? mode.xpbarRatioUp : mode.xpbarRatioDown)
      .setTextAlign(`left`)
      .setTextFont(`16px LatoBold`)
      .addText(`${globalXP}/${globalLevelDetails.xpNeeded}`, 190, 390)

      // clan info (logo, text)
      .addCircularImage(Gamer.buffers.botLogo, 555, 480, 50, true)
      .setColor(mode.clanRectFilling)
      .addBeveledRect(590, 435, 200, 90)
      .setTextAlign(`left`)
      .setColor(mode.clanName)
      .setTextFont(`20px LatoBold`)
      .addText(Constants.profiles.clanDefaults.name, 600, 463)
      .setColor(mode.clanText)
      .setTextFont(`14px LatoBold`)
      .addMultilineText(Constants.profiles.clanDefaults.text.substr(0, 50), 600, 483)
      .setColor(mode.clanURL)
      .setTextFont(`14px LatoBold`)
      .addText(Constants.profiles.clanDefaults.url, 600, 515)

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

    // user badges
    if (Gamer.helpers.discord.isBotOwnerOrMod(message) || userSettings.vip.isVIP) {
      canvas
        .addRoundImage(Gamer.buffers.profiles.badges.vip, 45, 455, 50, 50, 25, true)
        .addRoundImage(Gamer.buffers.profiles.badges.shoptitans, 120, 455, 50, 50, 25, true)
        .addRoundImage(Gamer.buffers.profiles.badges.loud, 195, 455, 50, 50, 25, true)
    } else {
      canvas
        .addRoundImage(Gamer.buffers.profiles.badges.shoptitans, 45, 455, 50, 50, 25, true)
        .addRoundImage(Gamer.buffers.profiles.badges.loud, 120, 455, 50, 50, 25, true)
    }
    // Spots to add user custom badges
    // canvas.addRoundImage(Gamer.buffers.profiles.badges.shoptitans, 120, 455, 50, 50, 25, true)
    //   .addRoundImage(Gamer.buffers.profiles.badges.playstation, 195, 455, 50, 50, 25, true)
    //   .addRoundImage(Gamer.buffers.profiles.badges.xbox, 270, 455, 50, 50, 25, true)
    //   .addRoundImage(Gamer.buffers.profiles.badges.mobile, 345, 455, 50, 50, 25, true)
    //   .addRoundImage(Gamer.buffers.profiles.badges.steam, 420, 455, 50, 50, 25, true)

    return canvas.toBufferAsync()
  }
}
