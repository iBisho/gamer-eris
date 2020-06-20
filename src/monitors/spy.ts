import Monitor from '../lib/structures/Monitor'
import { Message } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'
import { sendDirectMessage } from '../lib/utils/eris'

export default class extends Monitor {
  async execute(message: Message, Gamer: GamerClient) {
    if (!message.member) return
    const guild = message.member.guild
    const language = Gamer.getLanguage(guild.id)

    message.content
      .toLowerCase()
      .split(' ')
      .forEach(word => {
        const records = Gamer.spyRecords.get(word)
        if (!records) return

        const embed = new MessageEmbed()
          .setAuthor(word, message.author.avatarURL)
          .setDescription(message.content)
          .setTimestamp(message.timestamp)
          .addField(
            language('moderation/logs:LINK_TO_MESSAGE'),
            `[${language('moderation/logs:CLICK_HERE')}](https://discordapp.com/channels/${message.guildID}/${
              message.channel.id
            }/${message.id})`
          )
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          .setThumbnail(message.member?.guild.iconURL!)

        records.forEach(async userID => {
          // Don't send alerts for messages you send yourself
          if (message.author.id === userID) return

          // Fetch member to make sure the user is in this guild. MUST be before permission check
          const member = await Gamer.helpers.discord.fetchMember(guild, userID)
          if (!member) return

          // Don't send messages if the user doesnt have view channel
          const hasPermission = Gamer.helpers.discord.checkPermissions(message.channel, userID, ['readMessages'])
          if (!hasPermission) return

          sendDirectMessage(userID, {
            embed: embed.code,
            content: `Trigger word found in **${guild.name}** in ${message.channel.mention}`
          })
        })
      })
  }
}
