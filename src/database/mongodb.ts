import * as mongoose from 'mongoose'
import ClientSchema from './schemas/client'
import EmojiSchema from './schemas/emoji'
import EventSchema from './schemas/event'
import FeedbackSchema from './schemas/feedback'
import GuildSchema from './schemas/guild'
import LabelSchema from './schemas/label'
import LevelSchema from './schemas/level'
import MailSchema from './schemas/mail'
import MemberSchema from './schemas/member'
import ModlogSchema from './schemas/modlog'
import ReactionRoleSchema from './schemas/reactionrole'
import ShortcutSchema from './schemas/shortcut'
// import SubscriptionSchema from './schemas/subscription'
import SurveySchema from './schemas/survey'
import TagSchema from './schemas/tag'
import TradingCardSchema from './schemas/tradingCard'
import UserSchema from './schemas/user'
import GuildDefaults from '../constants/settings/guild'
import MemberDefaults from '../constants/settings/member'
import UserDefaults from '../constants/settings/user'

const connectionString = `mongodb://localhost:27017/test`
export default class {
  connection: mongoose.Connection
  models = {
    client: mongoose.model('Client', ClientSchema),
    emoji: mongoose.model('Emoji', EmojiSchema),
    event: mongoose.model('Event', EventSchema),
    feedback: mongoose.model('Feedback', FeedbackSchema),
    guild: mongoose.model('Guild', GuildSchema),
    label: mongoose.model('Label', LabelSchema),
    level: mongoose.model('Level', LevelSchema),
    mail: mongoose.model('Mail', MailSchema),
    member: mongoose.model('Member', MemberSchema),
    modlog: mongoose.model('Modlog', ModlogSchema),
    reactionRole: mongoose.model('ReactionRole', ReactionRoleSchema),
    shortcut: mongoose.model('Shortcut', ShortcutSchema),
    // subscription: mongoose.model('Subscription', SubscriptionSchema),
    survey: mongoose.model('Survey', SurveySchema),
    tag: mongoose.model('Tag', TagSchema),
    tradingCard: mongoose.model('TradingCards', TradingCardSchema),
    user: mongoose.model('User', UserSchema)
  }

  constants = {
    guild: GuildDefaults,
    member: MemberDefaults,
    user: UserDefaults
  }

  constructor() {
    // Connect to the db
    mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
    this.connection = mongoose.connection
    this.connection.on(`error`, error => console.error(`MongoDB connection error`, error))
    this.connection.once(`open`, () => {
      console.log(`MongoDB Connected!`)
    })
  }

  init() {
    // Create all tables needed for the bot
  }

  async fetchGuildSettings(id?: string) {
    // if no guild usually means DM so default
    if (!id) return this.constants.guild
    // Find a guild document
    const settings = await this.models.guild.findOne({ id })
    // If the document was found return it or give the default values
    return settings || this.constants.guild
  }
}