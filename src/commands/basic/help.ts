import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'
import Constants from '../../constants/index'

const gifs = [
  { name: 'mirrorcreate', gif: 'https://i.imgur.com/ORLsc42.gif' },
  { name: 'setverify', gif: 'https://i.imgur.com/TZxyAwY.gif' }
]

const categories = [
  { name: `basic`, commands: [`help`, `ping`, `invite`, `server`, `upvote`, `upvotedonate`, `user`] },
  {
    name: `fun`,
    commands: [
      `8ball`,
      `avatar`,
      `baka`,
      `bite`,
      `coinflip`,
      `compliment`,
      `cuddle`,
      `dance`,
      `divorce`,
      `gif`,
      `hug`,
      `kanna`,
      `kiss`,
      `kitten`,
      `lmao`,
      `marry`,
      `mavis`,
      `pat`,
      `poke`,
      `pony`,
      `puppy`,
      `raphtalia`,
      `shopwedding`,
      `slap`,
      `slots`,
      `supernatural`,
      `tickle`,
      `advice`,
      `wisdom`,
      `urban`,
      `zerotwo`
    ]
  },
  {
    name: `leveling`,
    commands: [
      `background`,
      `balance`,
      `boostme`,
      `daily`,
      `leaderboard`,
      `levelrole`,
      `pay`,
      `profile`,
      `xp`,
      `xpreset`,
      `xpresetvoice`
    ]
  },
  {
    name: `settings`,
    commands: [
      `afk`,
      `reset`,
      `setcapital`,
      `setcapture`,
      `setevents`,
      `setfeedback`,
      `sethibye`,
      `setlanguage`,
      `setlogs`,
      `setmail`,
      `setmodlogs`,
      `setmute`,
      `setpermission`,
      `setprefix`,
      `setprofanity`,
      `setstaff`,
      `settag`,
      `settenor`,
      `setverify`,
      `setvoicelogs`,
      `setwhitelisted`,
      `setup`,
      `setxp`,
      `viewprofanity`
    ]
  },
  {
    name: `utility`,
    commands: [`imgur`, `pollcreate`, `pollend`, `pollvote`, `quote`, `reddit`, `setup`, `youtube`]
  },
  { name: `feedback`, commands: [`bugs`, `idea`] },
  {
    name: `roles`,
    commands: [
      `give`,
      `public`,
      `role`,
      `take`,
      `roleinfo`,
      `reactionrolecreate`,
      `reactionroledelete`,
      `reactionroleadd`,
      `reactionroleremove`,
      `reactionroles`,
      `rolemessagecreate`,
      `rolemessagedelete`,
      `rolemessages`,
      `rolesetcreate`,
      `rolesetdelete`,
      `rolesetadd`,
      `rolesetremove`,
      `rolesets`
    ]
  },
  {
    name: `events`,
    commands: [
      `eventadd`,
      `eventadvertise`,
      `eventcreate`,
      `eventdelete`,
      `eventdeny`,
      `eventedit`,
      `eventjoin`,
      `eventkick`,
      `eventleave`,
      `events`,
      `eventshow`,
      `remind`,
      `reminddelete`
    ]
  },
  {
    name: `moderation`,
    commands: [`purge`, `nick`, `ban`, `unban`, `kick`, `mute`, `move`, `note`, `unmute`, `warn`, `modlog`, `reason`]
  },
  { name: `mails`, commands: [`mail`, `label`] },
  {
    name: `vip`,
    commands: [
      `bots`,
      `analyze`,
      `analyzechannel`,
      `listallroles`,
      `memberrole`,
      `members`,
      `vipregister`,
      `resetanalyze`,
      `roletoall`,
      `rolefromall`,
      `spy`,
      `export`
    ]
  },
  { name: `network`, commands: [`networkcreate`, `networkfollow`, `mirrorcreate`, `mirroredit`] },
  { name: `gaming`, commands: [`twitch`, `capture`, `dice`] },
  { name: `embedding`, commands: [`embed`, `embedshow`, `embededit`, `embedset`] },
  { name: `emojis`, commands: [`emojis`, `emojicreate`, `emojidelete`] },
  { name: `tags`, commands: [`tags`, `tagcreate`, `tagdelete`, `tagshow`, `taginstall`, `taguninstall`, `tagpublic`] },
  { name: `shortcuts`, commands: [`shortcutcreate`, `shortcutremove`, `shortcuts`] },
  { name: `weeb`, commands: [`manga`] }
]

