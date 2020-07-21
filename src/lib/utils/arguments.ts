import { Message } from 'eris'

export function parseRole(message: Message, arg: string) {
  const guild = message.member?.guild
  if (!guild) return

  if (arg.startsWith('<@&')) arg = arg.substring(2, arg.length - 1)

  if (guild.roles.has(arg)) return guild.roles.get(arg)

  return guild.roles.find(role => role.name.toLowerCase() === arg.toLowerCase())
}
