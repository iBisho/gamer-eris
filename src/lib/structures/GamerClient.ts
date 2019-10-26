import { Client, ClientOptions } from 'yuuko'
import * as i18next from 'i18next'
import i18n from '../../i18next'
import { Collector } from '../types/gamer'
import * as glob from 'glob'
import Monitor from './Monitor'
import Database from '../../database/mongodb'
import ProfileHelper from '../utils/profiles'
import DiscordHelper from '../utils/discord'

export default class GamerClient extends Client {
  // i18n solution
  i18n: Map<string, i18next.TFunction> = new Map()

  // Message collectors
  collectors: Map<string, Collector> = new Map()

  database = new Database()

  helpers = {
    profiles: new ProfileHelper(),
    discord: new DiscordHelper()
  }

  // All our stores to store files which we can reload easily.
  monitors: Map<string, Monitor> = new Map()
  // inhibitors: Map<string, Inhibitor> = new Map()
  // finalizers: Map<string, Finalizer> = new Map()
  // functions: Map<string, HelperFunctions> = new Map()
  constructor(options: ClientOptions) {
    super(options)
  }

  async connect() {
    // get i18n ready
    this.i18n = await i18n()
    // Allow easy access to i18n
    this.extendContext({ languages: this.i18n })

    return super.connect()
  }

  // Load the files in a directory.
  addDirectory(dirname: string) {
    if (!dirname.endsWith('/')) dirname += '/'
    const pattern = `${dirname}*.[tj]s`
    const filenames = glob.sync(pattern)
    for (const filename of filenames) {
      delete require.cache[filename]
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      let file = require(filename)
      // Use object.assign to preserve other exports
      file = Object.assign(file.default, file)
      delete file.default
      file.filename = filename

      const name = filename.substring(filename.lastIndexOf('/') + 1)
      // Add to the proper map based on the name of the directory
      if (dirname.endsWith('monitors/')) this.monitors.set(name, new file())
      // else if (dirname.endsWith('inhibitors/')) this.inhibitors.set(name, new file())
      // else if (dirname.endsWith('finalizers/')) this.finalizers.set(name, new file())
      // else if (dirname.endsWith('functions/')) this.functions.set(name, new file())
    }
    return this
  }

  reloadDirectory(dirname: string, map: Map<string, unknown>) {
    // Delete all current items in the map
    map.clear()
    // Reload everything from that directory
    this.addDirectory(dirname)

    return this
  }
}
