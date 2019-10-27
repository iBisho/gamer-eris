import * as mongoose from 'mongoose'

export interface UserSettings extends mongoose.Document {
  id: string
  profile: {
    backgroundID: number
    theme: string
  }
  afk: {
    enabled: boolean
    message: string
  }
  moderationNetworkEnabled: boolean
  vip: {
    isVIP: boolean
    guildsRegistered: string[]
    openTickets: number
  }
  leveling: {
    xp: number
    level: number
    currency: number
    backgrounds: number[]
    badges: {
      bought: number[]
      equipped: number[]
    }
    badgesUnlocked: number
  }
}

export interface MemberSettings extends mongoose.Document {
  id: string
  nickname: string
  leveling: {
    xp: number
    level: number
    voicexp: number
    voicelevel: number
    joinedVoiceAt: number
    lastUpdatedAt: number
  }
}

export interface GuildSettings extends mongoose.Document {
  id: string
  language: string
  menutime: number
  prefix: string
  antiraid: {
    autoBanNudeBotsEnabled: boolean
    alertsEnabled: boolean
  }
  verify: {
    categoryID: string
    firstMessageJSON: string
    roleID: string
    channelIDs: string[]
    enabled: boolean
    discordVerificationStrictnessEnabled: boolean
  }
  mails: {
    alertRoleIDs: string[]
    blockedUserIDs: string[]
    categoryID: string
    enabled: boolean
    supportChannelID: string
  }
  staff: {
    adminRoleID: string
    modRoleIDs: string[]
  }
  vip: {
    isVIP: boolean
    registeredAt: Date
    userID: string
    logoURLs: string[]
  }
  tags: {
    disabledChannels: string[]
  }
  modules: string[]
  moderation: {
    roleIDs: {
      autorole: string
      public: string[]
      mute: string
    }
    users: {
      mutedUserIDs: string[]
    }
    filters: {
      profanity: {
        words: string[]
        strictWords: string[]
        enabled: boolean
      }
      capital: number
      url: {
        enabled: boolean
        roleIDs: string[]
        channelIDs: string[]
        userIDs: string[]
        urls: string[]
      }
    }
    logs: {
      modlogsChannelID: string
      publiclogsChannelID: string
      serverlogs: {
        ignoredRoleIDs: string[]
        ignoredChannelIDs: string[]
        roles: {
          channelID: string
          createPublicEnabled: boolean
          deletePublicEnabled: boolean
          updatePublicEnabled: boolean
          memberPublicEnabled: boolean
        }
        members: {
          channelID: string
          addPublicEnabled: boolean
          removePublicEnabled: boolean
          nicknamePublicEnabled: boolean
        }
        bot: {
          channelID: string
        }
        messages: {
          channelID: string
          deletedPublicEnabled: boolean
          editedPublicEnabled: boolean
        }
        emojis: {
          channelID: string
          createPublicEnabled: boolean
          deletePublicEnabled: boolean
          updatePublicEnabled: boolean
        }
        channels: {
          channelID: string
          createPublicEnabled: boolean
          deletePublicEnabled: boolean
          updatePublicEnabled: boolean
        }
      }
    }
  }
  hibye: {
    welcome: {
      channelID: string
      dmEnabled: boolean
      dmOnly: boolean
      message: string
    }
    goodbye: {
      channelID: string
      dmEnabled: boolean
      dmOnly: boolean
      message: string
    }
  }
  feedback: {
    logChannelID: string
    solvedChannelID: string
    rejectedChannelID: string
    solvedMessage: string
    rejectedMessage: string
    idea: {
      channelID: string
      emojis: {
        down: string
        up: string
        questions: string[]
      }
    }
    bugs: {
      channelID: string
      emojis: {
        down: string
        up: string
        questions: string[]
      }
    }
  }
  eventsAdvertiseChannelID: string
  twitch: {
    current: number
    max: number
    offlineAlertsEnabled: boolean
  }
  xp: {
    perMessage: number
    perMinutesInVoice: number
    channelID: string
    inactiveDaysAllowed: number
    daily: number
    prizes: {
      first: string
      second: string
      third: string
    }
  }
}