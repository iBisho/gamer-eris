import emojis from './emojis'
import general from './general'
import levels from './levels'
import personalities from './personalities'
import profanity from './profanity'
import profiles from './profiles'
import missions from './missions'
import arenaofvalor from './cards/arenaofvalor'
import mobilelegends from './cards/mobilelegends'
import rulesofsurvival from './cards/rulesofsurvival'
import servers from './modules/servers'

export default {
  emojis,
  general,
  levels,
  personalities,
  profanity,
  profiles,
  missions,
  cards: {
    arenaofvalor,
    mobilelegends,
    rulesofsurvival
  },
  modules: {
    servers
  }
}
