import GamerClient from '../../lib/structures/GamerClient'
import { Command } from 'yuuko'
import { SetupCollectorData } from '../../lib/types/gamer'
import { CategoryChannel, Overwrite, TextChannel, NewsChannel, Constants } from 'eris'
import { highestRole, MessageEmbed } from 'helperis'
import constants from '../../constants'
import { upsertGuild } from '../../database/mongoHandler'
import { deleteMessage } from '../../lib/utils/eris'

export default new Command('setup', async (message, args, context) => {
  if (!message.member || !message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  // Check ADMIN perm
  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!botMember?.permission.has('administrator')) {
    return message.channel.createMessage(language('utility/setup:NEED_ADMIN_PERM'))
  }

  const settings = await upsertGuild(message.member.guild.id)
  if (message.author.id !== message.member.guild.ownerID)
    return message.channel.createMessage(language('utility/setup:NOT_OWNER'))

  // Placeholder for future options
  if (args.length) return

  const featureListEmbed = new MessageEmbed()
    .setTitle(language('utility/setup:WELCOME_SETUP'))
    .setDescription(language('utility/setup:THANKS_GAMER'))
    .addField(language('utility/setup:VERIFICATION'), language('utility/setup:CURRENT'))
    .addField(language('utility/setup:SOCIAL_NETWORK'), language('utility/setup:UPCOMING'))
    .addField(language('utility/setup:REACTION_ROLE_COLOR_WHEEL'), language('utility/setup:UPCOMING'))
    .addField(language('utility/setup:MUTE'), language('utility/setup:UPCOMING'))
    .addField(language('utility/setup:PROFANITY'), language('utility/setup:UPCOMING'))
    .addField(language('utility/setup:SERVER_LOGS'), language('utility/setup:UPCOMING'))
    .addField(language('utility/setup:MAIL'), language('utility/setup:UPCOMING'))

  const questionEmbed = new MessageEmbed()
    .setTitle(language('utility/setup:VERIFY_TITLE'))
    .setDescription(language('utility/setup:VERIFY_DESC'))
    .setFooter(language('utility/setup:CONFIRM'), message.member.guild.iconURL)
    .setImage('https://i.imgur.com/y4hacfC.gif')
  const helperMessage = await message.channel.createMessage({ embed: featureListEmbed.code })
  const questionMessage = await message.channel.createMessage({ embed: questionEmbed.code })

  return Gamer.collectors.set(message.author.id, {
    authorID: message.author.id,
    channelID: message.channel.id,
    createdAt: Date.now(),
    guildID: message.guildID,
    data: {
      step: 1
    },
    callback: async (msg, collector) => {
      if (!msg.guildID || !msg.member) return
      const data = collector.data as SetupCollectorData
      const CANCEL_OPTIONS = language(`common:CANCEL_OPTIONS`, { returnObjects: true })
      if ([...CANCEL_OPTIONS, 'q', 'quit'].includes(msg.content.toLowerCase())) {
        msg.channel.createMessage(language(`embedding/embedset:CANCELLED`, { mention: msg.author.mention }))
        return deleteMessage(helperMessage)
      }

      const args = msg.content.split(' ')
      const [type] = args
      collector.createdAt = Date.now()

      const YES_OPTIONS = language('common:YES_OPTIONS', { returnObjects: true })
      const NO_OPTIONS = language('common:NO_OPTIONS', { returnObjects: true })

      if (
        ![1.2, 1.3, 1.4, 3.1, 6.1].includes(data.step) &&
        ![...YES_OPTIONS, ...NO_OPTIONS].includes(type.toLowerCase())
      ) {
        msg.channel
          .createMessage(language(`embedding/embedset:INVALID_EDIT`, { mention: msg.author.mention }))
          .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))
        return Gamer.collectors.set(msg.author.id, collector)
      }

      switch (data.step) {
        // Verification Step
        case 1:
          // If the user does not want a verification system skip to step 2
          if (NO_OPTIONS.includes(type.toLowerCase())) {
            questionEmbed
              .setTitle(language('utility/setup:NETWORK_TITLE'))
              .setDescription(language('utility/setup:NETWORK_DESC'))
              .setImage('')
            questionMessage.edit({ embed: questionEmbed.code })
            data.step = 2
            break
          }

          // The user wants a verification system. Now we ask which type to setup.
          questionEmbed
            .setTitle(language('utility/setup:VERIFY_AUTOMATE_TITLE'))
            .setDescription(language('utility/setup:VERIFY_AUTOMATE_DESC'))
            .setImage('')
          questionMessage.edit({ embed: questionEmbed.code })
          data.step = 1.1
          break
        case 1.1:
          if (NO_OPTIONS.includes(type.toLowerCase())) {
            // Begin manual method
            questionEmbed
              .setTitle(language('utility/setup:VERIFY_ROLE_TITLE'))
              .setDescription(language('utility/setup:VERIFY_ROLE_DESC'))
              .setFooter(language('utility/setup:VERIFY_ROLE_FOOTER'), msg.member.guild.iconURL)
            questionMessage.edit({ embed: questionEmbed.code })
            data.step = 1.2
            break
          }

          // The user said to automate the setup
          await Gamer.helpers.scripts.createVerificationSystem(msg.member.guild, settings)
          // Send message about step 2
          msg.channel
            .createMessage(language('utility/setup:VERIFY_COMPLETE'))
            .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))
          questionEmbed
            .setTitle(language('utility/setup:NETWORK_TITLE'))
            .setDescription(language('utility/setup:NETWORK_DESC'))
            .setImage('')
          questionMessage.edit({ embed: questionEmbed.code })
          data.step = 2
          break
        case 1.2:
          const REASON = language(`settings/setverify:REASON`)
          const overwrites: Overwrite[] = [
            { id: Gamer.user.id, allow: 3072, deny: 0, type: 'member' },
            { id: msg.member.guild.id, allow: 0, deny: 1024, type: 'role' }
          ]
          if (settings.staff.adminRoleID) {
            overwrites.push({
              id: settings.staff.adminRoleID,
              allow: 3072,
              deny: 0,
              type: 'role'
            })
          }
          settings.staff.modRoleIDs.forEach(id => overwrites.push({ id, allow: 3072, deny: 0, type: 'role' }))

          let category = settings.verify.categoryID
            ? msg.member.guild.channels.get(settings.verify.categoryID)
            : undefined

          if (!(category instanceof CategoryChannel)) {
            category = await msg.member.guild.createChannel(language(`basic/verify:CATEGORY_NAME`), 4, {
              reason: REASON,
              permissionOverwrites: overwrites
            })
          }

          settings.verify.categoryID = category.id
          const role =
            msg.content.toLowerCase() === 'default'
              ? await msg.member.guild.createRole({ name: language('basic/verify:VERIFY_ROLENAME') })
              : msg.member.guild.roles.get(msg.roleMentions.length ? msg.roleMentions[0] : msg.content) ||
                msg.member.guild.roles.find(r => r.name.toLowerCase() === msg.content.toLowerCase())
          if (!role) {
            msg.channel
              .createMessage(language('utility/setup:INVALID_ROLE'))
              .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))
            break
          }

          // Create the channel inside the category so it has the proper permissions
          const verifyChannel = await msg.member.guild.createChannel(language(`basic/verify:CHANNEL_NAME`), 0, {
            reason: REASON,
            parentID: category.id
          })
          verifyChannel.editPermission(role.id, 3072, 0, `role`)

          const botsHighestRole = highestRole(botMember)
          if (botsHighestRole.position <= role.position) {
            msg.channel
              .createMessage(language('utility/setup:ROLE_TOO_HIGH'))
              .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))
            break
          }

          msg.member.guild.channels.forEach(channel => {
            if (channel.parentID === settings.verify.categoryID || channel.id === settings.verify.categoryID) {
              return
            }

            const hasPermission = Gamer.helpers.discord.checkPermissions(channel, Gamer.user.id, [
              'manageChannels',
              'manageRoles',
              'readMessages'
            ])
            if (!hasPermission) return

            if (channel.parentID) {
              const parent = channel.guild.channels.get(channel.parentID) as CategoryChannel

              let isSynced = true
              channel.permissionOverwrites.forEach((permission, key) => {
                const parentPerm = parent.permissionOverwrites.get(key)
                // If the parent has this user/role permission and they are the exact same perms then check next permission
                if (parentPerm && parentPerm.allow === permission.allow && parentPerm.deny === permission.deny) {
                  return
                }

                isSynced = false
              })

              if (isSynced) return
            }
            // Update the channel perms
            channel.editPermission(role.id, 0, 1024, `role`)
          })

          questionEmbed
            .setTitle(language('utility/setup:VERIFY_JSON_TITLE'))
            .setDescription(language('utility/setup:VERIFY_JSON_DESC'))
            .setFooter(language('utility/setup:VERIFY_JSON_FOOTER'), msg.member.guild.iconURL)
          questionMessage.edit({ embed: questionEmbed.code })
          settings.verify.enabled = true
          settings.verify.roleID = role.id
          settings.save()
          data.step = 1.3
          break
        case 1.3:
          if (msg.content.toLowerCase() === 'default') {
            settings.verify.firstMessageJSON = JSON.stringify({
              description: [
                language('settings/setverify:THANKS'),
                ``,
                language('settings/setverify:UNLOCK'),
                `**${settings.prefix}verify end**`
              ].join('\n'),
              author: {
                name: language('settings/setverify:AMAZING'),
                // eslint-disable-next-line @typescript-eslint/camelcase
                icon_url: 'https://i.imgur.com/0LxU5Yy.jpg'
              },
              image: 'https://i.imgur.com/oN4YjaY.gif'
            })
            settings.save()
            data.step = 1.4

            questionEmbed
              .setTitle(language('utility/setup:VERIFY_AUTOROLE_TITLE'))
              .setDescription(language('utility/setup:VERIFY_AUTOROLE_DESC'))
              .setFooter(language('utility/setup:VERIFY_AUTOROLE_FOOTER'))
            questionMessage.edit({ embed: questionEmbed.code })
            break
          }

          let json: unknown
          try {
            json = JSON.parse(msg.content)
          } catch {}

          if (!json) {
            msg.channel
              .createMessage(language(`settings/setverify:INVALID_JSON_MESSAGE`))
              .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))
            break
          }

          settings.verify.firstMessageJSON = msg.content
          settings.save()
          questionEmbed
            .setTitle(language('utility/setup:VERIFY_AUTOROLE_TITLE'))
            .setDescription(language('utility/setup:VERIFY_AUTOROLE_DESC'))
            .setFooter(language('utility/setup:VERIFY_AUTOROLE_FOOTER'))
          questionMessage.edit({ embed: questionEmbed.code })
          data.step = 1.4
          break
        case 1.4:
          if (NO_OPTIONS.includes(msg.content.toLowerCase())) {
            data.step = 2
            msg.channel
              .createMessage(language('utility/setup:VERIFY_COMPLETE'))
              .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))

            questionEmbed
              .setTitle(language('utility/setup:NETWORK_TITLE'))
              .setDescription(language('utility/setup:NETWORK_DESC'))
              .setImage('')
              .setFooter(language('utility/setup:CONFIRM'), msg.member.guild.iconURL)
            questionMessage.edit({ embed: questionEmbed.code })
          }

          const autorole =
            msg.member.guild.roles.get(msg.roleMentions.length ? msg.roleMentions[0] : msg.content.toLowerCase()) ||
            msg.member.guild.roles.find(r => r.name.toLowerCase() === msg.content.toLowerCase())
          if (!autorole) {
            msg.channel
              .createMessage(language('utility/setup:INVALID_ROLE'))
              .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))
            break
          }

          msg.channel
            .createMessage(language('utility/setup:VERIFY_COMPLETE'))
            .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))
          questionEmbed
            .setTitle(language('utility/setup:NETWORK_TITLE'))
            .setDescription(language('utility/setup:NETWORK_DESC'))
            .setImage('')
            .setFooter(language('utility/setup:CONFIRM'), msg.member.guild.iconURL)
          questionMessage.edit({ embed: questionEmbed.code })
          settings.moderation.roleIDs.autorole = autorole.id
          settings.verify.discordVerificationStrictnessEnabled = false
          data.step = 2
          break
        // Social Network Feature
        case 2:
          await helperMessage.edit({
            embed: {
              ...helperMessage.embeds[0],
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              fields: helperMessage.embeds[0].fields!.map((field, index) => {
                if (index < 1) return { name: field.name, value: language('utility/setup:DONE') }
                return {
                  name: field.name,
                  value: index === 1 ? language('utility/setup:CURRENT') : language('utility/setup:UPCOMING')
                }
              })
            }
          })

          if (YES_OPTIONS.includes(msg.content.toLowerCase())) {
            const networkcreateCommand = Gamer.commandForName('networkcreate')
            if (!networkcreateCommand) {
              break
            }

            networkcreateCommand.execute(msg, [], { ...context, commandName: 'networkcreate' })
            await Gamer.helpers.utils.sleep(5)
            msg.channel.createMessage(language('utility/setup:NETWORK_COMPLETE'))
          }

          data.step = 3
          questionEmbed
            .setTitle(language('utility/setup:COLOR_WHEEL_TITLE'))
            .setDescription(language('utility/setup:COLOR_WHEEL_DESC'))
          questionMessage.edit({ embed: questionEmbed.code })
          break
        // Reaction Role Color Wheel
        case 3:
          await helperMessage.edit({
            embed: {
              ...helperMessage.embeds[0],
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              fields: helperMessage.embeds[0].fields!.map((field, index) => {
                if (index < 2) return { name: field.name, value: language('utility/setup:DONE') }
                return {
                  name: field.name,
                  value: index === 2 ? language('utility/setup:CURRENT') : language('utility/setup:UPCOMING')
                }
              })
            }
          })

          if (NO_OPTIONS.includes(msg.content.toLowerCase())) {
            data.step = 4
            questionEmbed
              .setTitle(language('utility/setup:MUTE_TITLE'))
              .setDescription(language('utility/setup:MUTE_DESC'))
            questionMessage.edit({ embed: questionEmbed.code })
            break
          }

          data.step = 3.1
          questionEmbed
            .setTitle(language('utility/setup:COLOR_WHEEL_CHANNEL_TITLE'))
            .setDescription(language('utility/setup:COLOR_WHEEL_CHANNEL_DESC'))
            .setFooter(language('utility/setup:COLOR_WHEEL_CHANNEL_FOOTER'), msg.member.guild.iconURL)
          questionMessage.edit({ embed: questionEmbed.code })
          break
        case 3.1:
          const [colorWheelChannelID] = msg.channelMentions
          if (!colorWheelChannelID) {
            break
          }

          const colorWheelChannel = msg.member.guild.channels.get(colorWheelChannelID)
          if (colorWheelChannel instanceof TextChannel || colorWheelChannel instanceof NewsChannel) {
            if (msg.member.guild.roles.size + 20 > 250) {
              msg.channel
                .createMessage(language(`roles/reactionrolecreate:MAX_ROLES`))
                .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))
              break
            }

            if (
              !Gamer.helpers.discord.checkPermissions(colorWheelChannel, Gamer.user.id, [
                `readMessages`,
                `sendMessages`,
                `embedLinks`,
                `externalEmojis`,
                `readMessageHistory`,
                `addReactions`
              ])
            ) {
              msg.channel
                .createMessage(language(`roles/reactionrolecreate:MISSING_PERMISSION`))
                .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))
              break
            }

            const placeholderMessage = await colorWheelChannel.createMessage(
              language('utility/setup:COLOR_WHEEL_PREPARING')
            )

            await Gamer.helpers.scripts.createReactionRoleColors(placeholderMessage)
            deleteMessage(placeholderMessage)
          }

          data.step = 4
          msg.channel
            .createMessage(language('utility/setup:COLOR_WHEEL_COMPLETE'))
            .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))
          questionEmbed
            .setTitle(language('utility/setup:MUTE_TITLE'))
            .setDescription(language('utility/setup:MUTE_DESC'))
            .setFooter(language('utility/setup:CONFIRM'))
          questionMessage.edit({ embed: questionEmbed.code })
          break
        // Mute system
        case 4:
          await helperMessage.edit({
            embed: {
              ...helperMessage.embeds[0],
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              fields: helperMessage.embeds[0].fields!.map((field, index) => {
                if (index < 3) return { name: field.name, value: language('utility/setup:DONE') }
                return {
                  name: field.name,
                  value: index === 3 ? language('utility/setup:CURRENT') : language('utility/setup:UPCOMING')
                }
              })
            }
          })
          if (YES_OPTIONS.includes(msg.content.toLowerCase())) {
            await Gamer.helpers.scripts.createMuteSystem(msg.member.guild, settings)
            msg.channel
              .createMessage(language('utility/setup:MUTE_COMPLETE'))
              .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))
          }

          data.step = 5
          questionEmbed
            .setTitle(language('utility/setup:PROFANITY_TITLE'))
            .setDescription(language('utility/setup:PROFANITY_DESC'))
            .setFooter(language('utility/setup:CONFIRM'), msg.member.guild.iconURL)
          questionMessage.edit({ embed: questionEmbed.code })
          break
        // Profanity words autoadded
        case 5:
          await helperMessage.edit({
            embed: {
              ...helperMessage.embeds[0],
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              fields: helperMessage.embeds[0].fields!.map((field, index) => {
                if (index < 4) return { name: field.name, value: language('utility/setup:DONE') }
                return {
                  name: field.name,
                  value: index === 4 ? language('utility/setup:CURRENT') : language('utility/setup:UPCOMING')
                }
              })
            }
          })

          if (YES_OPTIONS.includes(msg.content.toLowerCase())) {
            for (const word of constants.profanity.soft) {
              if (!settings.moderation.filters.profanity.words.includes(word))
                settings.moderation.filters.profanity.words.push(word)
            }
            for (const word of constants.profanity.strict) {
              if (!settings.moderation.filters.profanity.strictWords.includes(word))
                settings.moderation.filters.profanity.strictWords.push(word)
            }

            settings.moderation.filters.profanity.enabled = true
            settings.save()
            msg.channel
              .createMessage(language('utility/setup:PROFANITY_COMPLETE'))
              .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))
          }

          data.step = 6
          questionEmbed
            .setTitle(language('utility/setup:LOGS_TITLE'))
            .setDescription(language('utility/setup:LOGS_DESC'))
            .setFooter(language('utility/setup:CONFIRM'), msg.member.guild.iconURL)
          questionMessage.edit({ embed: questionEmbed.code })
          break
        // Server Logs
        case 6:
          await helperMessage.edit({
            embed: {
              ...helperMessage.embeds[0],
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              fields: helperMessage.embeds[0].fields!.map((field, index) => {
                if (index < 5) return { name: field.name, value: language('utility/setup:DONE') }
                return {
                  name: field.name,
                  value: index === 5 ? language('utility/setup:CURRENT') : language('utility/setup:UPCOMING')
                }
              })
            }
          })

          if (YES_OPTIONS.includes(msg.content.toLowerCase())) {
            await Gamer.helpers.scripts.createLogSystem(msg.member.guild, settings)
            msg.channel
              .createMessage(language('utility/setup:LOGS_COMPLETE'))
              .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))
          }

          data.step = 7
          questionEmbed
            .setTitle(language('utility/setup:MAIL_TITLE'))
            .setDescription(language('utility/setup:MAIL_DESC'))
            .setFooter(language('utility/setup:CONFIRM'), msg.member.guild.iconURL)
          questionMessage.edit({ embed: questionEmbed.code })
          break
        // Mail Feature
        case 7:
          await helperMessage.edit({
            embed: {
              ...helperMessage.embeds[0],
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              fields: helperMessage.embeds[0].fields!.map((field, index) => {
                if (index < 6) return { name: field.name, value: language('utility/setup:DONE') }
                return {
                  name: field.name,
                  value: index === 6 ? language('utility/setup:CURRENT') : language('utility/setup:UPCOMING')
                }
              })
            }
          })

          if (NO_OPTIONS.includes(msg.content.toLowerCase())) {
            data.step = 8
            questionEmbed
              .setTitle(language('utility/setup:WELCOME_TITLE'))
              .setDescription(language('utility/setup:WELCOME_DESC'))
              .setFooter(language('utility/setup:CONFIRM'), msg.member.guild.iconURL)
            questionMessage.edit({ embed: questionEmbed.code })
            break
          }

          settings.mails.enabled = true
          // Send a mail using the current user to showcase the test
          const mailCommand = Gamer.commandForName('mail')
          mailCommand?.execute(msg, [language('utility/setup:MAIL_FIRST')], { ...context, commandName: 'mail' })
          // Set up the support channel
          const supportChannel = await msg.member.guild.createChannel(language('utility/setup:SUPPORT').toLowerCase())
          const supportEmbed = new MessageEmbed()
            .setAuthor(language('utility/setup:NEED_HELP'), msg.member.guild.iconURL)
            .setDescription(language('utility/setup:ASK_HELP'))
          supportChannel.createMessage({ embed: supportEmbed.code })
          settings.mails.supportChannelID = supportChannel.id

          data.step = 7.1
          questionEmbed
            .setTitle(language('utility/setup:MAIL_LOG_CHANNEL_TITLE'))
            .setDescription(language('utility/setup:MAIL_LOG_CHANNEL_DESC'))
            .setFooter(language('utility/setup:MAIL_LOG_CHANNEL_FOOTER'), msg.member.guild.iconURL)
          questionMessage.edit({ embed: questionEmbed.code })
          break
        case 7.1:
          if (YES_OPTIONS.includes(msg.content.toLowerCase())) {
            const overwrites: Overwrite[] = [
              { id: Gamer.user.id, allow: Constants.Permissions.readMessages, deny: 0, type: 'member' },
              {
                id: msg.member.guild.id,
                allow: 0,
                deny: Constants.Permissions.readMessages,
                type: 'role'
              }
            ]
            const mailLogChannel = await msg.member.guild.createChannel(
              language('utility/setup:MAIL_LOGS').toLowerCase(),
              0,
              {
                permissionOverwrites: overwrites
              }
            )

            settings.mails.logChannelID = mailLogChannel.id
          } else {
            // If the user does not want to go default.
            const [mailLogChannelID] = msg.channelMentions
            if (!mailLogChannelID) {
              break
            }

            const mailLogChannel = msg.member.guild.channels.get(mailLogChannelID)
            if (!(mailLogChannel instanceof TextChannel) && !(mailLogChannel instanceof NewsChannel)) {
              break
            } else {
              settings.mails.logChannelID = mailLogChannel.id
            }
          }

          settings.save()
          msg.channel
            .createMessage(language('utility/setup:MAIL_LOG_COMPLETE'))
            .then(m => deleteMessage(m, 10, language(`common:CLEAR_SPAM`)))

          // TODO: Remove this when other steps are completed.
          deleteMessage(msg, 0, language(`common:CLEAR_SPAM`))
          deleteMessage(questionMessage, 0, language(`common:CLEAR_SPAM`))
          deleteMessage(helperMessage, 0, language(`common:CLEAR_SPAM`))
          return
          // questionEmbed
          //   .setTitle(language('utility/setup:WELCOME_TITLE'))
          //   .setDescription(language('utility/setup:WELCOME_DESC'))
          //   .setFooter(language('utility/setup:CONFIRM'), msg.member.guild.iconURL)
          // questionMessage.edit({ embed: questionEmbed.code })
          // data.step = 8

          break
        // Welcome system
        case 8:
          break
        // Goodbye System
        case 9:
          break
        // Events Card Channel
        case 10:
          break
        // Public Roles
        case 11:
          break
        // Set staff Roles
        case 12:
          break
        // Unlock VIP features or setup vip features
        case 13:
      }

      deleteMessage(msg, 0, language(`common:CLEAR_SPAM`))
      return Gamer.collectors.set(msg.author.id, collector)
    }
  })
})
