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
import baseball from './cards/mlb'
import servers from './modules/servers'
import gifs from './gifs'

export default {
  emojis,
  general,
  gifs,
  levels,
  personalities,
  profanity,
  profiles,
  missions,
  cards: {
    arenaofvalor,
    baseball,
    mobilelegends,
    rulesofsurvival
  },
  modules: {
    servers
  }
}
