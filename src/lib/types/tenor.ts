export interface TenorGif {
  weburl: string
  results?: TenorGifData[]
}

export interface TenorGifData {
  tags: string[]
  url: string
  media: Media[]
  created: number
  shares: number
  itemurl: string
  composite: null
  hasaudio: boolean
  title: string
  id: string
}

export interface Media {
  nanomp4: MediaData
  nanowebm: MediaData
  tinygif: MediaData
  tinymp4: MediaData
  tinywebm: MediaData
  webm: MediaData
  gif: MediaData
  mp4: MediaData
  loopedmp4: MediaData
  mediumgif: MediaData
  nanogif: MediaData
}

export interface MediaData {
  url: string
  dims: number[]
  preview: string
  size: number
  duration?: number
}
