import { Command } from 'yuuko'
import { GamerGiveaway } from '../../database/schemas/giveaway'
import { needMessage, sendMessage } from '../../lib/utils/eris'
import { TextChannel } from 'eris'
import { parseRole, parseChannel } from '../../lib/utils/arguments'
import { milliseconds } from '../../lib/types/enums/time'
import constants from '../../constants'
import { MessageEmbed } from 'helperis'
import Gamer from '../..'

function createUniqueID(giveaways: GamerGiveaway[]) {
  if (giveaways.length < 1) return 1

  let giveawayID = 1

  for (const giveaway of giveaways) if (giveaway.giveawayID >= giveawayID) giveawayID = giveaway.giveawayID + 1

  return giveawayID
}

export default new Command(['giveawaycreate', 'gc'], async (message, args) => {
  if (!message.member) return

  const language = Gamer.getLanguage(message.member.guild.id)
  const CANCEL_OPTIONS = language('common:CANCEL_OPTIONS')

  // If args were provided they are opting for a simple solution
  if (args.length) {
    const [channelID, time, winners, ...title] = args
    const channel = parseChannel(message, channelID)
    if (!channel || !(channel instanceof TextChannel))
      return sendMessage(message.channel.id, language('utility/giveawaycreate:INVALID_CHANNEL'))

    const duration = Gamer.helpers.transform.stringToMilliseconds(time)
    if (!duration) sendMessage(message.channel.id, language('utility/giveawaycreate:DEFAULT_DURATION'))

    const amount = Number(winners)
    if (!amount) sendMessage(message.channel.id, language('utility/giveawaycreate:INVALID_AMOUNT_WINNERS'))

    const embed = new MessageEmbed()
      .setAuthor(
        title.length ? title.join(' ') : language('utility/giveawaycreate:DEFAULT_TITLE'),
        message.member.guild.dynamicIconURL()
      )
      .setDescription(
        [
          language('utility/giveawaycreate:REACT_WITH', { emoji: constants.emojis.giveaway }),
          language('utility/giveawaycreate:AMOUNT_WINNERS', { amount })
        ].join('\n')
      )
      .setThumbnail(message.author.dynamicAvatarURL())
      .setFooter(language('utility/giveawaycreate:ENDS_IN'))
      .setTimestamp(Date.now() + (duration || milliseconds.WEEK))

    if (
      !Gamer.helpers.discord.checkPermissions(channel, Gamer.user.id, [
        'readMessages',
        'sendMessages',
        'embedLinks',
        'addReactions',
        'externalEmojis',
        'readMessageHistory'
      ])
    )
      return sendMessage(message.channel.id, language('utility/giveawaycreate:MISSING_PERMS'))

    const giveaways = await Gamer.database.models.giveaway.find({ guildID: message.member.guild.id })

    const giveawayID = createUniqueID(giveaways)

    const giveawayMessage = await sendMessage(channel.id, {
      content: language('utility/giveawaycreate:SIMPLE_CONTENT'),
      embed: embed.code
    })
    if (!giveawayMessage) return

    const reaction = Gamer.helpers.discord.convertEmoji(constants.emojis.giveaway, 'reaction')
    if (reaction) giveawayMessage?.addReaction(reaction)

    await Gamer.database.models.giveaway.create({
      giveawayID,
      guildID: message.member.guild.id,
      creatorID: message.author.id,
      messageID: giveawayMessage.id,
      channelID: channel.id,
      costToJoin: 100,
      requiredRoleIDsToJoin: [],
      participants: [],
      pickedParticipants: [],
      createdAt: Date.now(),
      duration: duration || milliseconds.WEEK,
      amountOfWinners: amount || 1,
      allowDuplicates: false,
      duplicateCooldown: 0,
      emoji: constants.emojis.giveaway,
      pickWinners: true,
      pickInterval: 0,
      notificationsChannelID: channel.id,
      delayTillStart: 0,
      hasStarted: true,
      hasEnded: false,
      allowCommandEntry: true,
      allowReactionEntry: true,
      simple: true,
      setRoleIDs: []
    })

    return sendMessage(
      message.channel.id,
      language('utility/giveawaycreate:CREATED_SIMPLE', { id: giveawayID, channel: channel.mention })
    )
  }

  if (!Gamer.vipGuildIDs.has(message.member.guild.id))
    return sendMessage(message.channel.id, language('common:NEED_VIP'))

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.member.guild.id })
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings))
    return message.channel.createMessage(language('common:NOT_MOD_OR_ADMIN'))

  // The channel id where this giveaway will occur.

  sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_GIVEAWAY_CHANNEL'))
  const channelResponse = await needMessage(message)
  if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
    return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

  const [channelID] = channelResponse.channelMentions
  const channel = message.member.guild.channels.get(channelID) as TextChannel
  if (!channel) return sendMessage(message.channel.id, language('utility/giveawaycreate:INVALID_CHANNEL'))

  // The message id attached to this giveaway. Will be "" if the only way to enter is command based.

  sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_GIVEAWAY_MESSAGE_ID'))
  const messageResponse = await needMessage(message)
  if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
    return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

  const requestedMessage =
    messageResponse.content !== 'skip'
      ? channel.messages.get(messageResponse.content) ||
        (await channel.getMessage(messageResponse.content).catch(() => undefined))
      : undefined
  if (messageResponse.content !== 'skip' && !requestedMessage)
    sendMessage(message.channel.id, language('utility/giveawaycreate:INVALID_MESSAGE', { channel: channel.mention }))
  if (messageResponse.content === 'skip')
    sendMessage(message.channel.id, language('utility/giveawaycreate:DEFAULT_MESSAGE'))

  // The amount of gamer coins needed to enter.

  sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_COST_TO_JOIN'))
  const costResponse = await needMessage(message)
  if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
    return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

  const costToJoin = Number(costResponse.content)
  if (costResponse.content === 'skip') sendMessage(message.channel.id, language('utility/giveawaycreate:DEFAULT_COST'))

  // The role ids that are required to join. User must have atleast 1.

  sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_REQUIRED_ROLES_TO_JOIN'))
  const requiredRolesResponse = await needMessage(message)
  if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
    return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

  if (requiredRolesResponse.content === 'skip')
    sendMessage(message.channel.id, language('utility/giveawaycreate:DEFAULT_REQUIRED_ROLES'))
  const requiredRoles = requiredRolesResponse.content.split(' ').map(id => parseRole(message, id)?.id)

  // How long is this giveaway going to last for.

  sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_DURATION'))
  const durationResponse = await needMessage(message)
  if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
    return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

  const duration = Gamer.helpers.transform.stringToMilliseconds(durationResponse.content)
  if (!duration) sendMessage(message.channel.id, language('utility/giveawaycreate:DEFAULT_DURATION'))

  // The amount of winners for this giveaway

  sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_AMOUNT_WINNERS'))
  const amountResponse = await needMessage(message)
  if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
    return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

  const amount = Number(amountResponse.content)
  if (amountResponse.content === 'skip' || !amount)
    sendMessage(message.channel.id, language('utility/giveawaycreate:INVALID_AMOUNT_WINNERS'))

  // Whether users are allowed to enter the giveaway multiple times.

  sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_DUPLICATES'))
  const duplicatesResponse = await needMessage(message)
  if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
    return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

  const YES_OPTIONS = language('common:YES_OPTIONS', { returnObjects: true })
  const allowDuplicates = YES_OPTIONS.includes(duplicatesResponse.content)

  // How long does a user need to wait to enter the giveaway again. For example, one time per day.
  let duplicateCooldown = 0

  if (allowDuplicates) {
    sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_DUPLICATE_DURATION'))
    const duplicateDurationResponse = await needMessage(message)
    if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
      return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

    duplicateCooldown = Gamer.helpers.transform.stringToMilliseconds(duplicateDurationResponse.content)!
    if (!duplicateCooldown)
      sendMessage(message.channel.id, language('utility/giveawaycreate:DEFAULT_DUPLICATE_DURATION'))
  }

  // The emoji <:name:id> of the emoji used in this giveaway, if reaction based otherwise ""

  let validEmoji = Gamer.helpers.discord.convertEmoji(constants.emojis.giveaway, `data`)

  if (messageResponse.content !== 'skip') {
    sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_EMOJI'))
    const emojiResponse = await needMessage(message)
    if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
      return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

    if (emojiResponse.content === 'skip')
      sendMessage(
        message.channel.id,
        language('utility/giveawaycreate:DEFAULT_EMOJI', { emoji: constants.emojis.giveaway })
      )
    else {
      validEmoji = Gamer.helpers.discord.convertEmoji(emojiResponse.content, `data`)
    }
  }

  // Whether users picked will be the winners or the losers.

  sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_PICK_WINNERS'))
  const pickWinnersResponse = await needMessage(message)
  if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
    return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

  const pickWinners = YES_OPTIONS.includes(pickWinnersResponse.content)

  // The amount of time to wait before picking the next user.

  sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_PICK_INTERVAL'))
  const pickIntervalResponse = await needMessage(message)
  if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
    return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

  const pickInterval = Gamer.helpers.transform.stringToMilliseconds(pickIntervalResponse.content)
  if (!pickInterval) sendMessage(message.channel.id, language('utility/giveawaycreate:DEFAULT_PICK_INTERVAL'))

  // The channel id where messages will be sent when reaction based like X has joined the giveaway.

  sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_NOTIFICATIONS_CHANNEL'))
  const notificationsChannelResponse = await needMessage(message)
  if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
    return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

  const [notificationsChannelID] = notificationsChannelResponse.channelMentions
  const notificationsChannel = message.member.guild.channels.get(notificationsChannelID) as TextChannel
  if (!notificationsChannel) return sendMessage(message.channel.id, language('utility/giveawaycreate:INVALID_CHANNEL'))

  // The amount of milliseconds to wait before starting this giveaway.

  sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_DELAY_TILL_START'))
  const delayTillStartResponse = await needMessage(message)
  if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
    return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

  const delayTillStart = Gamer.helpers.transform.stringToMilliseconds(delayTillStartResponse.content)
  if (!duplicateCooldown) sendMessage(message.channel.id, language('utility/giveawaycreate:DEFAULT_DELAY_TILL_START'))

  // Whether the giveaway allows entry using commands.

  sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_ALLOW_COMMANDS'))
  const allowCommandsResponse = await needMessage(message)
  if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
    return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

  let allowCommandEntry = YES_OPTIONS.includes(allowCommandsResponse.content)
  let setRoleIDs: string[] = []

  if (allowCommandEntry) {
    // The role ids that are required to join when using the command. This role will be given to the user.

    sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_SET_ROLES'))
    const setRolesResponse = await needMessage(message)
    if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
      return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

    setRoleIDs = setRolesResponse.content.split(' ').map(id => parseRole(message, id)?.id || '')
  }

  let allowReactionEntry = false
  if (requestedMessage) {
    // Whether the giveaway allows entry using reaction entries.
    sendMessage(message.channel.id, language('utility/giveawaycreate:NEED_ALLOW_REACTIONS'))
    const allowReactionsResponse = await needMessage(message)
    if (CANCEL_OPTIONS.includes(channelResponse.content.toLowerCase()))
      return sendMessage(message.channel.id, language('utility/giveawaycreate:CANCELLED'))

    allowReactionEntry = YES_OPTIONS.includes(allowReactionsResponse.content)
  }

  if (!allowCommandEntry && !allowReactionEntry) {
    return sendMessage(message.channel.id, language('utility/giveawaycreate:NO_ENTRY_ALLOWED'))
  }

  const giveaways = await Gamer.database.models.giveaway.find({ guildID: message.member.guild.id })

  const giveawayID = createUniqueID(giveaways)

  await Gamer.database.models.giveaway.create({
    giveawayID,
    guildID: message.member.guild.id,
    creatorID: message.author.id,
    messageID: requestedMessage?.id || '',
    channelID: channel.id,
    costToJoin: costToJoin || 100,
    requiredRoleIDsToJoin: (requiredRoles?.filter(r => r) || []) as string[],
    participants: [],
    pickedParticipants: [],
    createdAt: Date.now(),
    duration: duration || milliseconds.WEEK,
    amountOfWinners: amount || 1,
    allowDuplicates,
    duplicateCooldown: duplicateCooldown || milliseconds.DAY,
    emoji: validEmoji?.fullCode || constants.emojis.giveaway,
    pickWinners,
    pickInterval: pickInterval || 0,
    notificationsChannelID: notificationsChannel.id,
    delayTillStart: delayTillStart || 0,
    hasStarted: Boolean(delayTillStart),
    hasEnded: false,
    allowCommandEntry,
    allowReactionEntry,
    simple: false,
    setRoleIDs: (setRoleIDs?.filter(r => r) || []) as string[]
  })

  if (requestedMessage) {
    const reaction = Gamer.helpers.discord.convertEmoji(validEmoji?.fullCode || constants.emojis.giveaway, 'reaction')
    if (reaction) requestedMessage.addReaction(reaction)
  }

  return sendMessage(
    message.channel.id,
    language('utility/giveawaycreate:CREATED', {
      id: giveawayID,
      time: delayTillStart ? Gamer.helpers.transform.humanizeMilliseconds(delayTillStart) : '0s'
    })
  )
})
