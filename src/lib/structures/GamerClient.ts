import { Client, ClientOptions } from 'yuuko'
import * as i18next from 'i18next'
import i18n from '../../i18next'

export default class GamerClient extends Client {
  // i18n solution
  i18n: Map<string, i18next.TFunction> = new Map()

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
}
