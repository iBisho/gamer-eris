import { Command } from 'yuuko'
import { PrivateChannel, Message, TextChannel, CategoryChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'
import GamerClient from '../lib/structures/GamerClient'
import { Canvas } from 'canvas-constructor'
import { GamerEmoji } from '../lib/types/database'

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
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const guildSettings =
    ((await Gamer.database.models.guild.findOne({
      id: message.channel.guild.id
    })) as GuildSettings | null) || (new Gamer.database.models.guild({ id: message.channel.guild.id }) as GuildSettings)

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : 'en-US')
  if (!language) return

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
      const role = guildSettings.verify.roleID
        ? message.channel.guild.roles.get(guildSettings.verify.roleID)
        : undefined
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
            await msg.channel.createMessage(language(`verify:INVALID_CAPTCHA_CODE`, { code: captchaCode }))
            // Run the command again for them to generate a new captcha code
            const verifyCommand = Gamer.commandForName(`verify`)
            if (!verifyCommand) return
            verifyCommand.execute(msg, [`end`], context)
            return
          }
          // Success With Captcha

          if (msg.channel instanceof PrivateChannel || !msg.member) return
          const bot = msg.channel.guild.members.get(Gamer.user.id)
          if (!bot) return
          // Remove the verify role
          msg.member.removeRole(role.id)
          if (!guildSettings.verify.discordVerificationStrictnessEnabled && guildSettings.moderation.roleIDs.autorole)
            msg.member.addRole(guildSettings.moderation.roleIDs.autorole)

          // Delete the channel
          if (bot.permission.has('manageChannels')) msg.channel.delete()
        }
      })
    default:
      // Check if welcome is enabled
      if (!guildSettings.verify.enabled)
        return message.channel
          .createMessage(language(`basic/verify:DISABLED`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))
      // Check if a first message is saved
      const firstMessageJSON = guildSettings.verify.firstMessageJSON

      if (!firstMessageJSON)
        return message.channel
          .createMessage(language(`basic/verify:FIRST_MISSING`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))

      // Make a channels name from the users name and removes any invalid characters since discord doesnt support all characters in channel names.
      const channelName = Gamer.helpers.discord.userToChannelName(message.author.username, message.author.discriminator)
      // Check if another channels with that name exists in the verify channels category
      const channelExists = message.channel.guild.channels.find(
        channel =>
          channel.name === channelName.toLowerCase() &&
          channel.parentID === guildSettings.verify.categoryID &&
          channel instanceof TextChannel
      ) as TextChannel

      if (channelExists) {
        // If the channel exists send error
        if (channelExists.id !== message.channel.id)
          message.channel
            .createMessage(language(`basic/verify:ALREADY_STARTED`))
            .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))
        // Send a message in the existing channel to let user know
        return channelExists.createMessage(
          language(message.channel.id === channelExists.id ? `basic/verify:INCORRECT_USAGE` : `basic/verify:USE_THIS`, {
            mention: message.author.mention
          })
        )
      }

      const categoryChannel = guildSettings.verify.categoryID
        ? message.channel.guild.channels.get(guildSettings.verify.categoryID)
        : undefined
      if (!categoryChannel)
        return message.channel
          .createMessage(language(`basic/verify:MISSING_CATEGORY`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))

      if (
        categoryChannel &&
        categoryChannel instanceof CategoryChannel &&
        categoryChannel.channels &&
        categoryChannel.channels.size === 50
      )
        return message.channel
          .createMessage(language(`basic/verify:MAXED`))
          .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))

      const newChannel = await message.channel.guild.createChannel(
        channelName,
        0,
        language(`basic/verify:VERIFY_CHANNEL`),
        categoryChannel.id
      )

      // Convert all the %variables%
      const emojis = (await Gamer.database.models.emoji.find()) as GamerEmoji[]
      const transformed = Gamer.helpers.transform.variables(
        guildSettings.verify.firstMessageJSON,
        message.author,
        message.channel.guild,
        message.author,
        emojis
      )
      // Save the channel so if it becomes inactive we will delete it
      guildSettings.verify.channelIDs.push(newChannel.id)
      guildSettings.save()

      // Delete the command trigger if possible
      const bot = message.channel.guild.members.get(Gamer.user.id)
      if (bot && bot.permission.has(`manageMessages`)) {
        message.delete(language(`basic/verify:TRIGGER_DELETE`))
      }
      const embedCode = JSON.parse(transformed)
      if (typeof embedCode.image === 'string') embedCode.image = { url: embedCode.image }
      embedCode.color = 0x41ebf4
      // send a message to the new channel
      return newChannel.createMessage({ content: message.author.mention, embed: embedCode })
  }
})
