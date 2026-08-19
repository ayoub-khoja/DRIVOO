import { AxiosInstance } from 'axios'
import * as bookcarsTypes from ':bookcars-types'

export const createChatApi = (client: AxiosInstance) => ({
  getConversations: (): Promise<bookcarsTypes.ChatConversationView[]> =>
    client.get('/api/chat/conversations', { withCredentials: true }).then((res) => res.data),

  getUnreadCount: (): Promise<{ count: number }> =>
    client.get('/api/chat/unread-count', { withCredentials: true }).then((res) => res.data),

  openConversation: (payload: bookcarsTypes.OpenChatPayload = {}): Promise<bookcarsTypes.ChatConversationView> =>
    client.post('/api/chat/conversations', payload, { withCredentials: true }).then((res) => res.data),

  getMessages: (conversationId: string, page = 1): Promise<bookcarsTypes.ChatMessageView[]> =>
    client
      .get(`/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
        params: { page },
        withCredentials: true,
      })
      .then((res) => res.data),

  sendMessage: (conversationId: string, text: string): Promise<bookcarsTypes.ChatMessageView> =>
    client
      .post(
        `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
        { text },
        { withCredentials: true },
      )
      .then((res) => res.data),

  markRead: (conversationId: string): Promise<number> =>
    client
      .post(`/api/chat/conversations/${encodeURIComponent(conversationId)}/read`, {}, { withCredentials: true })
      .then((res) => res.status),

  searchAgencies: (keyword = ''): Promise<bookcarsTypes.ChatPeer[]> =>
    client
      .get('/api/chat/agencies', {
        params: { s: keyword },
        withCredentials: true,
      })
      .then((res) => res.data),

  pingPresence: (): Promise<number> =>
    client.post('/api/chat/presence', {}, { withCredentials: true }).then((res) => res.status),
})
