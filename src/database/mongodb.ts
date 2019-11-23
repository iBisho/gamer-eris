import mongoose from 'mongoose'
import ClientSchema from './schemas/client'
import EmojiSchema from './schemas/emoji'
import EventSchema from './schemas/event'
import FeedbackSchema from './schemas/feedback'
import GuildSchema from './schemas/guild'
import LabelSchema from './schemas/label'
import LevelSchema from './schemas/level'
import MailSchema from './schemas/mail'
import MemberSchema from './schemas/member'
import MissionSchema from './schemas/mission'
import ModlogSchema from './schemas/modlog'
import ReactionRoleSchema from './schemas/reactionrole'
import RolesetSchema from './schemas/roleset'
import ShortcutSchema from './schemas/shortcut'
import SubscriptionSchema, { GamerSubscription } from './schemas/subscription'
import SurveySchema from './schemas/survey'
import TagSchema from './schemas/tag'
import TradingCardSchema from './schemas/tradingCard'
import UserSchema from './schemas/user'
import GuildDefaults from '../constants/settings/guild'
import MemberDefaults from '../constants/settings/member'
import UserDefaults from '../constants/settings/user'
import { GuildSettings, UserSettings } from '../lib/types/settings'

import config from '../../config'
import { GamerEmoji } from '../lib/types/database'

const connectionString = config.mongoConnectionString

class Database {
  connection: mongoose.Connection
  models = {
    client: mongoose.model('Client', ClientSchema),
    emoji: mongoose.model<GamerEmoji>('Emoji', EmojiSchema),
    event: mongoose.model('Event', EventSchema),
    feedback: mongoose.model('Feedback', FeedbackSchema),
    guild: mongoose.model<GuildSettings>('Guild', GuildSchema),
    label: mongoose.model('Label', LabelSchema),
    level: mongoose.model('Level', LevelSchema),
    mail: mongoose.model('Mail', MailSchema),
    member: mongoose.model('Member', MemberSchema),
    mission: mongoose.model('Mission', MissionSchema),
    modlog: mongoose.model('Modlog', ModlogSchema),
    reactionRole: mongoose.model('ReactionRole', ReactionRoleSchema),
    roleset: mongoose.model('Roleset', RolesetSchema),
    shortcut: mongoose.model('Shortcut', ShortcutSchema),
    subscription: mongoose.model<GamerSubscription>('Subscription', SubscriptionSchema),
    survey: mongoose.model('Survey', SurveySchema),
    tag: mongoose.model('Tag', TagSchema),
    tradingCard: mongoose.model('TradingCards', TradingCardSchema),
    user: mongoose.model<UserSettings>('User', UserSchema)
  }

  constants = {
    guild: GuildDefaults,
    member: MemberDefaults,
    user: UserDefaults
  }

  constructor() {
    // Connect to the db
    mongoose.connect(connectionString, {
      useCreateIndex: true,
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    })
    // Switch to "true" if need to debug mongodb queries
    mongoose.set('debug', false)
    this.connection = mongoose.connection

    this.connection.on(`error`, error => console.error(`MongoDB connection error`, error))
    this.connection.once(`open`, () => {
      console.log(`MongoDB Connected!`)
    })
  }
}

export default new Database()
