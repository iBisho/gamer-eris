import { join } from 'path'
import * as fs from 'fs'

const rootFolder = join(__dirname, `..`, `..`, `..`)
const assetsFolder = join(rootFolder, `assets`)
const backgroundsFolder = join(rootFolder, `profile/Backgrounds`)

export default {
  clanDefaults: {
    logo: join(assetsFolder, `profile/g4m3r.png`),
    text: `The Bot For Every Gamer`,
    url: `https://g4m3r.xyz`,
    name: `G4M3R`
  },
  whiteMode: {
    username: `#000`,
    discriminator: `#adadad`,
    userdivider: `#dadada`,
    xpbarText: `#000`,
    xpbarRatioUp: `#000`,
    xpbarRatioDown: `#000`,
    badgeShadow: `rgba(100,100,100,.7)`,
    badgeFilling: `#e0e0e0`,
    xpbarFilling: `#e0e0e0`,
    clanRectFilling: `rgba(54,54,54,.7)`,
    clanName: `#8bccef`,
    clanText: `#fff`,
    clanURL: `#fff`
  },
  darkMode: {
    username: `#fff`,
    discriminator: `#fff`,
    userdivider: `#dadada`,
    xpbarText: `#fff`,
    xpbarRatioUp: `#000`,
    xpbarRatioDown: `#000`,
    badgeShadow: `rgba(100,100,100,.7)`,
    badgeFilling: `#5D5D5D`,
    xpbarFilling: `#5D5D5D`,
    clanRectFilling: `rgba(54,54,54,.7)`,
    clanName: `#8bccef`,
    clanText: `#fff`,
    clanURL: `#fff`
  },
  defaultBackground: `ros-rules_of_survival.png`,
  defaultLogo: `vgpro-logo.png`,
  aovLogo: `aov-logo.png`,
  backgrounds: [
    {
      id: 1,
      name: ``,
      buffer: fs.readFileSync(join(backgroundsFolder, ``))
    }
  ],
  backgroundPackages: [],
  badges: [],
  badgePackges: []
}
