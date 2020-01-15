import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import Constants from '../constants/index'

const categories = [
  { name: `basic`, commands: [`help`, `ping`, `invite`, `server`, `user`] },
  {
    name: `fun`,
    commands: [
      `8ball`,
      `avatar`,
      `baka`,
      `coinflip`,
      `compliment`,
      `cuddle`,
      `divorce`,
      `gif`,
      `hug`,
      `kanna`,
      `kiss`,
      `kitten`,
      `lmao`,
      `marry`,
      `pat`,
      `poke`,
      `pony`,
      `puppy`,
      `shopwedding`,
      `slap`,
      `slots`,
      `supernatural`,
      `tickle`,
      `advice`,
      `wisdom`,
      `urban`
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
      `setverify`,
      `setfeedback`,
      `setprofanity`,
      `setcapital`,
      `setwhitelisted`,
      `setmodlogs`,
      `setstaff`,
      `setlanguage`,
      `setprefix`,
      `setmail`,
      `setcapture`,
      `setlogs`,
      `setmute`,
      `setevents`,
      `settenor`,
      `viewprofanity`
    ]
  },
  { name: `utility`, commands: [`imgur`, `quote`] },
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
      `eventshow`
    ]
  },
  {
    name: `moderation`,
    commands: [`purge`, `nick`, `ban`, `unban`, `kick`, `mute`, `unmute`, `warn`, `modlog`, `reason`]
  },
  { name: `mails`, commands: [`mail`, `label`] },
  { name: `vip`, commands: [`vipregister`, `roletoall`, `export`] },
  { name: `network`, commands: [`networkcreate`, `networkfollow`] },
  { name: `gaming`, commands: [`twitch`, `capture`] },
  { name: `embedding`, commands: [`embed`, `embedshow`, `embededit`] },
  { name: `emojis`, commands: [`emojis`, `emojicreate`, `emojidelete`] },
  { name: `tags`, commands: [`tagcreate`, `tagdelete`, `tagshow`, `taginstall`, `taguninstall`, `tagpublic`] },
  { name: `shortcuts`, commands: [`shortcutcreate`, `shortcutremove`, `shortcuts`] }
]

export default new Command([`help`, `h`, `commands`, `cmds`], async (message, args, context) => {
  // Gamers goal is to increase activity in a server not in a DM.
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel)
    return message.channel.createMessage(`Please use this command in a server. Thank you!`)

  const Gamer = context.client as GamerClient
  const settings = await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })

  const language = Gamer.getLanguage(message.channel.guild.id)

  const prefix = settings?.prefix || Gamer.prefix
  const FEATURES = language(`basic/help:FEATURES`, { prefix })
  const VIPFEATURES = language(`basic/help:VIPFEATURES`, { prefix })
  const CHECKWIKI = language(`basic/help:CHECK_WIKI`)
  const LINKSVALUE = language(`basic/help:LINKS_VALUE`)

  if (!args.length) {
    // Create the main help embed
    const embed = new GamerEmbed()
      .setAuthor(message.author.username, message.author.avatarURL)
      .addField(language(`basic/help:MOST_USED`), FEATURES)
      .addField(language(`basic/help:SEE_ALL`), CHECKWIKI)
      .addField(language(`basic/help:LINKS`), LINKSVALUE)

    if (settings?.vip.isVIP) embed.addField(language(`basic/help:VIP_FEATURES`), VIPFEATURES)

    return message.channel.createMessage({ embed: embed.code })
  }

  const [commandName] = args
  if (commandName.toLowerCase() === `all`) {
    const allEmbed = new GamerEmbed().setAuthor(message.author.username, message.author.avatarURL)
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

  const name = command.names[0].toLowerCase()
  const category = categories.find(c => c.commands.includes(name)) || { name: `basic` }

  const EXTENDED = language(`${category.name}/${name}:EXTENDED`, { prefix })
  const USAGE = language(`${category.name}/${name}:USAGE`, { prefix })
  const ALIASES = language(`${category.name}/${name}:ALIASES`, { prefix })
  const NO_EXTENDED = language('basic/help:NO_EXTENDED')

  const embed = new GamerEmbed()
    .setAuthor(
      language('basic/help:AUTHOR', { commandName: name }),
      Gamer.user.avatarURL,
      Constants.general.gamerServerInvite
    )
    .setDescription(EXTENDED || NO_EXTENDED)
    .addField(language('basic/help:MAIN_USAGE'), USAGE, true)
    .addField(language('basic/help:MAIN_ALIASES'), ALIASES, true)
    .addField(language('basic/help:MORE'), Constants.general.gamerServerInvite)

  return message.channel.createMessage({ embed: embed.code })
})
