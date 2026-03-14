import { MediaItem } from '@models/media.model'

export interface StackItem {
  id: string
  kind: 'stack'

  items: MediaItem[]

  createdAt: Date
  favorite: boolean
}
