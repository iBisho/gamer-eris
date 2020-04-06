import { Command } from 'yuuko'
import { PrivateChannel, Message, TextChannel, CategoryChannel, GroupChannel } from 'eris'
import GamerClient from '../../lib/structures/GamerClient'
import { Canvas } from 'canvas-constructor'

const createCaptcha = async (message: Message) => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  const characters = [...alphabet, ...alphabet.toUpperCase(), ...'0123456789']
  const getRandomCharacters = (amount: number) => {
    let text = ``
    for (let i = 0; i < amount; i++) {
      text += characters[Math.floor(Math.random() * characters.length)]
    }
    return text
  }

  const text = getRandomCharacters(6)

  const buffer = new Canvas(400, 100)
    .setColor('#eeeeee')
    .addRect(0, 0, 400, 100)
    .setAntialiasing(`subpixel`)
    .setShadowBlur(5)
    .beginPath()
    .setTextFont('60px Arial')
    .rotate(0.01)
    .setStroke('#0088cc')
    .addStrokeText(getRandomCharacters(6), 115, 70)
    .beginPath()
    .setTextFont('60px Arial')
    .rotate(0.03)
    .setStroke('#0088cc')
    .addStrokeText(getRandomCharacters(6), 115, 70)
    .setColor('#0088cc')
    .setTextFont(`56px LatoBold`)
    .addText(text, 115, 70)
    .toBuffer()

  //to buffer
  await message.channel.createMessage('Please type the text in the Captcha to unlock access to the server.', {
    file: buffer,
    name: 'captcha.jpg'
  })

  return text
}

export default new Command(`verify`, async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })
  // If no custom settings verification won't be enabled
  if (!guildSettings) return message.channel.createMessage(language(`basic/verify:DISABLED`))

  const content = args.join(` `)
  switch (content) {
    case `end`:
      // Check if this is a valid verify channel
      const foundChannel = guildSettings.verify.channelIDs.includes(message.channel.id)
      if (!foundChannel)
        return message.channel
          .createMessage(language(`basic/verify:INVALID_CHANNEL`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))
      // Make sure the role exists
      const role = guildSettings.verify.roleID ? message.member.guild.roles.get(guildSettings.verify.roleID) : undefined
      if (!guildSettings.verify.roleID || !role)
        return message.channel
          .createMessage(language(`basic/verify:NO_ROLE`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))

      // Generate and ask the user for the captcha code
      const captchaCode = await createCaptcha(message)
      // Create a collector listening for the users response
      return Gamer.collectors.set(message.author.id, {
        authorID: message.author.id,
        channelID: message.channel.id,
        createdAt: Date.now(),
        guildID: (message.channel as TextChannel).guild.id,
        data: {},
        callback: async msg => {
          // The text did not match so it cancel out
          if (msg.content !== captchaCode) {
            await Gamer.helpers.discord.embedResponse(
              msg,
              language(`basic/verify:INVALID_CAPTCHA_CODE`, { code: captchaCode })
            )
            // Run the command again for them to generate a new captcha code
            const verifyCommand = Gamer.commandForName(`verify`)
            if (!verifyCommand) return
            verifyCommand.process(msg, [`end`], context)
            return
          }
          // Success With Captcha

          if (msg.channel instanceof PrivateChannel || msg.channel instanceof GroupChannel || !msg.member) return
          const bot = await Gamer.helpers.discord.fetchMember(msg.channel.guild, Gamer.user.id)
          if (!bot) return
          // Remove the verify role
          msg.member.removeRole(role.id)
          Gamer.amplitude.push({
            authorID: msg.author.id,
            channelID: msg.channel.id,
            guildID: msg.channel.guild.id,
            messageID: msg.id,
            timestamp: msg.timestamp,
            memberID: msg.member.id,
            type: 'ROLE_REMOVED'
          })

          if (!guildSettings.verify.discordVerificationStrictnessEnabled && guildSettings.moderation.roleIDs.autorole) {
            msg.member.addRole(guildSettings.moderation.roleIDs.autorole)
            Gamer.amplitude.push({
              authorID: msg.author.id,
              channelID: msg.channel.id,
              guildID: msg.channel.guild.id,
              messageID: msg.id,
              timestamp: msg.timestamp,
              memberID: msg.member.id,
              type: 'ROLE_ADDED'
            })
          }

          // Delete the channel
          if (bot.permission.has('manageChannels')) msg.channel.delete()
        }
      })
    default:
      // Check if welcome is enabled
      if (!guildSettings.verify.enabled)
        return message.channel
          .createMessage(language(`basic/verify:DISABLED`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)).catch(() => undefined), 10000))
      // Check if a first message is saved
      const firstMessageJSON = guildSettings.verify.firstMessageJSON

      if (!firstMessageJSON)
        return message.channel
          .createMessage(language(`basic/verify:FIRST_MISSING`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)).catch(() => undefined), 10000))

      // Make a channels name from the users name and removes any invalid characters since discord doesnt support all characters in channel names.
      const channelName = Gamer.helpers.discord.userToChannelName(message.author.username, message.author.discriminator)
      // Check if another channels with that name exists in the verify channels category
      const channelExists = message.member.guild.channels.find(
        channel => channel.name === channelName.toLowerCase() && channel.parentID === guildSettings.verify.categoryID
      )

      if (channelExists && channelExists instanceof TextChannel) {
        // If the channel exists send error
        if (channelExists.id !== message.channel.id)
          message.channel
            .createMessage(language(`basic/verify:ALREADY_STARTED`))
            .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)).catch(() => undefined), 10000))
        // Send a message in the existing channel to let user know
        return channelExists.createMessage(
          language(message.channel.id === channelExists.id ? `basic/verify:INCORRECT_USAGE` : `basic/verify:USE_THIS`, {
            mention: message.author.mention
          })
        )
      }

      const categoryChannel = guildSettings.verify.categoryID
        ? message.member.guild.channels.get(guildSettings.verify.categoryID)
        : undefined
      if (!categoryChannel || !(categoryChannel instanceof CategoryChannel))
        return message.channel
          .createMessage(language(`basic/verify:MISSING_CATEGORY`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)).catch(() => undefined), 10000))

      if (categoryChannel && categoryChannel.channels && categoryChannel.channels.size === 50)
        return message.channel
          .createMessage(language(`basic/verify:MAXED`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)).catch(() => undefined), 10000))

      const newChannel = await message.member.guild.createChannel(channelName, 0, {
        reason: language(`basic/verify:VERIFY_CHANNEL`),
        parentID: categoryChannel.id
      })
      newChannel.editPermission(message.author.id, 1024, 0, `member`)

      // Convert all the %variables%
      const emojis = await Gamer.database.models.emoji.find()
      const transformed = await Gamer.helpers.transform.variables(
        guildSettings.verify.firstMessageJSON,
        message.author,
        message.member.guild,
        message.author,
        emojis
      )
      // Save the channel so if it becomes inactive we will delete it
      guildSettings.verify.channelIDs.push(newChannel.id)
      guildSettings.save()

      // Delete the command trigger if possible
      const bot = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
      if (bot && bot.permission.has(`manageMessages`)) {
        message.delete(language(`basic/verify:TRIGGER_DELETE`)).catch(() => undefined)
      }
      const embedCode = JSON.parse(transformed)
      if (typeof embedCode.image === 'string') embedCode.image = { url: embedCode.image }
      if (!embedCode.color) embedCode.color = 0x41ebf4
      // send a message to the new channel
      return newChannel.createMessage({ content: message.author.mention, embed: embedCode })
  }
})
