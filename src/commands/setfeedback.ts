import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'

export default new Command(`setverify`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  let guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null
  if (!guildSettings) guildSettings = new Gamer.database.models.guild({ id: message.channel.guild.id }) as GuildSettings

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : 'en-US')
  if (!language) return
  // If the user is not an admin cancel out
  if (
    !message.member ||
    !message.member.permission.has('administrator') ||
    (guildSettings.staff.adminRoleID && !message.member.roles.includes(guildSettings.staff.adminRoleID))
  )
    return

  const [type, action] = args
  const isIdea = type.toLowerCase() === `idea`

  // First check the menus that would not need `idea` or `bug`
  switch (type.toLowerCase()) {
    // Create the feedback system if the user types setup
    case 'setup':
      return Gamer.helpers.scripts.createFeedbackSystem(Gamer, language, message.channel.guild, guildSettings)
    case 'logchannel':
      if (!message.channelMentions || !message.channelMentions.length)
        return message.channel.createMessage(language(`settings/setfeedback:NEED_CHANNEL`))

      const [logChannelID] = message.channelMentions
      guildSettings.feedback.logChannelID = logChannelID
      guildSettings.save()

      return message.channel.createMessage(
        language(`settings/setfeedback:LOG_CHANNEL_SET`, { channel: `<#${logChannelID}>` })
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
      const questionToRemove = args.join(` `)

      if (isIdea) {
        const exists = guildSettings.feedback.idea.questions.includes(questionToRemove)
        if (!exists) return message.channel.createMessage(language(`settings/setfeedback:QUESTION_DOESNT_EXIST`))

        guildSettings.feedback.idea.questions.filter(q => q !== questionToRemove)
      } else {
        const exists = guildSettings.feedback.bugs.questions.includes(questionToRemove)
        if (!exists) return message.channel.createMessage(language(`settings/setfeedback:QUESTION_DOESNT_EXIST`))

        guildSettings.feedback.bugs.questions.filter(q => q !== questionToRemove)
      }

      guildSettings.save()
      return message.channel.createMessage(language(`settings/setfeedback:QUESTION_REMOVED`))
  }

  await message.channel.createMessage(language(`settings/feedback:INVALID_USE`))

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return
  return helpCommand.execute(message, [`setfeedback`], context)
})
