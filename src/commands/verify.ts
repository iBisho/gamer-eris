import { Command } from 'yuuko'
import { PrivateChannel, Message } from 'eris'
import { GuildSettings } from '../lib/types/settings'
import GamerClient from '../lib/structures/GamerClient'
// import * as i18next from 'i18next'
import { Canvas } from 'canvas-constructor'
import GuildDefaults from '../constants/settings/guild'

const end = async (message: Message) => {
  if (message.channel instanceof PrivateChannel) return
  // // Check if this is a valid verify channel
  // const foundChannel = guildSettings.verify.channelIDs.includes(message.channel.id)
  // if (!foundChannel)
  //   return message.channel
  //     .createMessage(language(`verify:INVALID_CHANNEL`))
  //     .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))
  // // Make sure the role exists
  // const role = message.channel.guild.roles.get(guildSettings.verify.roleID)
  // if (!guildSettings.verify.roleID || !role)
  //   return message.channel
  //     .createMessage(language(`verify:NO_ROLE`))
  //     .then(msg => setTimeout(() => msg.delete(language(`common:CLEAR_SPAM`)), 10000))

  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  const characters = [...alphabet, ...alphabet.toUpperCase(), ...'0123456789']
  const getRandomCharacters = (amount: number) => {
    let text = ``
    for (let i = 0; i < amount; i++) {
      text += characters[Math.floor(Math.random() * characters.length)]
    }
    return text
  }
  console.log(getRandomCharacters(15))
  const text = []
  const random = []
  for (let i = 0; text.length < 6 || random.length < 6; i++) {
    if (text.length < 6) text.push(characters[Math.floor(Math.random() * characters.length)])
    else random.push(characters[Math.floor(Math.random() * characters.length)])
  }
  console.log(text, random)

  const buffer = new Canvas(400, 100)
    .setColor('#eeeeee')
    .addRect(0, 0, 400, 100)
    .setAntialiasing(`subpixel`)
    .setShadowBlur(5)
    .beginPath()
    .setTextFont('60px Arial')
    .rotate(0.01)
    .setStroke('#0088cc')
    .addStrokeText(random.join(''), 115, 70)
    .beginPath()
    .setTextFont('60px Arial')
    .rotate(0.03)
    .setStroke('#0088cc')
    .addStrokeText(random.join(''), 115, 70)
    .setColor('#0088cc')
    .setTextFont(`56px LatoBold`)
    .addText(text.join(''), 115, 70)
    .toBuffer()

  //to buffer
  return message.channel.createMessage('Please type the text in the Captcha to unlock access to the server.', {
    file: buffer,
    name: 'captcha.jpg'
  })
  // remove verify role after successful verification process
  // await message.member.roles.remove(roleID)
  // // If the server disabled the discord internal verification add the auto role
  // if (!enforceDiscordVerification && autoAssignRoleID) {
  //   await message.member.roles.add(autoAssignRoleID, language(`verify:REASON`))
  // }

  // Delete the channel
  // if ((message.channel as GuildChannel).deletable) await message.channel.delete()
  // return
}

export default new Command(`verify`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const guildSettings =
    ((await Gamer.database.models.guild.findOne({
      id: message.channel.guild.id
    })) as GuildSettings | null) || GuildDefaults

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : 'en-US')
  if (!language) return

  const content = args.join(` `)
  switch (content) {
    case `end`:
      return end(message)
  }
  return
  // return message.channel.createMessage({ embed: embed.code })
})
