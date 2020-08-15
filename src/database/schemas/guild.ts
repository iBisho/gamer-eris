import mongoose from 'mongoose'

export default new mongoose.Schema({
  // The guild id will help make each document be unique
  guildID: { type: String, required: true, index: true },
  // The language that should be used for the server
  language: { type: String, default: `en-US` },
  // How many minutes to wait for a response from a user. ONLY VIP GUILDS CAN MODIFY.
  menutime: { type: Number, min: 2, max: 5, default: 2 },
  // The custom guild prefix
  prefix: { type: String, default: '.', lowercase: true, maxlength: 3, minlength: 1 },
  // Server Security options
  antiraid: {
    // Automatically ban nude bots when detected on any server
    autoBanNudeBotsEnabled: Boolean,
    // Send alerts to admins/mods when a nude bot is detected and not able to be banned
    alertsEnabled: Boolean
  },
  // Verification system settings
  verify: {
    // The category ID where all the verification channels will be
    categoryID: String,
    // The first message that is sent in the newly created private user channel when new users initially type .verify
    firstMessageJSON: String,
    // The verification role id
    roleID: String,
    // The bot auto-created channels so we can remove them if they get inactive so a server doesnt get bloated with channels
    channelIDs: [String],
    // Whether the verification system is enabled or disabled
    enabled: Boolean,
    // Enforce Build In Discord verification before using this verification system. Discord checks email, phone verification etc... Once we give them a role this overrides that Discord checks.
    discordVerificationStrictnessEnabled: { type: Boolean, default: true }
  },
  mails: {
    // The roles to @mention when a new message is sent through mail system.
    alertRoleIDs: [String],
    // Block spam/annoying users from sending mails.
    blockedUserIDs: [String],
    // The category channel ID where all the mails will be.
    categoryID: String,
    // Whether the mail system is enabled or disabled
    enabled: Boolean,
    // Support channel can automatically create mails without needing to use commands. Better user experience.
    supportChannelID: String,
    // The log channel where all mails will be sent.
    logChannelID: String
  },
  staff: {
    // Dangerous permissions so we only should allow max of 1 role
    adminRoleID: String,
    // Multiple mod roles. Example: Moderator, Junior Moderator etc...
    modRoleIDs: [String]
  },
  vip: {
    // Whether or not the guild is a VIP guild.
    isVIP: Boolean,
    // The timestamp when the guild was registered as a VIP.
    registeredAt: Number,
    // The user id of the person who registered the guild as a VIP
    userID: String,
    // VIPFEATURE: The image urls to change the servers logo every so often.
    logoURLs: [String]
  },
  tags: {
    // Tags are not allowed to work in these channels
    disabledChannels: [String]
  },
  // The modules that have been enabled in this guild.
  modules: { type: [String], lowercase: true },
  disableTenor: Boolean,
  moderation: {
    reassignRolesOnJoin: Boolean,
    roleIDs: {
      // The role to be automatically assigned once the user finished verifying.
      autorole: String,
      // The role ids that users are able to give themself or remove themself.
      public: [String],
      // The role to give or remove from a user when they are muted.
      mute: String
    },
    users: {
      // Users that were muted. Keep track so if user leaves and rejoins we mute them again.
      mutedUserIDs: [String]
    },
    filters: {
      profanity: {
        // The words that must match the exact string to be triggered.
        words: { type: [String], lowercase: true },
        // Any form of the word will check strictly.
        strictWords: { type: [String], lowercase: true },
        // Whether the filter should be enabled
        enabled: Boolean
      },
      // The % of characters that are allowed to be capital in ur message. 100% allowed = disabled filter
      capital: { type: Number, min: 40, max: 100, default: 100 },
      url: {
        // Whether the url filter is enabled.
        enabled: Boolean,
        // Roles that are allowed to post urls
        roleIDs: [String],
        // Channels that are allowed to have urls posted in
        channelIDs: [String],
        // Users that are allowed to post urls
        userIDs: [String],
        // Urls that are not meant to be blocked at all.
        urls: [String]
      }
    },
    // Log settings
    logs: {
      // The channel where logs are sent when a moderation command is used like .mute
      modlogsChannelID: String,
      // A channel where "anonymous" logs are sent showing the action without using names. Meant to keep public to teach users of server rules.
      publiclogsChannelID: String,
      // Server logs
      serverlogs: {
        // Roles to ignore logging for. Example, ignoring admins
        ignoredRoleIDs: [String],
        // Channels to ignore logging for.
        ignoredChannelIDs: [String],
        roles: {
          // Channel to post the logs in
          channelID: String,
          // Whether these types of logs should post the public version in the public channel
          createPublicEnabled: Boolean,
          deletePublicEnabled: Boolean,
          updatePublicEnabled: Boolean,
          memberPublicEnabled: Boolean
        },
        members: {
          channelID: String,
          addPublicEnabled: Boolean,
          removePublicEnabled: Boolean,
          nicknamePublicEnabled: Boolean
        },
        bot: {
          channelID: String
        },
        messages: {
          channelID: String,
          deletedPublicEnabled: Boolean,
          editedPublicEnabled: Boolean
        },
        emojis: {
          channelID: String,
          createPublicEnabled: Boolean,
          deletePublicEnabled: Boolean,
          updatePublicEnabled: Boolean
        },
        channels: {
          channelID: String,
          createPublicEnabled: Boolean,
          deletePublicEnabled: Boolean,
          updatePublicEnabled: Boolean
        },
        voice: {
          channelID: String,
          joinPublicEnabled: Boolean,
          leavePublicEnabled: Boolean
        }
      }
    }
  },
  hibye: {
    welcome: {
      // The channel id where the welcome message will be sent
      channelID: String,
      // Whether or not to also send the welcome message in DM
      dmEnabled: Boolean,
      // Whether the message should ONLY be sent in DM
      dmOnly: Boolean,
      // The message that will be sent. Usually JSON string to use for embeds
      message: String
    },
    goodbye: {
      // The channel id where the goodbye message will be sent
      channelID: String,
      // Whether or not to also send the goodbye message in DM
      dmEnabled: Boolean,
      // Whether the message should ONLY be sent in DM
      dmOnly: Boolean,
      // The message that will be sent. Usually JSON string to use for embeds
      message: String
    }
  },
  feedback: {
    // Feedback is originall sent here to be verified and approved by server staff before being made public.
    approvalChannelID: String,
    // Where all feedback sent are logged. Usually private channel.
    logChannelID: String,
    // Where all feedback once a mod/admin marks it as solved.
    solvedChannelID: String,
    // Where all feedback once a mod/admin marks it as rejected.
    rejectedChannelID: String,
    // The message that is sent to the user when their feedback is solved.
    solvedMessage: String,
    // The message that is sent to the user when their feedback is rejected.
    rejectedMessage: String,
    // The amount of feedback sent. This is used for users to edit feedback with their specific id number.
    feedbacksSent: Number,
    idea: {
      // The channel to send the feedback to.
      channelID: String,
      // The list of questions that the user answers in their feedback
      questions: [String],
      emojis: {
        // Emoji for downvoting
        down: { type: String, default: '<:g4m3rhug:458994471712063499>' },
        // Emoji for upvoting
        up: { type: String, default: '<:g4m3rangry:458758779312275476>' }
      }
    },
    bugs: {
      channelID: String,
      questions: [String],
      emojis: {
        down: { type: String, default: '<:g4m3rhug:458994471712063499>' },
        up: { type: String, default: '<:g4m3rangry:458758779312275476>' }
      }
    }
  },
  // The channel that new event advertisements are sent to.
  eventsAdvertiseChannelID: String,
  twitch: {
    current: { type: Number, default: 0 },
    // The max amount of subscriptions one server can use up. Twitch has rate limits.
    max: { type: Number, default: 30 },
    // Whether or not to send offline alerts.
    offlineAlertsEnabled: Boolean
  },
  xp: {
    // The max amount of days u can be inactive on a server before losing XP
    inactiveDaysAllowed: { type: Number, default: 0 },
    // The percentage of xp to be removed when user is marked inactive
    inactivePercentage: { type: Number, default: 1 },
    // The amount of xp to grant per message
    perMessage: Number,
    // The amount of xp to grant per minute in voice
    perMinuteVoice: Number,
    prizes: {
      // url image for the first place prize
      first: String,
      // url image for the second place prize
      second: String,
      // url image for the third place prize
      third: String
    },
    disableMissions: Boolean
  },
  network: {
    channelIDs: {
      followers: { type: [String], default: [] },
      wall: String,
      notifications: String,
      feed: String,
      photos: String
    }
  },

  roleIDs: {
    eventsCreate: String
  }
})
