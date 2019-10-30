export default {
  language: `en-US`,
  menutime: 2,
  prefix: '.',
  antiraid: {
    autoBanNudeBotsEnabled: false,
    alertsEnabled: true
  },
  verify: {
    categoryID: undefined,
    firstMessageJSON: undefined,
    roleID: undefined,
    channelIDs: [],
    enabled: false,
    discordVerificationStrictnessEnabled: true
  },
  mails: {
    alertRoleIDs: [],
    blockedUserIDs: [],
    categoryID: undefined,
    enabled: false,
    supportChannelID: undefined
  },
  staff: {
    adminRoleID: undefined,
    modRoleIDs: []
  },
  vip: {
    isVIP: false,
    registeredAt: undefined,
    userID: undefined,
    logoURLs: []
  },
  tags: {
    disabledChannels: []
  },
  modules: [],
  moderation: {
    roleIDs: {
      autorole: undefined,
      public: [],
      mute: undefined
    },
    users: {
      mutedUserIDs: []
    },
    filters: {
      profanity: {
        words: [],
        strictWords: [],
        enabled: false
      },
      capital: 100,
      url: {
        enabled: false,
        roleIDs: [],
        channelIDs: [],
        userIDs: [],
        urls: []
      }
    },
    logs: {
      modlogsChannelID: undefined,
      publiclogsChannelID: undefined,
      serverlogs: {
        ignoredRoleIDs: [],
        ignoredChannelIDs: [],
        roles: {
          channelID: undefined,
          createPublicEnabled: true,
          deletePublicEnabled: true,
          updatePublicEnabled: true,
          memberPublicEnabled: true
        },
        members: {
          channelID: undefined,
          addPublicEnabled: true,
          removePublicEnabled: false,
          nicknamePublicEnabled: true
        },
        bot: {
          channelID: undefined
        },
        messages: {
          channelID: undefined,
          deletedPublicEnabled: true,
          editedPublicEnabled: true
        },
        emojis: {
          channelID: undefined,
          createPublicEnabled: true,
          deletePublicEnabled: true,
          updatePublicEnabled: true
        },
        channels: {
          channelID: undefined,
          createPublicEnabled: true,
          deletePublicEnabled: true,
          updatePublicEnabled: true
        }
      }
    }
  },
  hibye: {
    welcome: {
      channelID: undefined,
      dmEnabled: false,
      dmOnly: false,
      message: undefined
    },
    goodbye: {
      channelID: undefined,
      dmEnabled: false,
      dmOnly: false,
      message: undefined
    }
  },
  feedback: {
    logChannelID: undefined,
    solvedChannelID: undefined,
    rejectedChannelID: undefined,
    solvedMessage: undefined,
    rejectedMessage: undefined,
    feedbacksSent: 0,
    idea: {
      channelID: undefined,
      questions: [],
      emojis: {
        down: '<:g4m3rhug:458994471712063499>',
        up: '<:g4m3rangry:458758779312275476>'
      }
    },
    bugs: {
      channelID: undefined,
      questions: [],
      emojis: {
        down: '<:g4m3rhug:458994471712063499>',
        up: '<:g4m3rangry:458758779312275476>'
      }
    }
  },
  eventsAdvertiseChannelID: undefined,
  twitch: {
    current: 0,
    max: 30,
    offlineAlertsEnabled: false
  },
  xp: {
    perMessage: 1,
    perMinutesInVoice: 1,
    channelID: undefined,
    inactiveDaysAllowed: 0,
    daily: 10,
    prizes: {
      first: undefined,
      second: undefined,
      third: undefined
    }
  }
}
