import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AxiosInstance } from 'axios'
import {
  ArrowBack,
  ChatBubbleOutline,
  Close,
  Search,
  SendRounded,
} from '@mui/icons-material'
import { IconButton, InputAdornment, TextField } from '@mui/material'
import { format } from 'date-fns'
import { fr, enUS, arTN } from 'date-fns/locale'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { createChatApi } from '@/services/ChatService'
import * as langHelper from '@/utils/langHelper'
import { strings } from '@/lang/messenger'
import drivooLogo from '@/assets/img/logoWhite.png'

import '@/assets/css/messenger.css'

type MessengerWidgetProps = {
  axiosInstance: AxiosInstance
  currentUser: bookcarsTypes.User
  mode: 'admin' | 'agency'
  theme?: 'dark' | 'light'
}

const resolveAvatar = (avatar?: string | null) => {
  if (!avatar) {
    return ''
  }
  if (/^https?:\/\//i.test(avatar)) {
    return avatar
  }
  return bookcarsHelper.joinURL(env.CDN_USERS, avatar)
}

const initialOf = (name?: string) => (name || 'D').trim().charAt(0).toUpperCase()

const kindLabel = (kind?: bookcarsTypes.ChatPeer['kind']) => {
  if (kind === 'support') {
    return strings.KIND_SUPPORT
  }
  if (kind === 'branch') {
    return strings.KIND_BRANCH
  }
  if (kind === 'parent') {
    return strings.KIND_PARENT
  }
  return ''
}

const PeerAvatar = ({ peer }: { peer: bookcarsTypes.ChatPeer }) => {
  const isSupport = peer.kind === 'support' || peer.type === bookcarsTypes.UserType.Admin
  const src = isSupport ? drivooLogo : resolveAvatar(peer.avatar)
  return (
    <span className="drivoo-messenger-avatar-wrap">
      <span className={`drivoo-messenger-avatar ${isSupport ? 'is-logo' : ''}`}>
        {src ? <img src={src} alt="" /> : initialOf(peer.fullName)}
      </span>
      <span className={`drivoo-messenger-status ${peer.online ? 'is-online' : ''}`} aria-hidden />
    </span>
  )
}

