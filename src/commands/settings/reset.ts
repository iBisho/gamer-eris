import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command(`reset`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient

  // IN DM. User wanting to reset his own settings
  if (!message.member) {
    Gamer.database.models.user.deleteOne({ userID: message.author.id }).exec()
    Gamer.database.models.upvote.deleteOne({ userID: message.author.id }).exec()
    Gamer.database.models.marriage.deleteOne({ authorID: message.author.id }).exec()
    Gamer.database.models.marriage.deleteOne({ spouseID: message.author.id }).exec()
    Gamer.database.models.reminder.deleteMany({ userID: message.author.id }).exec()
    Gamer.database.models.mission.deleteMany({ userID: message.author.id }).exec()
    Gamer.database.models.emoji.deleteMany({ authorID: message.author.id }).exec()
    Gamer.database.models.member.deleteMany({ memberID: message.author.id }).exec()
    // DM has no translations
    return message.channel.createMessage(`All your settings have been removed from the database.`)
  }

  const guildID = message.member.guild.id
  const language = Gamer.getLanguage(guildID)
  // Used in a guild.
  // Only owners can reset
  if (message.member.guild.ownerID !== message.author.id)
    return message.channel.createMessage(language(`settings/reset:OWNER_ONLY`))

  // Let other things like xp and monitors complete before actually removing everything.
  await Gamer.helpers.utils.sleep(2)
  Gamer.database.models.guild.deleteOne({ guildID }).exec()
  Gamer.database.models.analytics.deleteMany({ guildID }).exec()
  Gamer.database.models.command.deleteMany({ guildID }).exec()
  Gamer.database.models.event.deleteMany({ guildID }).exec()
  Gamer.database.models.feedback.deleteMany({ guildID }).exec()
  Gamer.database.models.label.deleteMany({ guildID }).exec()
  Gamer.database.models.level.deleteMany({ guildID }).exec()
  Gamer.database.models.mail.deleteMany({ guildID }).exec()
  Gamer.database.models.member
    .deleteMany({ guildID })
    .exec()
    .catch(() => undefined)
  Gamer.database.models.mission.deleteMany({ guildID }).exec()
  Gamer.database.models.modlog.deleteMany({ guildID }).exec()
  Gamer.database.models.reactionRole.deleteMany({ guildID }).exec()
  Gamer.database.models.reminder.deleteMany({ guildID }).exec()
  Gamer.database.models.roleMessages.deleteMany({ guildID }).exec()
  Gamer.database.models.roleset.deleteMany({ guildID }).exec()
  Gamer.database.models.shortcut.deleteMany({ guildID }).exec()
  Gamer.database.models.survey.deleteMany({ guildID }).exec()
  Gamer.database.models.tag.deleteMany({ guildID }).exec()
  Gamer.database.models.tradingCard.deleteMany({ guildID }).exec()

  // Remove data from cache as well
  Gamer.guildPrefixes.delete(guildID)
  Gamer.guildLanguages.delete(guildID)
  Gamer.guildSupportChannelIDs.delete(guildID)
  Gamer.guildsDisableTenor.delete(guildID)
  Gamer.guildsXPPerMessage.delete(guildID)
  Gamer.guildsXPPerMinuteVoice.delete(guildID)
  Gamer.vipGuildIDs.delete(guildID)
  Gamer.guildCommandPermissions.forEach((_value, key) =>
    key.startsWith(guildID) ? Gamer.guildCommandPermissions.delete(guildID) : undefined
  )

  const [mangaSubs, twitchSubs] = await Promise.all([
    Gamer.database.models.manga.find(),
    Gamer.database.models.subscription.find()
  ])

  // Reset manga alerts
  mangaSubs.forEach(manga => {
    if (!manga.subs.find(sub => sub.guildID === guildID)) return

    manga.subs = manga.subs.filter(sub => sub.guildID !== guildID)
    manga.save()
  })

  // Reset subscriptions
  twitchSubs.forEach(twitch => {
    if (!twitch.subs.find(sub => sub.guildID === guildID)) return

    twitch.subs = twitch.subs.filter(sub => sub.guildID !== guildID)
    twitch.save()
  })

  return message.channel.createMessage(language(`settings/reset:GUILD_RESET`))
})
