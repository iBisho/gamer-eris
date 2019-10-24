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

// Connect to the db
mongoose.connect(`mongodb://localhost/:27017/test`, { useNewUrlParser: true })

const db = mongoose.connection
db.on(`error`, () => console.error(`MongoDB connection error`))
db.once(`open`, () => {
  console.log(`MongoDB Connected!`)
  const ClientModel = mongoose.model('Client', ClientSchema)
  const EmojiModel = mongoose.model('Emoji', EmojiSchema)
  const EventModel = mongoose.model('Event', EventSchema)
  const FeedbackModel = mongoose.model('Feedback', FeedbackSchema)
  const GuildModel = mongoose.model('Guild', GuildSchema)
  const LabelModel = mongoose.model('Label', LabelSchema)
  const LevelModel = mongoose.model('Level', LevelSchema)
  const MailModel = mongoose.model('Mail', MailSchema)
  const MemberModel = mongoose.model('Member', MemberSchema)
  const ModlogModel = mongoose.model('Modlog', ModlogSchema)
  const ReactionRoleModel = mongoose.model('ReactionRole', ReactionRoleSchema)
  const ShortcutModel = mongoose.model('Shortcut', ShortcutSchema)
  // const SubscriptionModel = mongoose.model('Subscription', SubscriptionSchema)
  const SurveyModel = mongoose.model('Survey', SurveySchema)
  const TagModel = mongoose.model('Tag', TagSchema)
  const TradingCardModel = mongoose.model('TradingCards', TradingCardSchema)
  const UserModel = mongoose.model('User', UserSchema)
})
