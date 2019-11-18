export interface AmplitudeEvent {
  messageID?: string
  authorID: string
  channelID?: string
  guildID: string
  timestamp: number
  memberID?: string
  commandName?: string
  args?: string[]
  type:
    | 'MESSAGE_CREATE'
    | 'EVENT_CREATED'
    | 'CAPITAL_SPAM_DELETED'
    | 'PROFANITY_DELETED'
    | 'URLS_DELETED'
    | 'ROLE_ADDED'
    | 'ROLE_REMOVED'
    | 'COMMAND_RAN'
    | 'MAIL_CREATE'
}
