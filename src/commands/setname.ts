// Credits to Yuuko Core Command
import { Command } from 'yuuko'

export default new Command(
  'setname',
  async (msg, args, context) => {
    try {
      await context.client.editSelf({ username: args.join(' ') })
      await msg.channel.createMessage('Username updated!')
    } catch (err) {
      msg.channel
        .createMessage(`There was an error while changing username.\n\`\`\`\n${err.message}\n\`\`\``)
        .catch(() => undefined)
    }
  },
  {
    owner: true
  }
)
