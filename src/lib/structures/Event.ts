export default class Event {
  name: string
  constructor(name: string) {
    this.name = name
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(..._args: unknown[]): Promise<boolean | void> {
    throw 'An event must be executable.'
  }
}