export default new Command([`help`, `h`, `commands`, `cmds`], async (message, args, context) => {
  // Gamers goal is to increase activity in a server not in a DM.
  if (!message.guildID) return message.channel.createMessage(`Please use this command in a server. Thank you!`)

  const Gamer = context.client as GamerClient
  const settings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  const language = Gamer.getLanguage(message.guildID)

  const prefix = settings?.prefix || Gamer.prefix
  const FEATURES = language(`basic/help:FEATURES`, { prefix })
  const VIPFEATURES = language(`basic/help:VIPFEATURES`, { prefix })
  const CHECKWIKI = language(`basic/help:CHECK_WIKI`)
  const LINKSVALUE = language(`basic/help:LINKS_VALUE`)

  const [commandName] = args

  if (!commandName) {
    // Create the main help embed
    const embed = new MessageEmbed()
      .setAuthor(message.author.username, message.author.avatarURL)
      .addField(language(`basic/help:MOST_USED`), FEATURES)
      .addField(language(`basic/help:SEE_ALL`), CHECKWIKI)
      .addField(language(`basic/help:LINKS`), LINKSVALUE)

    if (settings?.vip.isVIP) embed.addField(language(`basic/help:VIP_FEATURES`), VIPFEATURES)

    return message.channel.createMessage({ embed: embed.code })
  }

  // if (commandName.toLowerCase() === `details`) {
  //   const details = new MessageEmbed().setAuthor(message.author.username, message.author.avatarURL)
  //   let description = ''
  //   let first = true

  //   for (const category of categories) {
  //     const categoryDetail = `${first ? '' : '\n'}**» ${Gamer.helpers.transform.splitCamelCase(category.name)}**:\n`
  //     if (first) first = false

  //     if (description.length + categoryDetail.length > 2000) {
  //       details.setDescription(description)
  //       await message.channel.createMessage({ embed: details.code })
  //       description = ''
  //     }

  //     description += categoryDetail

  //     for (const name of category.commands) {
  //       const detail = `\`${Gamer.helpers.transform.splitCamelCase(name)}\`: ${language(
  //         `${category.name}/${name}:DESCRIPTION`
  //       )}\n`

  //       if (description.length + detail.length > 2000) {
  //         details.setDescription(description)
  //         await message.channel.createMessage({ embed: details.code })
  //         description = ''
  //       }

  //       description += detail
  //     }
  //   }

  //   details.setDescription(description)
  //   return message.channel.createMessage({ embed: details.code })
  // }

  if (commandName.toLowerCase() === `all`) {
    const allEmbed = new MessageEmbed().setAuthor(message.author.username, message.author.avatarURL)
    for (const category of categories) {
      allEmbed.addField(
        `**» ${Gamer.helpers.transform.splitCamelCase(category.name)}**:`,
        `\`${category.commands.map(name => Gamer.helpers.transform.splitCamelCase(name)).join('`, `')}\``
      )
    }
    return message.channel.createMessage({ embed: allEmbed.code })
  }

  const command = Gamer.commandForName(commandName)
  if (!command)
    return Gamer.helpers.discord.embedResponse(message, language(`basic/help:UNKNOWN`, { name: commandName }))

  const name = command.names[0]?.toLowerCase()
  const category = categories.find(c => c.commands.includes(name!)) || { name: `basic` }

  // The 1 and 2 vars are for shortcutcreate help
  const EXTENDED = language(`${category.name}/${name}:EXTENDED`, { prefix, 1: `{{1}}`, 2: `{{2}}` })
  const USAGE = language(`${category.name}/${name}:USAGE`, { prefix })
  const ALIASES = language(`${category.name}/${name}:ALIASES`, { prefix })
  const NO_EXTENDED = language('basic/help:NO_EXTENDED')

  const embed = new MessageEmbed()
    .setAuthor(
      language('basic/help:AUTHOR', { commandName: name }),
      Gamer.user.avatarURL,
      Constants.general.gamerServerInvite
    )
    .setDescription(EXTENDED || NO_EXTENDED)
    .addField(language('basic/help:MAIN_USAGE'), USAGE, true)
    .addField(language('basic/help:MAIN_ALIASES'), ALIASES, true)
    .addField(language('basic/help:MORE'), Constants.general.gamerServerInvite)

  const data = gifs.find(g => g.name === name)
  if (data) embed.setImage(data.gif)

  return message.channel.createMessage({ embed: embed.code })
})
