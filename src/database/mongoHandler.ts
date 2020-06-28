import Gamer from '..'

export function upsertMember(memberID: string, guildID: string) {
  return Gamer.database.models.member
    .findOneAndUpdate(
      { memberID, guildID },
      { memberID, guildID },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    .exec()
    .catch(error => {
      console.log('upsert member errored')
      throw error
    })
}

export function upsertUser(userID: string, guildIDs: string[]) {
  return Gamer.database.models.user
    .findOneAndUpdate({ userID }, { userID, guildIDs }, { upsert: true, new: true, setDefaultsOnInsert: true })
    .exec()
}

export function upsertGuild(guildID: string) {
  return Gamer.database.models.guild
    .findOneAndUpdate({ guildID }, { guildID }, { upsert: true, new: true, setDefaultsOnInsert: true })
    .exec()
}
