import mongoose from 'mongoose'
import AnalyticSchema, { GamerAnalytic } from './schemas/analytics'
import ClientSchema, { ClientSettings } from './schemas/client'
import CommandSchema, { GamerCommandPermission } from './schemas/command'
import EmojiSchema from './schemas/emoji'
import EventSchema, { GamerEvent } from './schemas/event'
import FeedbackSchema, { GamerFeedback } from './schemas/feedback'
import GuildSchema from './schemas/guild'
import LabelSchema from './schemas/label'
import LevelSchema from './schemas/level'
import MailSchema from './schemas/mail'
import MangaSchema from './schemas/manga'
import MarriageSchema, { GamerMarriage } from './schemas/marriage'
import MemberSchema from './schemas/member'
import MirrorSchema, { GamerMirror } from './schemas/mirrors'
import MissionSchema from './schemas/mission'
import ModlogSchema from './schemas/modlog'
import PollSchema, { GamerPoll } from './schemas/poll'
import ReactionRoleSchema from './schemas/reactionrole'
import ReminderSchema, { GamerReminder } from './schemas/reminder'
import RolesetSchema from './schemas/roleset'
import RolesSchema, { GamerRole } from './schemas/roles'
import RoleMessageSchema, { GamerRoleMessage } from './schemas/rolemessage'
import ShortcutSchema, { GamerShortcut } from './schemas/shortcut'
import SpySchema, { GamerSpy } from './schemas/spy'
import SubscriptionSchema, { GamerSubscription } from './schemas/subscription'
import SurveySchema from './schemas/survey'
import TagSchema from './schemas/tag'
import TradingCardSchema from './schemas/tradingCard'
import UpvoteSchema from './schemas/upvote'
import UserSchema, { UserSettings } from './schemas/user'
import { GuildSettings, MemberSettings } from '../lib/types/settings'

import config from '../../config'
import { GamerEmoji } from '../lib/types/database'
import {
  GamerMail,
  GamerMailLabel,
  GamerTag,
  GamerTradingCard,
  GamerReactionRole,
  GamerRoleset,
  GamerModlog,
  GamerLevel,
  GamerMission
} from '../lib/types/gamer'
import { GamerManga } from './schemas/manga'
import { GamerUpvote } from './schemas/upvote'

const connectionString = config.mongoConnectionString

class Database {
  connection: mongoose.Connection
  models = {
    analytics: mongoose.model<GamerAnalytic>('Analytic', AnalyticSchema),
    client: mongoose.model<ClientSettings>('Client', ClientSchema),
    command: mongoose.model<GamerCommandPermission>('Command', CommandSchema),
    emoji: mongoose.model<GamerEmoji>('Emoji', EmojiSchema),
    event: mongoose.model<GamerEvent>('Event', EventSchema),
    feedback: mongoose.model<GamerFeedback>('Feedback', FeedbackSchema),
    guild: mongoose.model<GuildSettings>('Guild', GuildSchema),
    label: mongoose.model<GamerMailLabel>('Label', LabelSchema),
    level: mongoose.model<GamerLevel>('Level', LevelSchema),
    mail: mongoose.model<GamerMail>('Mail', MailSchema),
    manga: mongoose.model<GamerManga>('Manga', MangaSchema),
    marriage: mongoose.model<GamerMarriage>('Marriage', MarriageSchema),
    member: mongoose.model<MemberSettings>('Member', MemberSchema),
    mirror: mongoose.model<GamerMirror>('Mirror', MirrorSchema),
    mission: mongoose.model<GamerMission>('Mission', MissionSchema),
    modlog: mongoose.model<GamerModlog>('Modlog', ModlogSchema),
    poll: mongoose.model<GamerPoll>('Poll', PollSchema),
    reactionRole: mongoose.model<GamerReactionRole>('ReactionRole', ReactionRoleSchema),
    reminder: mongoose.model<GamerReminder>('Reminder', ReminderSchema),
    roleMessages: mongoose.model<GamerRoleMessage>('RoleMessage', RoleMessageSchema),
    roles: mongoose.model<GamerRole>('Roles', RolesSchema),
    roleset: mongoose.model<GamerRoleset>('Roleset', RolesetSchema),
    shortcut: mongoose.model<GamerShortcut>('Shortcut', ShortcutSchema),
    spy: mongoose.model<GamerSpy>('Spy', SpySchema),
    subscription: mongoose.model<GamerSubscription>('Subscription', SubscriptionSchema),
    survey: mongoose.model('Survey', SurveySchema),
    tag: mongoose.model<GamerTag>('Tag', TagSchema),
    tradingCard: mongoose.model<GamerTradingCard>('TradingCards', TradingCardSchema),
    upvote: mongoose.model<GamerUpvote>('Upvote', UpvoteSchema),
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
