import Gamer from '../..'
import { GamerGiveaway } from '../../database/schemas/giveaway'
import { sendMessage } from './eris'
import { MessageEmbed } from 'helperis'

export async function processGiveaways() {
  const [pendingGiveaways, ongoingGiveaways] = await Promise.all([
    Gamer.database.models.giveaway.find({ hasStarted: false }),
    Gamer.database.models.giveaway.find({ hasStarted: true })
  ])

  const now = Date.now()

  // These giveaway have not yet started
  pendingGiveaways.forEach(giveaway => {
    // Not time yet to start this giveaway
    if (now > giveaway.createdAt + giveaway.delayTillStart) return
    // This giveaway needs to start.
    Gamer.database.models.giveaway
      .updateOne({ giveawayID: giveaway.giveawayID, guildID: giveaway.guildID }, { hasStarted: true })
      .exec()
  })

  // These giveaway have started, need to check if it is time to stop them.
  ongoingGiveaways.forEach(giveaway => {
    // Not time ye tto end the giveaway
    if (giveaway.createdAt + giveaway.delayTillStart + giveaway.duration > now) return

    // End the giveaway. This will stop user intercation
    if (!giveaway.hasEnded)
      Gamer.database.models.giveaway
        .updateOne({ giveawayID: giveaway.giveawayID, guildID: giveaway.guildID }, { hasEnded: true })
        .exec()

    // Winners selection might occur with a delay so we don't delete it from the database here. Once all winners are selected we will delete the db giveaway
    pickGiveawayWinners(giveaway)
  })
}

export async function pickGiveawayWinners(giveaway: GamerGiveaway) {
  // All winners have been selected already delete from DB.
  if (giveaway.pickWinners && giveaway.amountOfWinners === giveaway.pickedParticipants.length) {
    sendMessage(
      giveaway.notificationsChannelID,
      `<@${giveaway.creatorID}> The giveaway with ID **${giveaway.giveawayID}** has finished and all winners have been selected.`
    )
    Gamer.database.models.giveaway.deleteOne({ _id: giveaway._id }).exec()
    return
  }

  // No one entered the giveaway
  if (!giveaway.participants.length) {
    sendMessage(
      giveaway.notificationsChannelID,
      `<@${giveaway.creatorID}> The giveaway with ID **${giveaway.giveawayID}** has finished but no users participated in this giveaway so no winners have been selected.`
    )
    {
      Gamer.database.models.giveaway.deleteOne({ _id: giveaway._id }).exec()
      return
    }
  }

  const guild = Gamer.guilds.get(giveaway.guildID)
  if (!guild) return

  // Only those users that have not already been picked.
  let filteredParticipants = giveaway.participants.filter(participant => {
    // Picking winners
    if (giveaway.pickWinners) {
      // If user is not picked we want to keep this user.
      return !giveaway.pickedParticipants.some(pp => pp.userID === participant.userID)
    }

    // Picking losers
    return !giveaway.pickedParticipants.some(
      pp => pp.userID === participant.userID && pp.timestamp === participant.timestamp
    )
  })

  // If vip guild, fetch all members
  if (Gamer.vipGuildIDs.has(guild.id)) {
    if (!Gamer.allMembersFetchedGuildIDs.has(guild.id)) {
      await guild.fetchAllMembers()
      Gamer.allMembersFetchedGuildIDs.add(guild.id)
    }

    // Removes any users who are no longer members
    filteredParticipants = filteredParticipants.filter(participant => !guild.members.has(participant.userID))
  }

  // All losers have been picked. Only ones left are winners.
  if (!giveaway.pickWinners && filteredParticipants.length === giveaway.amountOfWinners) {
    for (const participant of filteredParticipants) {
      const member = guild.members.get(participant.userID)
      if (!member) continue

      const embed = new MessageEmbed()
        .setAuthor(`Won the giveaway!`, guild?.dynamicIconURL())
        .setDescription(`<@${participant.userID}> has won the giveaway!`)
        .setTimestamp()

      sendMessage(giveaway.notificationsChannelID, { content: `<@${participant.userID}>`, embed: embed.code })

      // If VIP guild enabled the interval option, delay it for that time period
      if (Gamer.vipGuildIDs.has(guild.id) && giveaway.pickInterval) {
				await Gamer.helpers.utils.sleep(giveaway.pickInterval / 1000)
				continue
      }
    }
		
		sendMessage(
      giveaway.notificationsChannelID,
      `<@${giveaway.creatorID}> The giveaway with ID **${giveaway.giveawayID}** has finished and all winners have been selected.`
    )
    Gamer.database.models.giveaway.deleteOne({ _id: giveaway._id }).exec()
    return
  }

  // No participants remain to be selected.
  if (!filteredParticipants.length) {
    sendMessage(
      giveaway.notificationsChannelID,
      `<@${giveaway.creatorID}> The giveaway with ID **${giveaway.giveawayID}** did not have enough users to pick all the requested winners.`
    )
    Gamer.database.models.giveaway.deleteOne({ _id: giveaway._id }).exec()
    return
  }

  const randomParticipant = Gamer.helpers.utils.chooseRandom(filteredParticipants)
  if (!randomParticipant) return

  const member = guild.members.get(randomParticipant.userID)
  if (!member) return

  // Await this to make sure it is marked as a winner before alerting the user.
  await Gamer.database.models.giveaway
    .updateOne({ _id: giveaway._id }, { pickedParticipants: [...giveaway.pickedParticipants, randomParticipant] })
    .exec()

  const embed = new MessageEmbed()
    .setAuthor(`Won the giveaway!`, guild?.dynamicIconURL())
    .setDescription(`<@${randomParticipant.userID}> has won the giveaway!`)
    .setTimestamp()

  // Send message based on winner or loser
  if (giveaway.pickWinners)
    sendMessage(giveaway.notificationsChannelID, { content: `<@${randomParticipant.userID}>`, embed: embed.code })
  else {
    embed
      .setAuthor(`Lost the giveaway!`, guild?.dynamicIconURL())
      .setDescription(`<@${randomParticipant.userID}> has lost the giveaway!`)
    sendMessage(giveaway.notificationsChannelID, { embed: embed.code })
  }

  // If VIP guild enabled the interval option, delay it for that time period
  if (Gamer.vipGuildIDs.has(guild.id) && giveaway.pickInterval) {
    setTimeout(() => pickGiveawayWinners(giveaway), giveaway.pickInterval)
    return
  }

  // Sleep to prevent recursion stack error
  await Gamer.helpers.utils.sleep(1)
  pickGiveawayWinners(giveaway)
}
