import { Command } from 'yuuko'
import * as util from 'util'

const inspectOptions = {
  depth: 1
}

export default new Command(['debug', `eval`], async function debug(message, args, context) {
  if (message.author.id !== '130136895395987456') return

  const string = args
    .join(' ')
    .replace(/^\s+/, '')
    .replace(/\s*$/, '')

  // Allows use of Gamer in the evals
  const Gamer = context.client
  if (!Gamer) return

  // Eval the things and send the results
  let result
  try {
    result = eval(string)
  } catch (e) {
    result = e
  }
  const response = ['```js']

  const regex = new RegExp(Gamer.token, 'gi')
  // We returned a promise?
  if (result && typeof result.then === 'function') {
    // Sweet. Wait for that to resolve.
    let value
    try {
      value = await result
    } catch (err) {
      value = err
    }
    response.push(
      util
        .inspect(value, inspectOptions)
        .replace(regex, 'YOU WISH!')
        .substring(0, 1985)
    )
  } else {
    response.push(
      String(util.inspect(result))
        .replace(regex, 'YOU WISH!')
        .substring(0, 1985)
    )
  }

  response.push('```')

  await message.channel.createMessage(response.join('\n'))
})
