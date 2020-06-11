import GamerClient from '../../lib/structures/GamerClient'
import { Command } from 'yuuko'
import { PollcreateCollectorData } from '../../lib/types/gamer'
import { deleteMessage } from '../../lib/utils/eris'
import { MessageEmbed } from 'helperis'
import constants from '../../constants'
import { TextChannel } from 'eris'

export default new Command(['pollcreate', 'pc'], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.member.guild.id)
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.member.guild.id })
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings))
    return message.channel.createMessage(language('common:NOT_MOD_OR_ADMIN'))

  // What question do you wish to ask the user?
  const questionMessage = await message.channel.createMessage(
    language(args.length ? 'utility/pollcreate:NEED_OPTION' : 'utility/pollcreate:NEED_QUESTION', {
      mention: message.author.mention,
      number: 1
    })
  )

  return Gamer.collectors.set(message.author.id, {
    authorID: message.author.id,
    channelID: message.channel.id,
    createdAt: Date.now(),
    guildID: message.member.guild.id,
    data: {
      question: args.length ? args.join(' ') : 'Is Gamer your favorite bot?',
      options: [],
      duration: 0,
      maxVotes: 1,
      allowedRoleIDs: [],
      resultsChannelID: message.channel.id,
      step: args.length ? 2 : 1
    },
    callback: async (msg, collector) => {
      if (!msg.member) return

      const CANCEL_OPTIONS = language('common:CANCEL_OPTIONS', { returnObjects: true })
      if (CANCEL_OPTIONS.includes(msg.content.toLowerCase())) {
        deleteMessage(questionMessage)
        deleteMessage(msg)
        return msg.channel.createMessage(language('utility/pollcreate:CANCELLED'))
      }

      // If a image but no text was posted try again
      if (!msg.content) {
        return Gamer.collectors.set(msg.author.id, collector)
      }

      const SKIP_OPTIONS = language('common:SKIP_OPTIONS', { returnObjects: true })
      const data = collector.data as PollcreateCollectorData
      switch (data.step) {
        case 1:
          data.question = msg.content
          data.step = 2
          questionMessage.edit(
            language('utility/pollcreate:NEED_OPTION', {
              number: data.options.length + 1,
              mention: msg.author.mention
            })
          )
          break
        case 2:
          if (SKIP_OPTIONS.includes(msg.content.toLowerCase())) {
            if (data.options.length < 2) {
              msg.channel
                .createMessage(
                  language('utility/pollcreate:NEED_2_OPTIONS', {
                    amount: data.options.length,
                    mention: msg.author.mention
                  })
                )
                .then(m => setTimeout(() => m.delete().catch(() => undefined)))
              break
            }

            // User wishes to go to next step
            data.step = 3
            questionMessage.edit(language('utility/pollcreate:NEED_DURATION', { mention: msg.author.mention }))
            break
          }

          // Use provided a option
          data.options.push(msg.content)
          questionMessage.edit(
            language('utility/pollcreate:OPTION_ADDED', {
              current: data.options.length,
              number: data.options.length + 1,
              mention: msg.author.mention
            })
          )
          // A message can only have 20 reactions at max
          if (data.options.length === 20) data.step = 3
          break
        case 3:
          if (SKIP_OPTIONS.includes(msg.content.toLowerCase())) {
            data.step = 4
            questionMessage.edit(language('utility/pollcreate:NO_DURATION', { mention: msg.author.mention }))
          }

          const duration = Gamer.helpers.transform.stringToMilliseconds(msg.content)
          if (!duration) {
            message.channel
              .createMessage(language('utility/pollcreate:INVALID_DURATION', { mention: msg.author.mention }))
              .then(m => deleteMessage(m, 10))
            break
          }

          data.duration = duration
          data.step = 4
          questionMessage.edit(
            language('utility/pollcreate:DURATION', {
              mention: msg.author.mention,
              duration: msg.content
            })
          )
          break
        case 4:
          const number = Number(msg.content)
          if (!number) {
            message.channel
              .createMessage(language('utility/pollcreate:INVALID_NUMBER', { mention: msg.author.mention }))
              .then(m => deleteMessage(m, 10))
            break
          }

          data.maxVotes = number
          data.step = 5
          questionMessage.edit(language('utility/pollcreate:REQUIRE_ROLES', { mention: msg.author.mention }))
          break
        case 5:
          if (SKIP_OPTIONS.includes(msg.content.toLowerCase())) {
            data.step = 6
            questionMessage.edit(language('utility/pollcreate:RESULTS_CHANNEL', { mention: msg.author.mention }))
            break
          }

          const role =
            msg.member.guild.roles.get(msg.roleMentions.length ? msg.roleMentions[0] : msg.content) ||
            msg.member.guild.roles.find(r => r.name.toLowerCase() === msg.content.toLowerCase())

          if (!role) {
            message.channel
              .createMessage(language('utility/pollcreate:INVALID_ROLE', { mention: msg.author.mention }))
              .then(m => deleteMessage(m, 10))
            break
          }

          data.allowedRoleIDs.push(role.id)
          questionMessage.edit(language('utility/pollcreate:ROLE_ADDED', { mention: msg.author.mention }))
          break
        case 6:
          const [resultsChannelID] = msg.channelMentions
          if (!resultsChannelID) {
            msg.channel
              .createMessage(language('utility/pollcreate:INVALID_CHANNEL', { mention: msg.author.mention }))
              .then(m => deleteMessage(m, 10))
            break
          }

          const resultsChannel = msg.member.guild.channels.get(resultsChannelID)
          if (!resultsChannel) {
            msg.channel
              .createMessage(language('utility/pollcreate:INVALID_CHANNEL', { mention: msg.author.mention }))
              .then(m => deleteMessage(m, 10))
            break
          }

          data.resultsChannelID = resultsChannelID
          data.step = 7
          questionMessage.edit(language('utility/pollcreate:POST_CHANNEL', { mention: msg.author.mention }))
          break
        case 7:
          const [channelID] = msg.channelMentions
          if (!channelID) {
            message.channel
              .createMessage(language('utility/pollcreate:INVALID_CHANNEL', { mention: msg.author.mention }))
              .then(m => deleteMessage(m, 10))
            break
          }

          // Do we have permissions in this channel
          const channel = msg.member.guild.channels.get(channelID)
          if (!channel) break

          if (
            !Gamer.helpers.discord.checkPermissions(channel, Gamer.user.id, [
              'readMessages',
              'sendMessages',
              'embedLinks',
              'addReactions',
              'readMessageHistory',
              'externalEmojis'
            ])
          ) {
            message.channel
              .createMessage(
                language('utility/pollcreate:MISSING_PERMS', { mention: msg.author.mention, channel: channel.mention })
              )
              .then(m => deleteMessage(m, 10))
            break
          }

          // The id is useful for users voting anonymously
          const polls = await Gamer.database.models.poll.find({ guildID: msg.member.guild.id })

          let pollID = 1
          for (const poll of polls) {
            if (pollID <= poll.pollID) pollID = poll.pollID + 1
          }

          // First send the message to the channel
          const embed = new MessageEmbed()
            .setTitle(data.question)
            .setFooter(language('utility/pollcreate:POLL_ID', { id: pollID }))
            .setDescription(data.options.map((opt, index) => `${constants.emojis.letters[index]} ${opt}`).join('\n'))

          const pollMessage = await (channel as TextChannel).createMessage({ embed: embed.code })

          for (let i = 0; i < data.options.length; i++) {
            pollMessage.addReaction(constants.emojis.letters[i])
          }

          // Create the poll in the db
          await Gamer.database.models.poll.create({
            userID: msg.author.id,
            guildID: msg.member.guild.id,
            channelID: pollMessage.channel.id,
            messageID: pollMessage.id,
            question: data.question,
            options: data.options,
            endsAt: data.duration ? Date.now() + data.duration : 0,
            maxVotes: data.maxVotes,
            allowedRoleIDs: data.allowedRoleIDs,
            resultsChannelID: data.resultsChannelID,
            anonymousVotes: [],
            pollID
          })

          message.channel.createMessage(
            language('utility/pollcreate:CREATED', { mention: msg.author.mention, channel: channel.mention })
          )
          deleteMessage(questionMessage)
          deleteMessage(msg)
          return
      }

      deleteMessage(msg)
      Gamer.collectors.set(message.author.id, collector)
      return
    }
  })
})
