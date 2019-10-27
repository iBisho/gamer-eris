import { Command } from 'yuuko'
import * as util from 'util'
import { Message } from 'eris'

const inspectOptions = {
  depth: 1
}

// eslint-disable-next-line
export default new Command(
  ['debug', `eval`],
  async function debug(message, args, context) {
    // Parse out code blocks
    let string = args
      .join(' ')
      .replace(/^\s+/, '')
      .replace(/\s*$/, '')
    if (string.startsWith('```') && string.endsWith('```')) {
      string = string.substring(3, string.length - 3)
      if (string.startsWith('js')) {
        string = string.substr(2)
      }
    }

    // Create a dummy console object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const console: any = {
      // dynamic assignment wooooo
      _lines: [],
      _logger(...things: unknown[]) {
        this._lines.push(...things.join(' ').split('\n'))
      },
      _formatLines() {
        return this._lines.map((line: unknown) => line && `//> ${line}\n`).join('')
      }
    }
    // eslint-disable-next-line no-multi-assign
    console.log = console.error = console.warn = console.info = console._logger.bind(console)

    // Convenience so that I can use `c` and `context` in the eval command
    const c = console
    if (!context) c.log(context)
    // Eval the things and send the results
    let result
    try {
      result = eval(string) // eslint-disable-line no-eval
    } catch (e) {
      result = e
    }
    const msg = `\`\`\`js\n${console._formatLines()}${util.inspect(result, inspectOptions)}\n\`\`\``

    // Send the message
    let outputMsg: Message
    try {
      outputMsg = await message.channel.createMessage(msg)
    } catch (err) {
      message.channel.createMessage(`Error sending message:\n\`\`\`\n${err}\n\`\`\``).catch(() => {})
      return
    }

    // We returned a promise?
    if (result && typeof result.then === 'function') {
      // Sweet. Wait for that to resolve.
      let value
      try {
        value = util.inspect(await result, inspectOptions)
      } catch (err) {
        value = err
      }
      // Now we can edit the message with the promise's resolved result(s).
      const newContent = outputMsg.content.split('\n')
      newContent.splice(-1, 0, '// Resolved to:', value)
      try {
        await outputMsg.edit(newContent.join('\n'))
      } catch (_) {
        newContent.splice(-2, 1, '(content too long)')
        outputMsg.edit(newContent.join('\n')).catch(() => {})
      }
    }
  },
  {
    owner: true
  }
)
