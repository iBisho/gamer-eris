import mongoose from 'mongoose'
import ClientSchema from './schemas/client'
import EmojiSchema from './schemas/emoji'
import EventSchema from './schemas/event'
import FeedbackSchema, { GamerFeedback } from './schemas/feedback'
import GuildSchema from './schemas/guild'
import LabelSchema from './schemas/label'
import LevelSchema from './schemas/level'
import MailSchema from './schemas/mail'
import MemberSchema from './schemas/member'
import MissionSchema from './schemas/mission'
import ModlogSchema from './schemas/modlog'
import ReactionRoleSchema from './schemas/reactionrole'
import RolesetSchema from './schemas/roleset'
import RoleMessageSchema, { GamerRoleMessage } from './schemas/rolemessage'
import ShortcutSchema, { GamerShortcut } from './schemas/shortcut'
import SubscriptionSchema, { GamerSubscription } from './schemas/subscription'
import SurveySchema from './schemas/survey'
import TagSchema from './schemas/tag'
import TradingCardSchema from './schemas/tradingCard'
import UserSchema from './schemas/user'
import { GuildSettings, UserSettings, MemberSettings } from '../lib/types/settings'

import config from '../../config'
import { GamerEmoji } from '../lib/types/database'
import {
  GamerMail,
  GamerMailLabel,
  GamerTag,
  GamerTradingCard,
  GamerReactionRole,
  GamerEvent,
  GamerRoleset,
  GamerModlog,
  GamerLevel,
  GamerMission
} from '../lib/types/gamer'

const connectionString = config.mongoConnectionString

class Database {
  connection: mongoose.Connection
  models = {
    client: mongoose.model('Client', ClientSchema),
    emoji: mongoose.model<GamerEmoji>('Emoji', EmojiSchema),
    event: mongoose.model<GamerEvent>('Event', EventSchema),
    feedback: mongoose.model<GamerFeedback>('Feedback', FeedbackSchema),
    guild: mongoose.model<GuildSettings>('Guild', GuildSchema),
    label: mongoose.model<GamerMailLabel>('Label', LabelSchema),
    level: mongoose.model<GamerLevel>('Level', LevelSchema),
    mail: mongoose.model<GamerMail>('Mail', MailSchema),
    member: mongoose.model<MemberSettings>('Member', MemberSchema),
    mission: mongoose.model<GamerMission>('Mission', MissionSchema),
    modlog: mongoose.model<GamerModlog>('Modlog', ModlogSchema),
    reactionRole: mongoose.model<GamerReactionRole>('ReactionRole', ReactionRoleSchema),
    roleMessages: mongoose.model<GamerRoleMessage>('RoleMessage', RoleMessageSchema),
    roleset: mongoose.model<GamerRoleset>('Roleset', RolesetSchema),
    shortcut: mongoose.model<GamerShortcut>('Shortcut', ShortcutSchema),
    subscription: mongoose.model<GamerSubscription>('Subscription', SubscriptionSchema),
    survey: mongoose.model('Survey', SurveySchema),
    tag: mongoose.model<GamerTag>('Tag', TagSchema),
    tradingCard: mongoose.model<GamerTradingCard>('TradingCards', TradingCardSchema),
    user: mongoose.model<UserSettings>('User', UserSchema)
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
