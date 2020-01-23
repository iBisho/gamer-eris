import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`setfeedback`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings =
    (await Gamer.database.models.guild.findOne({
      id: message.guildID
    })) || (await Gamer.database.models.guild.create({ id: message.guildID }))

  // If the user is not an admin cancel out
  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)
  )
    return

  const [type, action] = args
  if (!type) return helpCommand.process(message, [`setfeedback`], context)

  const isIdea = type.toLowerCase() === `idea`

  // First check the menus that would not need `idea` or `bug`
  switch (type.toLowerCase()) {
    // Create the feedback system if the user types setup
    case 'setup':
      message.channel.createMessage(language(`settings/setfeedback:PATIENCE`))
      await Gamer.helpers.scripts.createFeedbackSystem(message.member.guild, guildSettings)
      return message.channel.createMessage(language(`settings/setfeedback:SETUP`, { mention: message.author.mention }))
    case 'logchannel':
      if (!message.channelMentions || !message.channelMentions.length)
        return message.channel.createMessage(language(`settings/setfeedback:NEED_CHANNEL`))

      const [logChannelID] = message.channelMentions
      guildSettings.feedback.logChannelID = logChannelID
      guildSettings.save()

      return message.channel.createMessage(
        language(`settings/setfeedback:LOG_CHANNEL_SET`, { channel: `<#${logChannelID}>` })
      )
    case 'approvalchannel':
      if (!message.channelMentions || !message.channelMentions.length) {
        guildSettings.feedback.approvalChannelID = undefined
        guildSettings.save()
        return message.channel.createMessage(language(`settings/setfeedback:RESET_CHANNEL`))
      }

      const [approvalChannelID] = message.channelMentions
      guildSettings.feedback.approvalChannelID = approvalChannelID
      guildSettings.save()

      return message.channel.createMessage(
        language(`settings/setfeedback:APPROVAL_CHANNEL_SET`, { channel: `<#${approvalChannelID}>` })
      )
    case 'solvedchannel':
      if (!message.channelMentions || !message.channelMentions.length)
        return message.channel.createMessage(language(`settings/setfeedback:NEED_CHANNEL`))

      const [solvedChannelID] = message.channelMentions
      guildSettings.feedback.solvedChannelID = solvedChannelID
      guildSettings.save()

      return message.channel.createMessage(
        language(`settings/setfeedback:SOLVED_CHANNEL_SET`, { channel: `<#${solvedChannelID}>` })
      )
    case 'rejectedchannel':
      if (!message.channelMentions || !message.channelMentions.length)
        return message.channel.createMessage(language(`settings/setfeedback:NEED_CHANNEL`))

      const [rejectedChannelID] = message.channelMentions
      guildSettings.feedback.rejectedChannelID = rejectedChannelID
      guildSettings.save()

      return message.channel.createMessage(
        language(`settings/setfeedback:REJECTED_CHANNEL_SET`, { channel: `<#${rejectedChannelID}>` })
      )
    case 'solvedmessage':
      args.shift()
      guildSettings.feedback.solvedMessage = args.join(' ')
      guildSettings.save()

      return message.channel.createMessage(language(`settings/setfeedback:SOLVED_MESSAGE_SET`))
    case 'rejectedmessage':
      args.shift()
      guildSettings.feedback.rejectedMessage = args.join(' ')
      guildSettings.save()

      return message.channel.createMessage(language(`settings/setfeedback:REJECTED_MESSAGE_SET`))
  }

  const currentChannelID = isIdea ? guildSettings.feedback.idea.channelID : guildSettings.feedback.bugs.channelID

  if (!action) return helpCommand.process(message, [`setfeedback`], context)
  // These menus require the user type .setfeedback `idea` or `bug`
  switch (action.toLowerCase()) {
    case 'channel':
      if (currentChannelID)
        return message.channel.createMessage(
          language(`settings/setfeedback:ALREADY_ENABLED`, { channel: `<#${currentChannelID}>` })
        )

      if (!message.channelMentions || !message.channelMentions.length)
        return message.channel.createMessage(language(`settings/setfeedback:NEED_CHANNEL`))

      const [channelID] = message.channelMentions

      if (isIdea) guildSettings.feedback.idea.channelID = channelID
      else guildSettings.feedback.bugs.channelID = channelID

      guildSettings.save()
      return message.channel.createMessage(language(`settings/setfeedback:CHANNEL_SET`, { channel: `<#${channelID}>` }))
    case 'disable':
      if (!currentChannelID) return message.channel.createMessage(language(`settings/setfeedback:ALREADY_DISABLED`))

      if (isIdea) guildSettings.feedback.idea.channelID = undefined
      else guildSettings.feedback.bugs.channelID = undefined

      guildSettings.save()
      return message.channel.createMessage(language(`settings/setfeedback:DISABLED`))
    case 'addquestion':
      args.shift()
      args.shift()
      if (!args.length) break
      const question = args.join(` `)

      if (isIdea) {
        const exists = guildSettings.feedback.idea.questions.includes(question)
        if (exists) return message.channel.createMessage(language(`settings/setfeedback:QUESTION_ALREADY_EXISTS`))

        guildSettings.feedback.idea.questions.push(question)
      } else {
        const exists = guildSettings.feedback.bugs.questions.includes(question)
        if (exists) return message.channel.createMessage(language(`settings/setfeedback:QUESTION_ALREADY_EXISTS`))

        guildSettings.feedback.bugs.questions.push(question)
      }

      guildSettings.save()
      return message.channel.createMessage(language(`settings/setfeedback:QUESTION_ADDED`))
    case 'removequestion':
      args.shift()
      args.shift()
      if (!args.length) break
      const questionToRemove = args.join(` `)

      if (isIdea) {
        const exists = guildSettings.feedback.idea.questions.includes(questionToRemove)
        if (!exists) return message.channel.createMessage(language(`settings/setfeedback:QUESTION_DOESNT_EXIST`))

        guildSettings.feedback.idea.questions = guildSettings.feedback.idea.questions.filter(
          q => q !== questionToRemove
        )
      } else {
        const exists = guildSettings.feedback.bugs.questions.includes(questionToRemove)
        if (!exists) return message.channel.createMessage(language(`settings/setfeedback:QUESTION_DOESNT_EXIST`))

        guildSettings.feedback.bugs.questions = guildSettings.feedback.bugs.questions.filter(
          q => q !== questionToRemove
        )
      }

      guildSettings.save()
      return message.channel.createMessage(language(`settings/setfeedback:QUESTION_REMOVED`))
  }

  await message.channel.createMessage(language(`settings/setfeedback:INVALID_USE`))

  return helpCommand.process(message, [`setfeedback`], context)
})
