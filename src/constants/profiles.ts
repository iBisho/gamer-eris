import { join } from 'path'
import * as fs from 'fs'

const rootFolder = join(__dirname, `..`, `..`, `..`)
const assetsFolder = join(rootFolder, `assets`)

export default {
  clanDefaults: {
    logo: join(assetsFolder, `profile/gamer.png`),
    text: `The Bot For Every Gamer`,
    url: `https://gamer.netlify.com`,
    name: `Coins`
  },
  whiteMode: {
    username: `#000`,
    discriminator: `#adadad`,
    userdivider: `#dadada`,
    xpbarText: `#000`,
    xpbarRatioUp: `#000`,
    xpbarRatioDown: `#000`,
    badgeShadow: `rgba(161,161,161,1)`,
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
  orangeMode: {
    username: `#000`,
    discriminator: `#000`,
    userdivider: `#dadada`,
    xpbarText: `#000`,
    xpbarRatioUp: `#000`,
    xpbarRatioDown: `#000`,
    badgeShadow: `rgba(100,100,100,.7)`,
    badgeFilling: `#5d5d5d`,
    xpbarFilling: `#5d5d5d`,
    clanRectFilling: `rgba(54,54,54,.7)`,
    clanName: `#8bccef`,
    clanText: `#fff`,
    clanURL: `#fff`
  },
  redMode: {
    username: `#fff`,
    discriminator: `#fff`,
    userdivider: `#dadada`,
    xpbarText: `#fff`,
    xpbarRatioUp: `#000`,
    xpbarRatioDown: `#000`,
    badgeShadow: `rgba(100,100,100,.7)`,
    badgeFilling: `#5d5d5d`,
    xpbarFilling: `#5d5d5d`,
    clanRectFilling: `rgba(54,54,54,.7)`,
    clanName: `#8bccef`,
    clanText: `#fff`,
    clanURL: `#fff`
  },
  greenMode: {
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
  purpleMode: {
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
  blueMode: {
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
  defaultBackground: `Shop Titans`,
  backgrounds: [
    {
      id: 1,
      name: `SadAnimeGirly - Submitted By GeheimerWolf#8008`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/SadAnimeGirly.png`)),
      vipNeeded: false
    },
    {
      id: 2,
      name: `BF1 Assault`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/bf1pilot.jpg`)),
      vipNeeded: false
    },
    {
      id: 3,
      name: `unOrdinary`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/unordinary.jpg`)),
      vipNeeded: false
    },
    {
      id: 4,
      name: `Free Fire 1`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/freefire1.png`)),
      vipNeeded: false
    },
    {
      id: 5,
      name: `Free Fire 2`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/freefire2.png`)),
      vipNeeded: false
    },
    {
      id: 6,
      name: `Free Fire 3`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/freefire3.png`)),
      vipNeeded: false
    },
    {
      id: 7,
      name: `ATS - Submitted By BeardCaliper#1897`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/ats.jpg`)),
      vipNeeded: false
    },
    {
      id: 8,
      name: `Dicey Cafe - Submitted By Derk#0127`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/diceycafe.png`)),
      vipNeeded: false
    },
    {
      id: 9,
      name: `Control`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/control.jpg`)),
      vipNeeded: false
    },
    {
      id: 10,
      name: `Ark Survival Evolved - Submitted By Aikage#4444`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/ark.jpg`)),
      vipNeeded: false
    },
    {
      id: 11,
      name: `PlayerUnknown's Battlegrounds - Submitted By GeheimerWolf#8008`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/pubg.png`)),
      vipNeeded: false
    },
    {
      id: 12,
      name: `Shop Titans`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/shoptitans.jpg`)),
      vipNeeded: false
    },
    {
      id: 13,
      name: `Minecraft - Submitted By Aikage#4444`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/minecraft.png`)),
      vipNeeded: false
    },
    {
      id: 14,
      name: `CodeVein - Submitted By Aikage#4444`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/CodeVein.jpg`)),
      vipNeeded: false
    },
    {
      id: 15,
      name: `Final-Fantasy-VII - Submitted By Aikage#4444`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/Final-Fantasy-VII.jpg`)),
      vipNeeded: false
    },
    {
      id: 16,
      name: `Something - Submitted By Aikage#4444`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/something.png`)),
      vipNeeded: false
    },
    {
      id: 17,
      name: `Overwatch - Submitted By GeheimerWolf#8008`,
      buffer: fs.readFileSync(join(assetsFolder, `profile/Backgrounds/Overwatch.png`)),
      vipNeeded: false
    }
  ],
  backgroundPackages: [],
  badges: [],
  badgePackges: []
}
