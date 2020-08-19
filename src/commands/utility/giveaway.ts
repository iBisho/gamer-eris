import GamerClient from '../../lib/structures/GamerClient'
import { Command } from 'yuuko'
import { needMessage, sendMessage, addRoleToMember, deleteMessage } from '../../lib/utils/eris'
import { parseRole } from '../../lib/utils/arguments'
import { setNickname } from 'helperis'
export default new Command(['giveaway'], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient

  let giveawayID = 0

  const giveaways = await Gamer.database.models.giveaway.find({
    guildID: message.member.guild.id,
    hasStarted: true,
    hasEnded: false
  })
  if (!giveaways.length) return sendMessage(message.channel.id, 'Sorry there are currently no giveaways going on.')

  if (giveaways.length > 1) {
    // More than 1 giveaway found on this server
    sendMessage(
      message.channel.id,
      'There was more than 1 giveaway found on this server at this time. Please provide the giveaway ID number now.'
    )
    const choiceMessage = await needMessage(message)
    const id = Number(choiceMessage.content)
    if (!id) return

    const isValidGiveaway = giveaways.find(giveaway => giveaway.giveawayID === id)
    if (!isValidGiveaway) return sendMessage(message.channel.id, 'There was no giveaway found with that ID.')

    giveawayID = id
  }

  const giveaway = giveawayID ? giveaways.find(g => g.giveawayID === giveawayID) : giveaways[0]
  if (!giveaway) return console.log('No giveaway found with the command')

  if (!giveaway.allowCommandEntry) {
    const alert = await sendMessage(
      message.channel.id,
      `${message.author.mention}, this giveaway does not allow entry by command.`
    )
    if (alert) deleteMessage(alert, 10)
  }

  const [name, ...roleName] = args
  if (!name) return sendMessage(message.channel.id, 'You did not provide your in game name.')

  if (giveaway.setRoleIDs.length) {
    const role = parseRole(message, roleName.join(' '))
    if (!role) return sendMessage(message.channel.id, 'You did not provide any valid role.')

    if (!giveaway.setRoleIDs.includes(role.id)) {
      const validRoles = giveaway.setRoleIDs.map(id => message.member?.guild.roles.get(id)?.name).filter(r => r)
      return sendMessage(
        message.channel.id,
        `You did not provide a valid role. The valid roles are: **${validRoles.join(', ')}**`
      )
    }

    // Set the users nickname
    await setNickname(message.member, `${name} - ${role.name}`.substring(0, 32))
    // Assign the role to the user
    await addRoleToMember(message.member, role.id)
  } else {
    await setNickname(message.member, args.join(' ').substring(0, 32))
  }

  // Process giveaway entry now.

  // This giveaway has ended.

  // Check if the user has enough coins to enter
  if (giveaway.costToJoin) {
    const settings = await Gamer.database.models.user.findOne({ userID: message.author.id })
    if (!settings)
      return sendMessage(
        giveaway.notificationsChannelID,
        `${message.author.mention}, you did not have enough coins to enter the giveaway. To get more coins, please use the **slots** or **daily** command. To check your balance, you can use the **balance** command.`
      )

    if (giveaway.costToJoin > settings.currency)
      return sendMessage(
        giveaway.notificationsChannelID,
        `${message.author.mention}, you did not have enough coins to enter the giveaway. To get more coins, please use the **slots** or **daily** command. To check your balance, you can use the **balance** command.`
      )

    // Remove the coins from the user
    Gamer.database.models.user
      .findOneAndUpdate({ _id: settings._id }, { currency: settings.currency - giveaway.costToJoin })
      .exec()
  }

  // Check if the user has one of the required roles.
  if (giveaway.requiredRoleIDsToJoin.length) {
    const allowed = giveaway.requiredRoleIDsToJoin.some(id => message.member?.roles.includes(id))
    if (!allowed)
      return sendMessage(
        giveaway.notificationsChannelID,
        `${message.author.mention}, you did not have one of the required roles to enter this giveaway.`
      )
  }

  // Handle duplicate entries
  if (!giveaway.allowDuplicates) {
    const isParticipant = giveaway.participants.some(participant => participant.userID === message.author.id)
    if (isParticipant)
      return sendMessage(
        giveaway.notificationsChannelID,
        `${message.author.mention}, you are already a participant in this giveaway. You have reached the maximum amount of entries in this giveaway.`
      )
  } else if (giveaway.duplicateCooldown) {
    const relevantParticipants = giveaway.participants.filter(participant => participant.userID === message.author.id)
    const latestEntry = relevantParticipants.reduce((timestamp, participant) => {
      if (timestamp > participant.timestamp) return timestamp
      return participant.timestamp
    }, 0)

    const now = Date.now()
    // The user is still on cooldown to enter again
    if (giveaway.duplicateCooldown + latestEntry > now)
      return sendMessage(
        giveaway.notificationsChannelID,
        `${
          message.author.mention
        }, you are not allowed to enter this giveaway again yet. Please wait another **${Gamer.helpers.transform.humanizeMilliseconds(
          giveaway.duplicateCooldown + latestEntry - now
        )}**.`
      )
  }

  Gamer.database.models.giveaway
    .findOneAndUpdate(
      { _id: giveaway._id },
      { participants: [...giveaway.participants, { userID: message.author.id, timestamp: Date.now() }] }
    )
    .exec()

  return sendMessage(
    giveaway.notificationsChannelID,
    `${message.author.mention}, you have been **ADDED** to the giveaway.`
  )
})