const MessengerWidget = ({ axiosInstance, currentUser, mode, theme = 'dark' }: MessengerWidgetProps) => {
  const api = useMemo(() => createChatApi(axiosInstance), [axiosInstance])
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [view, setView] = useState<'list' | 'thread'>('list')
  const [conversations, setConversations] = useState<bookcarsTypes.ChatConversationView[]>([])
  const [contacts, setContacts] = useState<bookcarsTypes.ChatPeer[]>([])
  const [keyword, setKeyword] = useState('')
  const [active, setActive] = useState<bookcarsTypes.ChatConversationView | null>(null)
  const [messages, setMessages] = useState<bookcarsTypes.ChatMessageView[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const activeIdRef = useRef<string | null>(null)
  const language = langHelper.getLanguage()
  const locale = language === 'fr' ? fr : language === 'ar' ? arTN : enUS

  const loadUnread = useCallback(async () => {
    try {
      const data = await api.getUnreadCount()
      setUnread(data.count || 0)
    } catch {
      setUnread(0)
    }
  }, [api])

  const loadConversations = useCallback(async () => {
    const rows = await api.getConversations()
    setConversations(rows)
    const conversationId = activeIdRef.current
    if (conversationId) {
      const next = rows.find((row) => row._id === conversationId)
      if (next) {
        setActive(next)
      }
    }
    return rows
  }, [api])

  const loadContacts = useCallback(async (value = '') => {
    setContacts(await api.searchAgencies(value.trim()))
  }, [api])

  const openThread = useCallback(async (conversation: bookcarsTypes.ChatConversationView) => {
    activeIdRef.current = conversation._id
    setActive(conversation)
    setView('thread')
    const rows = await api.getMessages(conversation._id)
    setMessages(rows)
    await api.markRead(conversation._id)
    await loadUnread()
    await loadConversations()
  }, [api, loadConversations, loadUnread])

  useEffect(() => {
    api.pingPresence().catch(() => undefined)
    const timer = window.setInterval(() => {
      api.pingPresence().catch(() => undefined)
    }, 20000)
    return () => window.clearInterval(timer)
  }, [api])

  useEffect(() => {
    loadUnread()
    const timer = window.setInterval(loadUnread, open ? 4000 : 12000)
    return () => window.clearInterval(timer)
  }, [loadUnread, open])

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false
    const start = async () => {
      await Promise.all([loadConversations(), loadContacts('')])
      if (!cancelled) {
        setView((current) => (activeIdRef.current ? current : 'list'))
      }
    }

    start().catch(() => undefined)
    return () => {
      cancelled = true
    }
    // Boot only when the widget is opened, not on every callback identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const timer = window.setInterval(async () => {
      loadConversations().catch(() => undefined)
      if (!keyword.trim()) {
        loadContacts('').catch(() => undefined)
      }
      const conversationId = activeIdRef.current
      if (conversationId) {
        try {
          const rows = await api.getMessages(conversationId)
          setMessages(rows)
        } catch {
          // keep current thread
        }
      }
    }, 4000)

    return () => window.clearInterval(timer)
  }, [open, api, keyword, loadConversations, loadContacts])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, open, view])

  const onSearchContacts = async (value: string) => {
    setKeyword(value)
    await loadContacts(value)
  }

  const startPeerChat = async (peerId: string) => {
    const conversation = await api.openConversation({ peerId, agencyId: peerId })
    setKeyword('')
    await loadContacts('')
    await openThread(conversation)
  }

  const send = async () => {
    if (!active || !draft.trim() || sending) {
      return
    }
    setSending(true)
    try {
      const message = await api.sendMessage(active._id, draft.trim())
      setMessages((current) => [...current, message])
      setDraft('')
      await loadConversations()
      await loadUnread()
    } finally {
      setSending(false)
    }
  }

  const showList = view === 'list'
  const conversationPeerIds = new Set(conversations.map((conversation) => conversation.peer._id))
  const newContacts = contacts.filter((contact) => !conversationPeerIds.has(contact._id))
  const threadStatus = active?.peer.online ? strings.ONLINE : strings.OFFLINE

  return (
    <div className={`drivoo-messenger ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
      {open && (
        <section className="drivoo-messenger-panel" aria-label={strings.TITLE}>
          <div className="drivoo-messenger-head">
            <div className="drivoo-messenger-head-main">
              {!showList && (
                <IconButton
                  className="drivoo-messenger-icon-btn"
                  onClick={() => {
                    setView('list')
                    setActive(null)
                    activeIdRef.current = null
                  }}
                  aria-label={strings.BACK}
                >
                  <ArrowBack />
                </IconButton>
              )}
              <div>
                <h3>{!showList && active ? active.peer.fullName : strings.TITLE}</h3>
                <p>
                  {!showList && active
                    ? threadStatus
                    : mode === 'admin'
                      ? strings.ADMIN_SUBTITLE
                      : strings.AGENCY_SUBTITLE}
                </p>
              </div>
            </div>
            <IconButton className="drivoo-messenger-icon-btn" onClick={() => setOpen(false)} aria-label={strings.CLOSE}>
              <Close />
            </IconButton>
          </div>

          {showList && (
            <>
              <div className="drivoo-messenger-search">
                <TextField
                  fullWidth
                  size="small"
                  value={keyword}
                  placeholder={mode === 'admin' ? strings.SEARCH_AGENCY : strings.SEARCH_CONTACT}
                  onChange={(event) => onSearchContacts(event.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </div>
              <div className="drivoo-messenger-list">
                {newContacts.map((contact) => (
                  <button key={`new-${contact._id}`} type="button" className="drivoo-messenger-row" onClick={() => startPeerChat(contact._id)}>
                    <PeerAvatar peer={contact} />
                    <span className="drivoo-messenger-row-copy">
                      <strong>{contact.fullName}</strong>
                      <span>{kindLabel(contact.kind) || (contact.online ? strings.ONLINE : strings.START_CHAT)}</span>
                    </span>
                  </button>
                ))}
                {conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    type="button"
                    className={`drivoo-messenger-row ${active?._id === conversation._id ? 'is-active' : ''}`}
                    onClick={() => openThread(conversation)}
                  >
                    <PeerAvatar peer={conversation.peer} />
                    <span className="drivoo-messenger-row-copy">
                      <strong>{conversation.peer.fullName}</strong>
                      <span>{conversation.lastMessage || kindLabel(conversation.peer.kind) || strings.NO_MESSAGES}</span>
                    </span>
                    {conversation.unreadCount > 0 && <span className="drivoo-messenger-unread">{conversation.unreadCount}</span>}
                  </button>
                ))}
                {conversations.length === 0 && newContacts.length === 0 && (
                  <div className="drivoo-messenger-empty">{strings.EMPTY}</div>
                )}
              </div>
            </>
          )}

          {!showList && active && (
            <div className="drivoo-messenger-thread">
              <div className="drivoo-messenger-messages">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`drivoo-messenger-bubble-msg ${message.sender === currentUser._id ? 'is-mine' : 'is-theirs'}`}
                  >
                    {message.text}
                    <time>
                      {format(new Date(message.createdAt), 'p', { locale })}
                    </time>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form
                className="drivoo-messenger-composer"
                onSubmit={(event) => {
                  event.preventDefault()
                  send()
                }}
              >
                <textarea
                  value={draft}
                  placeholder={strings.PLACEHOLDER}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void send()
                    }
                  }}
                />
                <IconButton className="drivoo-messenger-send" type="submit" disabled={sending || !draft.trim()} aria-label={strings.SEND}>
                  <SendRounded />
                </IconButton>
              </form>
            </div>
          )}
        </section>
      )}

      <button type="button" className="drivoo-messenger-bubble" onClick={() => setOpen((value) => !value)} aria-label={strings.TITLE}>
        {unread > 0 && <span className="drivoo-messenger-bubble-badge">{unread > 99 ? '99+' : unread}</span>}
        <ChatBubbleOutline />
      </button>
    </div>
  )
}

export default MessengerWidget
