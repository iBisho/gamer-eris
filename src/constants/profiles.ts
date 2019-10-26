import { join } from 'path'

const rootFolder = join(__dirname, `..`, `..`, `..`)
const assetsFolder = join(rootFolder, `assets`)

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
      category: `games`,
      type: `normal`,
      name: `Vainglory - Storm Queen`,
      url: `vg-stormqueen.png`,
      packages: [`Vainglory One`]
    },
    { id: 2, category: `games`, type: `normal`, name: `Vainglory - Yates Splash`, url: `vg-yates-splash.png` },
    { id: 3, category: `games`, type: `premium`, name: `Vainglory - Taka 3D`, url: `3d-vg-taka.png` },
    {
      id: 4,
      category: `games`,
      type: `normal`,
      name: `Arena of Valor - Zanis Blood Warrior`,
      url: `aov-blood-warrior-zanis.jpg`
    },
    {
      id: 5,
      category: `games`,
      type: `normal`,
      name: `Arena of Valor - CyberCore Nakroth`,
      url: `aov-cybercore-nakroth.jpg`
    },
    { id: 6, category: `games`, type: `normal`, name: `Destiny - Warlock`, url: `destiny-warlock.jpg` },
    { id: 7, category: `games`, type: `normal`, name: `Arena of Valor - Arthus`, url: `aov-arthur.png` },
    { id: 8, category: `games`, type: `normal`, name: `Arena of Valor - Grakk`, url: `aov-grakk.png` },
    { id: 9, category: `games`, type: `normal`, name: `Arena of Valor - Valhein`, url: `aov-valhein.png` },
    { id: 10, category: `games`, type: `normal`, name: `Arena of Valor - Xeniel`, url: `aov-xeniel.png` },
    { id: 11, category: `games`, type: `normal`, name: `Arena of Valor - Yorn`, url: `aov-yorn.png` },
    { id: 12, category: `games`, type: `premium`, name: `Dead by Daylight - The Nurse`, url: `3d-dbd-thenurse.png` },
    { id: 13, category: `games`, type: `normal`, name: `Dead by Daylight - The Hag`, url: `dbd-thehag.png` },
    { id: 14, category: `games`, type: `premium`, name: `Clash of Clans - The Witch`, url: `3d-coc-thewitch.png` },
    { id: 15, category: `games`, type: `normal`, name: `Vainglory - Flicker`, url: `vg-flicker.png` },
    { id: 16, category: `games`, type: `normal`, name: `Vainglory - Samuel`, url: `vg-samuel.png` },
    { id: 17, category: `games`, type: `normal`, name: `Vainglory - All Heroes Overview`, url: `vg-allheroes.png` },
    { id: 18, category: `games`, type: `premium`, name: `Clash of Clans - Golem`, url: `3d-coc-golem.png` },
    { id: 19, category: `games`, type: `normal`, name: `Vainglory - Taka`, url: `vg-taka.png` },
    { id: 20, category: `games`, type: `normal`, name: `Animal Crossing - Castle`, url: `animalcrossing-castle.png` },
    { id: 21, category: `g4m3r`, type: `normal`, name: `G4M3R - Emojis`, url: `g4m3r-emojisblack.png` },
    { id: 22, category: `animals`, type: `normal`, name: `Black Cat with Red Cap`, url: `art-redcapcat.png` },
    { id: 23, category: `anime`, type: `normal`, name: `Tokyo Ghoul - Kagune`, url: `tokyoghoul-kagune.png` },
    {
      id: 24,
      category: `anime`,
      type: `normal`,
      name: `Naruto - Kakashi & Obito`,
      url: `naruto-kakashixobitoyoung.png`
    },
    { id: 25, category: `anime`, type: `premium`, name: `Bleach - Ichigo Hollow`, url: `3d-bleach-ichigohollow.png` },
    { id: 26, category: `games`, type: `premium`, name: `SWTOR - Jedi`, url: `3d-swtor-jedis.png` },
    { id: 27, category: `art`, type: `normal`, name: `Art - Abstract grey blocks`, url: `art-abstractblocksgrey.png` },
    { id: 28, category: `art`, type: `normal`, name: `Art - Abstract bubbles`, url: `art-abstractbubbles.png` },
    { id: 29, category: `art`, type: `normal`, name: `Art - Abstract colors`, url: `art-abstractcolours.png` },
    { id: 30, category: `anime`, type: `normal`, name: `Boruto - Boruto\`s sword`, url: `boruto-borutosword.png` },
    { id: 31, category: `games`, type: `normal`, name: `World - Space battle`, url: `world-spacebattle.png` },
    { id: 31, category: `games`, type: `normal`, name: `World - Space ships`, url: `world-spaceships.png` },
    {
      id: 32,
      category: `games`,
      type: `premium`,
      name: `Animal Crossing - Mr. Resetti`,
      url: `3d-animalcrossing-resetti.png`
    },
    { id: 33, category: `games`, type: `premium`, name: `Apex Legends - Bloodhound`, url: `3d-apex-bloodhound.png` },
    { id: 34, category: `games`, type: `normal`, name: `Apex Legends - Caustic`, url: `apex-caustic.png` },
    { id: 35, category: `games`, type: `normal`, name: `Apex Legends - Gibraltar`, url: `apex-gibraltar.png` },
    { id: 36, category: `games`, type: `normal`, name: `Apex Legends - Wraith`, url: `apex-wraith.png` },
    {
      id: 37,
      category: `games`,
      type: `normal`,
      name: `Chronicles Of Elyria - Kings Letter`,
      url: `coe-kingsletter.png`
    },
    { id: 38, category: `games`, type: `normal`, name: `Chronicles of Elyria - Trison`, url: `coe-trison.png` },
    {
      id: 39,
      category: `anime`,
      type: `normal`,
      name: `Dragon Ball Z - Shenron & Goku`,
      url: `dragonballz-dragon.png`
    },
    { id: 40, category: `games`, type: `premium`, name: `Overwatch - Reaper`, url: `3d-ow-reaper.png` },
    {
      id: 41,
      category: `tvseries`,
      type: `normal`,
      name: `Supernatural - Sam, Dean & Castiel`,
      url: `sn-supernatural.png`
    },
    { id: 42, category: `games`, type: `premium`, name: `PUBG - Chicken Dinner`, url: `3d-pubg chickendinner.png` },
    { id: 43, category: `games`, type: `normal`, name: `PUBG - Ready to Play`, url: `pubg-readytoplay.png` },
    { id: 44, category: `games`, type: `normal`, name: `TC The Division 2`, url: `tc-thedivision2.png` },
    {
      id: 45,
      category: `games`,
      type: `normal`,
      name: `TC Division 2 - See What Remains`,
      url: `tc-thedivision2-agent.png`
    },
    { id: 46, category: `games`, type: `premium`, name: `Anthem - Storm`, url: `3d-anthem-storm.png` },
    { id: 47, category: `games`, type: `normal`, name: `Freefire`, url: `games-freefire.png` },
    { id: 48, category: `games`, type: `normal`, name: `Freefire - Field day`, url: `ff-freefire_fieldday.png` },
    { id: 49, category: `games`, type: `normal`, name: `Freefire - King Shotgun`, url: `ff-freefire_kingshotgun.png` },
    { id: 50, category: `games`, type: `normal`, name: `Generation Zero - Confrontation`, url: `gz-confrontation.png` },
    { id: 51, category: `games`, type: `normal`, name: `Generation Zero - Battle Impact`, url: `gz-battle-impact.png` },
    {
      id: 52,
      category: `games`,
      type: `normal`,
      name: `Rules of Survival - 250 Million`,
      url: `ros-rules_of_survival.png`
    }
  ],
  backgroundPackages: [{ id: 1, type: `unlock`, name: `Vainglory One`, cost: 100 }],
  badges: [],
  badgePackges: []
}
