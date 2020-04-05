import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'

const gifs = [
  `https://media.giphy.com/media/MU3YUgsJONTzzIT9wd/giphy.gif`,
  `https://media.giphy.com/media/Efm6eMSszgNBSje3fz/giphy.gif`,
  `https://media.giphy.com/media/35zOAU58Nga3IMaaRM/giphy.gif`,
  `https://media.giphy.com/media/5UqTGys3yAnOhFeUDE/giphy.gif`,
  `https://media.giphy.com/media/XKG9XMNOW1eqwtTzPl/giphy.gif`,
  `https://media.giphy.com/media/1n4KovYuuht3z60Vv6/giphy.gif`,
  `https://media.giphy.com/media/FsV45EXWHYlgSjKBC0/giphy.gif`,
  `https://media.giphy.com/media/4GWhfhU0yQ7jEMfbgz/giphy.gif`,
  `https://media.giphy.com/media/orTdZfP36KBrcVDsO5/giphy.gif`,
  `https://media.giphy.com/media/zre1c8WLNrVw9QEegi/giphy.gif`,
  `https://media.giphy.com/media/2sZ8bkMF4EMEEJXwHe/giphy.gif`,
  `https://media.giphy.com/media/kPIeNQHlMd5VbowQYF/giphy.gif`,
  `https://media.giphy.com/media/1fn7343aosyVmmIOWe/giphy.gif`,
  `https://media.giphy.com/media/5zjdiiuwsSmURD6EkN/giphy.gif`,
  `https://media.giphy.com/media/nbR4O6Hajvm7cNv1bG/giphy.gif`,
  `https://media.giphy.com/media/35RfXtE1uromIImdWz/giphy.gif`,
  `https://media.giphy.com/media/C95rYFEWJe34tZy9VK/giphy.gif`,
  `https://media.giphy.com/media/X7sLnm6XBakI0gla5y/giphy.gif`,
  `https://media.giphy.com/media/i4jo4j6dxvQTLqBvzW/giphy.gif`,
  `https://media.giphy.com/media/1zlj5cgts1h57UwEn2/giphy.gif`,
  `https://media.giphy.com/media/2Yc4uuANndQiW12Cye/giphy.gif`,
  `https://media.giphy.com/media/3PxST0EuhjuJn9Y2lg/giphy.gif`,
  `https://media.giphy.com/media/8cfEDr02zSmHqUL8ih/giphy.gif`,
  `https://media.giphy.com/media/NsIKEFfEGWA3RWNQNb/giphy.gif`,
  `https://media.giphy.com/media/MX41h023lfs4adyTPs/giphy.gif`,
  `https://media.giphy.com/media/9MImxRWiDhKlG1DDBS/giphy.gif`,
  `https://media.giphy.com/media/8FGMkJDvAR25XhTtk1/giphy.gif`,
  `https://media.giphy.com/media/SiIekMT0xloBQ1iz1b/giphy.gif`,
  `https://media.giphy.com/media/DC5pDl9qDC9zzkI9sX/giphy.gif`,
  `https://media.giphy.com/media/uk3WO8CVy1mCTRTzxb/giphy.gif`,
  `https://media.giphy.com/media/YXi2MTGm9pO1llInLT/giphy.gif`,
  `https://media.giphy.com/media/iO5U4FklljhNZY0F9H/giphy.gif`,
  `https://media.giphy.com/media/xTOibgWpkEs66f96BR/giphy.gif`,
  `https://media.giphy.com/media/ensdF2Mdu1K5KRH7eK/giphy.gif`,
  `https://media.giphy.com/media/nqtHRSX9SLYLEwTSUp/giphy.gif`,
  `https://media.giphy.com/media/nbarXp2DSCwE8QMDvR/giphy.gif`,
  `https://media.giphy.com/media/2aKyUGaMfHEJSrbWRN/giphy.gif`,
  `https://media.giphy.com/media/8gTHWnjJYhJ0TzNMdS/giphy.gif`,
  `https://media.giphy.com/media/3GBGfryNnuxW6dG49K/giphy.gif`,
  `https://media.giphy.com/media/82ikjWK3P6ei7f6D4b/giphy.gif`,
  `https://media.giphy.com/media/2Ys3DlHWbtEUTjlBss/giphy.gif`,
  `https://media.giphy.com/media/9tXsDKq5rKbCTtdoRj/giphy.gif`,
  `https://media.giphy.com/media/SFufE5XzF2bNzadzZA/giphy.gif`,
  `https://media.giphy.com/media/1Be2VhuvjKhABEWuPM/giphy.gif`,
  `https://media.giphy.com/media/3fkZPDpZk9gh82ickX/giphy.gif`,
  `https://media.giphy.com/media/4HrBfDeSyTx1awMpKM/giphy.gif`,
  `https://media.giphy.com/media/dJReWd6duthQwIqAxr/giphy.gif`,
  `https://media.giphy.com/media/5hgNbuFPTg0nLOWfg9/giphy.gif`,
  `https://media.giphy.com/media/e7QQJiAjQoiMQb9mQ7/giphy.gif`,
  `https://media.giphy.com/media/6EwIFABYi4heka8Igs/giphy.gif`,
  `https://media.giphy.com/media/RLW8g5uucqbID9Ux4W/giphy.gif`,
  `https://media.giphy.com/media/B278wchy8J0UalIWWD/giphy.gif`,
  `https://media.giphy.com/media/fnrUq6iPtfMesJNFlh/giphy.gif`,
  `https://media.giphy.com/media/87gIwUfvH0dNThmqZu/giphy.gif`,
  `https://media.giphy.com/media/nbNfCnOaCitLDtB520/giphy.gif`,
  `https://media.giphy.com/media/WO6oXfSrAvcVRmPTWS/giphy.gif`,
  `https://media.giphy.com/media/5UEDrENolREB8wJP0R/giphy.gif`,
  `https://media.giphy.com/media/1jY65j6zXTyZtRomhH/giphy.gif`,
  `https://media.giphy.com/media/3scocXPY3u9WOwhWHU/giphy.gif`,
  `https://media.giphy.com/media/9PrpAxYlAHcIHGe22q/giphy.gif`,
  `https://media.giphy.com/media/NV5BymQOupcALk7735/giphy.gif`,
  `https://media.giphy.com/media/6tY8GbcVYQnY2Hyulx/giphy.gif`,
  `https://66.media.tumblr.com/tumblr_lzhyqxAYBR1qdj3cfo1_r1_500.gif`,
  `https://media.giphy.com/media/HjAkFX10VqIZa/giphy.gif`,
  `https://media.giphy.com/media/BuTEIANY82PRK/giphy.gif`,
  `https://media.giphy.com/media/erbJ5G1qTqFjy/giphy.gif`,
  `https://media.giphy.com/media/13TEyocFpylSLK/giphy.gif`,
  `https://media.giphy.com/media/vBcv7iftjFgA0/giphy.gif`,
  `https://media.giphy.com/media/faDZ9LYxRVI1G/giphy.gif`,
  `https://media.giphy.com/media/nDlJ4PVGFxsTS/giphy.gif`,
  `https://media.giphy.com/media/GYnE0nzBNPRkY/giphy.gif`,
  `https://media.giphy.com/media/Ac5yYmYOCUc5W/giphy.gif`,
  `https://media.giphy.com/media/11Rm2wxPFKsqPu/giphy.gif`,
  `https://media.giphy.com/media/qwyK9UZjJ1QLC/giphy.gif`,
  `https://media.giphy.com/media/bCY0XOp1uY5jO/giphy.gif`,
  `https://media.giphy.com/media/Ecs5jkPQRQ1oY/giphy.gif`,
  `https://media.giphy.com/media/p234R40IOPbZ6/giphy.gif`,
  `https://media.giphy.com/media/13kz1aFsEbT4ac/giphy.gif`,
  `https://media.giphy.com/media/TW0dwqv5iulqg/giphy.gif`,
  `https://media.giphy.com/media/7NCx48Erv58XK/giphy.gif`,
  `https://media.giphy.com/media/QSdi0BLoDZj3O/giphy.gif`,
  `https://media.giphy.com/media/zCJJOLeToGyFW/giphy.gif`,
  `https://media.giphy.com/media/12ViPAyoxAGtbi/giphy.gif`,
  `https://media.giphy.com/media/ofBBe0iv7rfmU/giphy.gif`,
  `https://media.giphy.com/media/vBcv7iftjFgA0/giphy.gif`,
  `https://media.giphy.com/media/1Kvm3XhuvkyFW/giphy.gif`,
  `https://i.imgur.com/cz4RDLH.gif`,
  `https://i.imgur.com/HEBNoQ7.gif`,
  `https://i.imgur.com/gbCUbgR.gif`,
  `https://i.imgur.com/3Y212WQ.gif`,
  `https://i.imgur.com/hk9u0CR.gif`,
  `https://i.imgur.com/yRXXXWh.gif`,
  `https://i.imgur.com/odprLYJ.gif`,
  `https://i.imgur.com/BjgGhHi.gif?1`,
  `https://i.imgur.com/6iN1j.gif`,
  `https://i.imgur.com/l6Fp3aT.gif`,
  `https://i.imgur.com/OyaBhNx.gif`,
  `https://i.imgur.com/HYJ6tX3.gif`,
  `https://i.imgur.com/lKxglhQ.gif`,
  `https://i.imgur.com/KNdOVrx.gif`,
  `https://i.imgur.com/zKmUa7Q.gif`,
  `https://i.imgur.com/qPQUu4M.gif`,
  `https://i.imgur.com/DQJ6nwH.gif`,
  `https://i.imgur.com/wi8hqvV.gif`,
  `https://i.imgur.com/rmmdBTn.gif`,
  `https://i.imgur.com/9eu0sre.gif`,
  `https://i.imgur.com/ls1Jvre.gif`,
  `https://i.imgur.com/Ky1K9W4.gif`,
  `https://i.imgur.com/oZBtRNS.gif`,
  `https://i.imgur.com/T8KwZIM.gif`,
  `https://i.imgur.com/9dMjQEe.gif`,
  `https://i.imgur.com/jiXmMv3.gif`,
  `https://i.imgur.com/b8xHzQ7.gif`,
  `https://i.imgur.com/fFeBXIx.gif`,
  `https://i.imgur.com/reCWHiC.gif`,
  `https://i.imgur.com/3CS2ldZ.gif`,
  `https://i.imgur.com/zEN39Dl.gif`,
  `https://i.imgur.com/GByMVwl.gif`,
  `https://i.imgur.com/uwKnN9W.gif`,
  `https://i.imgur.com/HFK1DhL.gif`,
  `https://i.imgur.com/Jg5kDfS.gif`,
  `https://i.imgur.com/CM4GItt.gif`,
  `https://i.imgur.com/GjIkYVY.gif`,
  `https://i.imgur.com/PmcL22N.gif`,
  `https://i.imgur.com/R7xRwiR.gif`,
  `https://i.imgur.com/qc1TvEC.gif`,
  `https://i.imgur.com/Bym0416.gif`,
  `https://i.imgur.com/FVudW8k.gif`,
  `https://i.imgur.com/sVlByte.gif`,
  `https://i.imgur.com/3pFTbvz.gif`,
  `https://i.imgur.com/L2ZOzKa.gif`,
  `https://i.imgur.com/jyWk3PP.gif`,
  `https://i.imgur.com/ZQ4jkw5.gif`,
  `https://i.imgur.com/LGuFgN0.gif`,
  `https://i.imgur.com/UERqIHV.gif`,
  `https://i.imgur.com/1hFBoJc.gif`,
  `https://i.imgur.com/6ZobcpZ.gif`,
  `https://i.imgur.com/gtg7axu.gif`,
  `https://i.imgur.com/KUYZ6EB.gif`,
  `https://i.imgur.com/VWqGxxb.gif`,
  `https://i.imgur.com/yPUz5xU.gif`,
  `https://i.imgur.com/XZZuQ0C.gif`,
  `https://i.imgur.com/7DkGxBm.gif`,
  `https://i.imgur.com/B76fSH3.gif`,
  `https://i.imgur.com/vYDd97m.gif`,
  `https://i.imgur.com/8tz7PDG.gif`,
  `https://i.imgur.com/0TCMaZz.gif`,
  `https://i.imgur.com/SKIjLVR.gif`,
  `https://i.imgur.com/kmNKci0.gif`
]

