import { Command } from 'yuuko'
import { GuildSettings } from '../lib/types/settings'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GamerLevel } from '../lib/types/gamer'

export default new Command(`levelrole`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || !message.member) return

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
  if (!language) return

  const [type, number, ...idsOrNames] = args
  const levelID = parseInt(number, 10)
  if (!levelID) return
  const guild = message.channel.guild
  const validIDsOrNames = idsOrNames
    .map(id => {
      const validRole =
        guild.roles.get(id) || guild.roles.find(r => r.id === id || r.name.toLowerCase() === id.toLowerCase())
      if (validRole) return validRole.id
      return undefined
    })
    // Filter out any ids or names that were not a valid role
    .filter(id => id)

  const roleIDs = [...message.roleMentions]
  for (const id of validIDsOrNames) if (id) roleIDs.push(id)

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return
  // If no roles were provided then send help command
  if (!roleIDs.length) return helpCommand.execute(message, [`levelrole`], context)

  const levelRoleData = (await Gamer.database.models.level.findOne({
    guildID: message.channel.guild.id,
    level: levelID
  })) as GamerLevel | null

  switch (type.toLowerCase()) {
    case `create`:
      new Gamer.database.models.level({
        level: levelID,
        roleIDs,
        guildID: guild.id,
        authorID: message.author.id
      })
      return message.channel.createMessage(language(`levelrole:CREATED`, { level: levelID }))
    case `add`:
      if (!levelRoleData) return

      levelRoleData.roleIDs = [...levelRoleData.roleIDs, ...roleIDs]
      levelRoleData.save()
      return message.channel.createMessage(language(`leveling/levelrole:ROLES_ADDED`))
    case `remove`:
      if (!levelRoleData) return

      levelRoleData.roleIDs = levelRoleData.roleIDs.filter(id => !roleIDs.includes(id))
      levelRoleData.save()
      return message.channel.createMessage(language(`leveling/levelrole:ROLES_REMOVED`))
  }

  return helpCommand.execute(message, [`levelrole`], context)
})
