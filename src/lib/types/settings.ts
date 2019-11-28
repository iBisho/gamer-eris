import mongoose from 'mongoose'

export interface UserSettings extends mongoose.Document {
  id: string
  userID: string
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
    boosts: Boost[]
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
  network: {
    guildID?: string
  }
}

export interface Boost {
  name: string
  timestamp?: number
  multiplier: number
  active: boolean
  activatedAt?: number
}

export interface MemberSettings extends mongoose.Document {
  id: string
  guildID: string
  memberID: string
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
    categoryID: string | undefined
    firstMessageJSON: string
    roleID: string | undefined
    channelIDs: string[]
    enabled: boolean
    discordVerificationStrictnessEnabled: boolean
  }
  mails: {
    alertRoleIDs: string[]
    blockedUserIDs: string[]
    categoryID: string | undefined
    enabled: boolean
    supportChannelID: string | undefined
  }
  staff: {
    adminRoleID: string | undefined
    modRoleIDs: string[]
  }
  vip: {
    isVIP: boolean
    registeredAt: number
    userID: string | undefined
    logoURLs: string[]
  }
  tags: {
    disabledChannels: string[]
  }
  modules: string[]
  moderation: {
    roleIDs: {
      autorole?: string
      public: string[]
      mute?: string
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
      modlogsChannelID: string | undefined
      publiclogsChannelID: string | undefined
      serverlogs: {
        ignoredRoleIDs: string[]
        ignoredChannelIDs: string[]
        roles: {
          channelID: string | undefined
          createPublicEnabled: boolean
          deletePublicEnabled: boolean
          updatePublicEnabled: boolean
          memberPublicEnabled: boolean
        }
        members: {
          channelID: string | undefined
          addPublicEnabled: boolean
          removePublicEnabled: boolean
          nicknamePublicEnabled: boolean
        }
        bot: {
          channelID: string | undefined
        }
        messages: {
          channelID: string | undefined
          deletedPublicEnabled: boolean
          editedPublicEnabled: boolean
        }
        emojis: {
          channelID: string | undefined
          createPublicEnabled: boolean
          deletePublicEnabled: boolean
          updatePublicEnabled: boolean
        }
        channels: {
          channelID: string | undefined
          createPublicEnabled: boolean
          deletePublicEnabled: boolean
          updatePublicEnabled: boolean
        }
      }
    }
  }
  hibye: {
    welcome: {
      channelID: string | undefined
      dmEnabled: boolean
      dmOnly: boolean
      message: string
    }
    goodbye: {
      channelID: string | undefined
      dmEnabled: boolean
      dmOnly: boolean
      message: string
    }
  }
  feedback: {
    logChannelID: string | undefined
    solvedChannelID: string | undefined
    rejectedChannelID: string | undefined
    solvedMessage: string
    rejectedMessage: string
    feedbacksSent: number
    idea: {
      channelID: string | undefined
      questions: string[]
      emojis: {
        down: string
        up: string
      }
    }
    bugs: {
      channelID: string | undefined
      questions: string[]
      emojis: {
        down: string
        up: string
      }
    }
  }
  eventsAdvertiseChannelID: string | undefined
  twitch: {
    current: number
    max: number
    offlineAlertsEnabled: boolean
  }
  xp: {
    inactiveDaysAllowed: number
    daily: number
    prizes: {
      first: string
      second: string
      third: string
    }
  }
  network: {
    channelIDs: {
      followers: string[]
      wall?: string
      notifications?: string
      feed?: string
      photos?: string
    }
  }
}

export interface GuildSettingsDefault {
  language: `en-US`
  menutime: 2
  prefix: '.'
  antiraid: {
    autoBanNudeBotsEnabled: false
    alertsEnabled: true
  }
  verify: {
    categoryID: undefined
    firstMessageJSON: undefined
    roleID: undefined
    channelIDs: string[]
    enabled: false
    discordVerificationStrictnessEnabled: true
  }
  mails: {
    alertRoleIDs: string[]
    blockedUserIDs: string[]
    categoryID: undefined
    enabled: false
    supportChannelID: undefined
  }
  staff: {
    adminRoleID: undefined
    modRoleIDs: string[]
  }
  vip: {
    isVIP: false
    registeredAt: undefined
    userID: undefined
    logoURLs: string[]
  }
  tags: {
    disabledChannels: string[]
  }
  modules: string[]
  moderation: {
    roleIDs: {
      autorole: undefined
      public: string[]
      mute: undefined
    }
    users: {
      mutedUserIDs: string[]
    }
    filters: {
      profanity: {
        words: string[]
        strictWords: string[]
        enabled: false
      }
      capital: 100
      url: {
        enabled: false
        roleIDs: string[]
        channelIDs: string[]
        userIDs: string[]
        urls: string[]
      }
    }
    logs: {
      modlogsChannelID: undefined
      publiclogsChannelID: undefined
      serverlogs: {
        ignoredRoleIDs: string[]
        ignoredChannelIDs: string[]
        roles: {
          channelID: undefined
          createPublicEnabled: true
          deletePublicEnabled: true
          updatePublicEnabled: true
          memberPublicEnabled: true
        }
        members: {
          channelID: undefined
          addPublicEnabled: true
          removePublicEnabled: false
          nicknamePublicEnabled: true
        }
        bot: {
          channelID: undefined
        }
        messages: {
          channelID: undefined
          deletedPublicEnabled: true
          editedPublicEnabled: true
        }
        emojis: {
          channelID: undefined
          createPublicEnabled: true
          deletePublicEnabled: true
          updatePublicEnabled: true
        }
        channels: {
          channelID: undefined
          createPublicEnabled: true
          deletePublicEnabled: true
          updatePublicEnabled: true
        }
      }
    }
  }
  hibye: {
    welcome: {
      channelID: undefined
      dmEnabled: false
      dmOnly: false
      message: undefined
    }
    goodbye: {
      channelID: undefined
      dmEnabled: false
      dmOnly: false
      message: undefined
    }
  }
  feedback: {
    logChannelID: undefined
    solvedChannelID: undefined
    rejectedChannelID: undefined
    solvedMessage: undefined
    rejectedMessage: undefined
    idea: {
      channelID: undefined
      questions: string[]
      emojis: {
        down: '<:g4m3rhug:458994471712063499>'
        up: '<:g4m3rangry:458758779312275476>'
      }
    }
    bugs: {
      channelID: undefined
      questions: string[]
      emojis: {
        down: '<:g4m3rhug:458994471712063499>'
        up: '<:g4m3rangry:458758779312275476>'
      }
    }
  }
  eventsAdvertiseChannelID: undefined
  twitch: {
    current: 0
    max: 30
    offlineAlertsEnabled: false
  }
  xp: {
    inactiveDaysAllowed: 0
    daily: 10
    prizes: {
      first: undefined
      second: undefined
      third: undefined
    }
  }
}