const quotes = [
  `Driver picks the music, shotgun shuts his cake hole.`,
  `It must be hard with your sense of direction, never being able to find your way to a decent pickup line.`,
  `Dude, stow the touchy-feely, self-help yoga crap.`,
  `Why’d you let me fall asleep?`,
  `Because I’m an awesome brother. So what did you dream about?`,
  `Lollipops and candy canes.`,
  `Your half-caf, double vanilla latte is getting cold over here, Francis.`,
  `Boy, you put your foot on my coffee table, I’m gonna whack you with a spoon.`,
  `Who do you think is a hotter psychic: Patricia Arquette, Jennifer Love Hewitt or you?`,
  `I had a crappy guidance counselor.`,
  `Dude, you fugly.`,
  `I hope your apple pie is freakin’ worth it.`,
  `Hold me, Sam. That was beautiful.`,
  `I’m not gonna die in a hospital where the nurses aren’t even hot.`,
  `You better take care of that car or I swear I'll haunt your ass!`,
  `I miss conversations that didn’t start with 'this killer truck.'`,
  `Next time you wanna get laid, find a girl that’s not so buckets-of-crazy, huh?`,
  `People believe in Santa Claus. How come I’m not getting hooked up every Christmas?`,
  `Because you’re a bad person.`,
  `What kind of a house doesn't have salt? Low sodium freaks!`,
  `Spent it on ammo.`,
  `My name is Dean Winchester. I ‘m an Aquarius. I enjoy sunsets, long walks on the beach and frisky women. And I did not kill anyone.`,
  `This is the dumbest thing you've ever done.`,
  `I don't know about that. Remember that waitress in Tampa?`,
  `Well, you are kind of butch. They probably think you're overcompensating.`,
  `What do you wanna do, poke her with a stick? Dude! You're not gonna poke her with a stick!`,
  `We’re not working for the Mandroid!`,
  `Dean, there's ten times as much lore about angels as there is about anything else we've ever hunted.`,
  `Yeah, you know what? There's a ton of lore on unicorns too. In fact, I hear that they ride on silver moonbeams and they shoot rainbows out of their ass!`,
  `Wait, there's no such thing as unicorns?`,
  `Dean, this is a very serious investigation. We don't have any time for any of your blah blah blah blah.`,
  `They made me slow dance.`,
  `What about a human by day, a freak animal killing machine by moonlight don't you understand. I mean werewolves are badass, we haven’t seen one since we were kids.`,
  `What's a P.A.?`,
  `I think it's kind of like a slave.`,
  `You know, maybe the spirits are trying to shut down the movie because they think it sucks. Because, I mean, it kinda does.`,
  `Save room for dessert, Tiny. Hey, I wanted to ask you, because I couldn't help but notice you are two tons of fun. Just curious, is it like a thyroid problem? Or is that just some deep-seated self esteem issue? Because you know, they're just doughnuts. They're not love.`,
  `Hey, see if they've got any pie. Bring me some pie. I love me some pie.`,
  `I lost my shoe.`,
  `I’m Batman!`,
  `I'm gonna go stop the Big Bad Wolf. Which is the weirdest thing I've ever said.`,
  `Can I shoot her?`,
  `Not in public.`,
  `Don’t objectify me.`,
  `How do you sleep at night?? On silk sheets, rolling naked in money.`,
  `Can you think of a worse hell? Well, there's Hell.`,
  `You fudgin' touch me again, I'll fudgin' kill ya!`,
  `Yeah right. Nice guess. It wasn't guess. Right, you're a mind reader. Cut it out Sam. Sam! You think you're being funny but you're being really, really childish. Sam Winchester wears make-up. Sam Winchester cries his way through sex. Sam Winchesters keeps a ruler by the bed and every morning when he wakes up … OK, enough!`,
  `These tacos taste funny to you?`,
  `I shot the sheriff. But you didn't shoot the deputy.`,
  `Hey, Ed, listen to me. There's some salt in my duffel. Make a circle and get inside. Inside your duffel bag?? In the salt, you idiot!`,
  `I'd like to think it's because of my perky nipples.`,
  `What visage are you in now? Holy tax accountant?`,
  `Sammy, wherever you are, mom is a babe. I'm going to hell ... again.`,
  `Sam loves research. He does. He keeps it under his mattress with his KY.`,
  `Ah, you have brought a repast. Excellent. Continue to be of such service, and your life will be spared.`,
  `Oh, I'm not carrying that. It could go off. I'll man the flashlight.`,
  `That was scary!`,
  `That is exactly why our lives suck. I mean,come on, we hunt monsters! What the hell? I mean, normal people, they see a monster, and they run. But not us, no, no, no, we search out things that want to kill us. Or eat us! You know who does that? Crazy people! We are insane!You know, and then there's the bad diner food and then the skeevy motel rooms and then the truck-stop waitress with the bizarre rash. I mean, who wants this life, Sam? Seriously? Do you actually like being stuck in a car with me eight hours a day, every single day? I don't think so! I mean, I drive too fast. And I listen to the same five albums over and over and over again, and I sing along. I'm annoying, I know that. And you, you're gassy! You eat half a burrito, and you get toxic! I mean, you know what? You can forget it. Stay away from me Sam, OK? Because I am done with it. I'm done with the monsters and the hellhounds and the ghost sickness and the damn apocalypse. I'm out. I'm done. Quit.`,
  `Zombie-ghost orgy, huh? Well, that's it. I'm torching everybody.`,
  `On Thursdays, we're teddy bear doctors.`,
  `This body is 100 percent socially conscious. I recycle. Al Gore would be proud.`,
  `She was convinced that he wasn't her real daddy.`,
  `Who was? The plumber, hmmm? A little snaking the pipes??`,
  `He's famous, kind of. For what,douchebaggery?`,
  `Today you will have the honor of playing one of the greatest games ever invented. A game of skill, agility, cunning. A game with one simple rule. Dodge.`,
  `The whistle makes me their god.`,
  `Uriel's the funniest angel in the garrison. Ask anyone`,
  `Details are everything. You don’t want to go fighting ghosts without any health insurance.`,
  `There's actually fans. Not many of them, but still. For fans, they sure do complain a lot.`,
  `Well,boo-hoo!I am so sorry your feelings are hurt,princess! Are you under the impression that family's supposed to make you feel good, make you an apple pie,maybe? They're supposed to make you miserable! That's why they're family!`,
  `No, he's not on any flatbread.`,
  `Last time you zapped me someplace, I didn't poop for a week.`,
  `You were wasted by a teenage mutant ninja angel?`,
  `This isn’t funny, Dean. The voice says I'm almost out of minutes!`,
  `She made us try on her panties. They were pink. And satiny. And you know what? We kind of liked it.`,
  `Check it out. Four score and seven years ago ... I had a funny hat.`,
  `Brains trumps legs, apparently.`,
  `I believe that he-witch gave you the clap.`,
  `Now have we done feeling our feelings? Because I'd like to get out of this room before we both start growing lady parts.`,
  `And there's Johnny Drake. Oh he's not even alive, he's a ghost in the mind of her. The sexy, but neurotic doctor over there.`,
  `So this show has ghosts? Why? I don't know. It is compelling.`,
  `Mr. Trickster does not like pretty boy angels.`,
  `Calm down?? I am wearing sunglasses at night! You know who does that? No-talent douchebags! I hate this game! I hate that we're in a procedural cop show, and you want to know why? Because I hate procedural cop shows! There's like three hundred of them on television, they're all the freakin' same.`,
  `One leather jacket, one sasquatch.`,
  `I don’t understand that reference.`,
  `She’s, uh, Glenn Close.`,
  `Dude, you punched a cupid.`,
  `I found a liquor store. And I drank it.`,
  `Ass-butt!!!`
]

export default new Command([`supernatural`, `sn`], message => {
  const randomGif = gifs[Math.floor(Math.random() * (gifs.length - 1))]
  const randomQuote = quotes[Math.floor(Math.random() * (quotes.length - 1))]
  const [user] = message.mentions

  const embed = new MessageEmbed()
    .setDescription(`${user ? user.mention : message.author.mention}, ${randomQuote}`)
    .setAuthor(message.member?.nick || message.author.username, message.author.avatarURL)
    .setImage(randomGif)

  return message.channel.createMessage({ embed: embed.code })
})