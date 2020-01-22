import Monitor from '../lib/structures/Monitor'
import { Message, TextChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'
// The commented version is for testing on gamer server
// const channelsToPostTweets = [{ name: 'news', id: '450355369475047426' }, { name: 'status', id: '277925597815242762' }, { name: 'esports', id: '447453377358725120' }];
const channelsToPostTweets = [
  { name: `news`, id: `363285672406286337` },
  { name: `status`, id: `370623760073752586` }
]

const tweetReactions: string[] = []

export default class extends Monitor {
  ignoreBots = false
  async execute(message: Message, Gamer: GamerClient) {
    if (!message.author.bot) return

    // Set the reactions because constants arent available when monitors load
    if (!tweetReactions.length) {
      const hug = Gamer.helpers.discord.convertEmoji(constants.emojis.gamerHug, `reaction`)
      const fire = Gamer.helpers.discord.convertEmoji(constants.emojis.gamerOnFire, `reaction`)
      if (hug) tweetReactions.push(hug)
      if (fire) tweetReactions.push(fire)
    }

    if (message.channel.id === `556932464946184222`) return this.sendTweet(message, Gamer, `547703856294002688`)

    // Check if the channel is the vainglory ifttt channel
    if (message.channel.id === `550719233215037440`) {
      const [name, link] = message.content.split(` `)
      // Check if the current shard has the channel based on which vg twitter posted
      const channelData = channelsToPostTweets.find(c => c.name === name)
      if (!channelData) return

      const channel = Gamer.getChannel(channelData.id)
      if (!channel || !(channel instanceof TextChannel)) return

      // If it is a news type and it is a retweet or a reply to another user dont post it
      if (name === `news`) {
        const [embed] = message.embeds
        // If the tweet is a reply to someone
        if (!embed?.description || embed.description.startsWith(`@`)) return
        // If the tweet is a retweet from someone else
        if (!embed.author?.url || embed.author.url !== `https://twitter.com/vainglory`) return
      }

      const sentMessage = await channel.createMessage(link)
      // Add reactions to it
      for (const reaction of tweetReactions) await sentMessage.addReaction(reaction)
    }
  }

  async sendTweet(message: Message, Gamer: GamerClient, channelID: string) {
    const split = message.content.split(` `)
    const channel = Gamer.getChannel(channelID)

    if (!channel || !(channel instanceof TextChannel)) return

    const sentMessage = await channel.createMessage(split[1])
    // Add reactions to it
    for (const reaction of tweetReactions) await sentMessage.addReaction(reaction)
  }
}
