import fetch, { RequestInfo, RequestInit } from 'node-fetch'
import config from '../../../config'

const authenticatedFetch = (url: RequestInfo, opts: RequestInit = {}) =>
  fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.twitchtv.v5+json',
      Authorization: `Bearer ${config.twitch.clientSecret}`,
      'Client-ID': config.twitch.clientId,
      ...(opts.headers || {})
    }
  })

type HubCreateParams = {
  'hub.callback': string
  'hub.mode': 'subscribe' | 'unsubscribe'
  'hub.topic': string
  'hub.lease_seconds': number
  'hub.secret'?: string
}

export type TwitchStream = {
  id: string
  user_id: string
  user_name: string
  game_id: string
  community_ids: Array<string>
  type: 'live' | ''
  title: string
  viewer_count: number
  started_at: string
  language: string
  thumbnail_url: string
}

type TwitchUser = {
  _id: string
  bio: string
  created_at: string
  display_name: string
  logo: string
  name: string
  type: 'staff' | 'user'
  updated_at: string
}

export default {
  users: {
    byLogin: (login: string): Promise<{ _total: number; users: Array<TwitchUser> }> =>
      authenticatedFetch(`https://api.twitch.tv/kraken/users?login=${login}`).then(r => r.json())
  },
  webhooks: {
    hub: {
      create: (params: HubCreateParams) =>
        authenticatedFetch('https://api.twitch.tv/helix/webhooks/hub', {
          method: 'POST',
          body: JSON.stringify(params)
        })
          .then(res => res.ok)
          .catch(() => false)
    }
  }
}
