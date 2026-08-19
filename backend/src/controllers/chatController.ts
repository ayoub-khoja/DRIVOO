import mongoose from 'mongoose'
import { Request, Response } from 'express'
import escapeStringRegexp from 'escape-string-regexp'
import * as bookcarsTypes from ':bookcars-types'
import i18n from '../lang/i18n'
import User from '../models/User'
import ChatConversation from '../models/ChatConversation'
import ChatMessage from '../models/ChatMessage'
import * as env from '../config/env.config'
import * as helper from '../utils/helper'
import * as logger from '../utils/logger'
import * as firebaseMessaging from '../services/firebase/messaging'

const MESSAGE_PAGE_SIZE = 40
const MAX_TEXT = 4000
const ONLINE_WINDOW_MS = 45_000

const participantKeyOf = (a: string, b: string) => [a, b].sort().join(':')

const isOnline = (lastSeen?: Date | null) => Boolean(lastSeen && Date.now() - lastSeen.getTime() <= ONLINE_WINDOW_MS)

const parentIdOf = (user?: env.User | null) => user?.parentAgency?.toString() || ''

const peerKind = (current: env.User, peer: env.User): bookcarsTypes.ChatPeer['kind'] => {
  if (peer.type === bookcarsTypes.UserType.Admin) {
    return 'support'
  }
  if (current.type === bookcarsTypes.UserType.Admin) {
    return 'agency'
  }
  const currentId = current._id.toString()
  if (parentIdOf(peer) === currentId) {
    return 'branch'
  }
  if (parentIdOf(current) === peer._id.toString()) {
    return 'parent'
  }
  return 'agency'
}

const toPeer = (peer: env.User, current?: env.User | null): bookcarsTypes.ChatPeer => ({
  _id: peer._id.toString(),
  fullName: peer.fullName,
  avatar: peer.avatar || null,
  type: peer.type as bookcarsTypes.UserType,
  online: isOnline(peer.chatLastSeenAt),
  lastSeenAt: peer.chatLastSeenAt || null,
  kind: current ? peerKind(current, peer) : 'agency',
})

const unreadFor = (conversation: env.ChatConversation, userId: string) => {
  const unreadBy = conversation.unreadBy instanceof Map
    ? conversation.unreadBy
    : new Map(Object.entries((conversation.unreadBy || {}) as Record<string, number>))
  return Number(unreadBy.get(userId) || 0)
}

const setUnreadMap = (conversation: env.ChatConversation, unreadBy: Map<string, number>) => {
  conversation.unreadBy = unreadBy
}

const toConversationView = (conversation: env.ChatConversation, currentUser: env.User, peer: env.User) => ({
  _id: conversation._id.toString(),
  peer: toPeer(peer, currentUser),
  lastMessage: conversation.lastMessage || '',
  lastMessageAt: conversation.lastMessageAt || conversation.get('updatedAt'),
  lastMessageSenderId: conversation.lastMessageSender?.toString() || null,
  unreadCount: unreadFor(conversation, currentUser._id.toString()),
  updatedAt: conversation.get('updatedAt'),
})

const assertChatAccess = (userType?: bookcarsTypes.UserType) => {
  if (userType !== bookcarsTypes.UserType.Admin && userType !== bookcarsTypes.UserType.Supplier) {
    return false
  }
  return true
}

const findSupportAdmin = async () => {
  if (env.ADMIN_EMAIL) {
    const byEmail = await User.findOne({
      email: env.ADMIN_EMAIL.toLowerCase(),
      type: bookcarsTypes.UserType.Admin,
      blacklisted: { $ne: true },
    })
    if (byEmail) {
      return byEmail
    }
  }

  return User.findOne({
    type: bookcarsTypes.UserType.Admin,
    blacklisted: { $ne: true },
  }).sort({ createdAt: 1 })
}

const getOrCreateConversation = async (userA: string, userB: string) => {
  const participantKey = participantKeyOf(userA, userB)
  const existing = await ChatConversation.findOne({ participantKey })
  if (existing) {
    return existing
  }

  return ChatConversation.create({
    participants: [userA, userB],
    participantKey,
    unreadBy: new Map<string, number>([
      [userA, 0],
      [userB, 0],
    ]),
  })
}

const PEER_FIELDS = 'fullName avatar type parentAgency chatLastSeenAt'

const canChatWith = (current: env.User, peer: env.User) => {
  const currentId = current._id.toString()
  const peerId = peer._id.toString()
  if (currentId === peerId) {
    return false
  }
  if (current.type === bookcarsTypes.UserType.Admin && peer.type === bookcarsTypes.UserType.Supplier) {
    return true
  }
  if (current.type === bookcarsTypes.UserType.Supplier && peer.type === bookcarsTypes.UserType.Admin) {
    return true
  }
  if (current.type === bookcarsTypes.UserType.Supplier && peer.type === bookcarsTypes.UserType.Supplier) {
    return parentIdOf(peer) === currentId || parentIdOf(current) === peerId
  }
  return false
}

export const pingPresence = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId || !assertChatAccess(req.user?.type)) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }

    await User.updateOne({ _id: userId }, { $set: { chatLastSeenAt: new Date() } })
    res.sendStatus(204)
  } catch (err) {
    logger.error(`[chat.pingPresence] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const listConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId || !assertChatAccess(req.user?.type)) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }

    const current = await User.findById(userId)
    if (!current) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }

    const conversations = await ChatConversation.find({ participants: userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(100)

    const peerIds = conversations
      .map((conversation) => conversation.participants.find((id) => id.toString() !== userId)?.toString())
      .filter((id): id is string => Boolean(id))

    const peers = await User.find({ _id: { $in: peerIds } }).select(PEER_FIELDS)
    const peerMap = new Map(peers.map((peer) => [peer._id.toString(), peer]))

    const rows = conversations
      .map((conversation) => {
        const peerId = conversation.participants.find((id) => id.toString() !== userId)?.toString()
        const peer = peerId ? peerMap.get(peerId) : undefined
        if (!peer) {
          return null
        }
        return toConversationView(conversation, current, peer)
      })
      .filter((row) => row !== null)

    res.json(rows)
  } catch (err) {
    logger.error(`[chat.listConversations] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const unreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId || !assertChatAccess(req.user?.type)) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }

    const conversations = await ChatConversation.find({ participants: userId }).select('unreadBy')
    const count = conversations.reduce((sum, conversation) => sum + unreadFor(conversation, userId), 0)
    res.json({ count })
  } catch (err) {
    logger.error(`[chat.unreadCount] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const openConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    const userType = req.user?.type
    if (!userId || !assertChatAccess(userType)) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }

    const current = await User.findById(userId)
    if (!current) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }

    const requestedPeerId = String(req.body?.peerId || req.body?.agencyId || '').trim()
    let peer: env.User | null = null

    if (requestedPeerId) {
      if (!helper.isValidObjectId(requestedPeerId)) {
        res.status(400).send({ message: 'Invalid conversation' })
        return
      }
      peer = await User.findById(requestedPeerId)
      if (!peer || !canChatWith(current, peer)) {
        res.status(403).send({ message: 'Forbidden' })
        return
      }
    } else if (userType === bookcarsTypes.UserType.Supplier) {
      peer = await findSupportAdmin()
      if (!peer) {
        res.status(400).send({ message: 'Support admin is not configured' })
        return
      }
    } else {
      res.status(400).send({ message: 'Invalid conversation' })
      return
    }

    const conversation = await getOrCreateConversation(userId, peer._id.toString())
    res.json(toConversationView(conversation, current, peer))
  } catch (err) {
    logger.error(`[chat.openConversation] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const listMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    const conversationId = req.params.id
    if (!userId || !assertChatAccess(req.user?.type) || !helper.isValidObjectId(conversationId)) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }

    const conversation = await ChatConversation.findById(conversationId)
    if (!conversation || !conversation.participants.some((id) => id.toString() === userId)) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }

    const page = Math.max(Number.parseInt(String(req.query.page || '1'), 10) || 1, 1)
    const messages = await ChatMessage.find({ conversation: conversationId })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * MESSAGE_PAGE_SIZE)
      .limit(MESSAGE_PAGE_SIZE)

    res.json(messages.reverse().map((message) => ({
      _id: message._id.toString(),
      conversation: message.conversation.toString(),
      sender: message.sender.toString(),
      text: message.text,
      createdAt: message.get('createdAt'),
    })))
  } catch (err) {
    logger.error(`[chat.listMessages] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    const conversationId = req.params.id
    const text = String(req.body?.text || '').trim().slice(0, MAX_TEXT)

    if (!userId || !assertChatAccess(req.user?.type) || !helper.isValidObjectId(conversationId)) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }
    if (!text) {
      res.status(400).send({ message: 'Message cannot be empty' })
      return
    }

    const conversation = await ChatConversation.findById(conversationId)
    if (!conversation || !conversation.participants.some((id) => id.toString() === userId)) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }

    const message = await ChatMessage.create({
      conversation: conversationId,
      sender: userId,
      text,
    })

    const unreadBy = conversation.unreadBy instanceof Map
      ? conversation.unreadBy
      : new Map(Object.entries((conversation.unreadBy || {}) as Record<string, number>))
    conversation.participants.forEach((participant) => {
      const id = participant.toString()
      if (id === userId) {
        unreadBy.set(id, 0)
        return
      }
      unreadBy.set(id, Number(unreadBy.get(id) || 0) + 1)
    })

    conversation.lastMessage = text
    conversation.lastMessageAt = message.get('createdAt') as Date
    conversation.lastMessageSender = new mongoose.Types.ObjectId(userId)
    setUnreadMap(conversation, unreadBy)
    await conversation.save()

    const recipients = conversation.participants
      .map((participant) => participant.toString())
      .filter((id) => id !== userId)
    const sender = await User.findById(userId).select('fullName')
    const senderName = sender?.fullName || 'DRIVOO'
    void Promise.all(recipients.map((recipientId) => firebaseMessaging.sendNotificationToUser(recipientId, {
      title: senderName,
      body: text.slice(0, 140),
      type: 'chat',
      url: '/agency',
      data: {
        conversationId,
      },
    }))).catch((error) => {
      logger.warn(`[chat.sendMessage] push skipped: ${error}`)
    })

    res.status(201).json({
      _id: message._id.toString(),
      conversation: message.conversation.toString(),
      sender: message.sender.toString(),
      text: message.text,
      createdAt: message.get('createdAt'),
    })
  } catch (err) {
    logger.error(`[chat.sendMessage] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const markRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    const conversationId = req.params.id
    if (!userId || !assertChatAccess(req.user?.type) || !helper.isValidObjectId(conversationId)) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }

    const conversation = await ChatConversation.findById(conversationId)
    if (!conversation || !conversation.participants.some((id) => id.toString() === userId)) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }

    const unreadBy = conversation.unreadBy instanceof Map
      ? conversation.unreadBy
      : new Map(Object.entries((conversation.unreadBy || {}) as Record<string, number>))
    unreadBy.set(userId, 0)
    setUnreadMap(conversation, unreadBy)
    await conversation.save()
    res.sendStatus(200)
  } catch (err) {
    logger.error(`[chat.markRead] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const searchAgencies = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId || !assertChatAccess(req.user?.type)) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }

    const current = await User.findById(userId)
    if (!current) {
      res.status(403).send({ message: 'Forbidden' })
      return
    }

    const keyword = escapeStringRegexp(String(req.query.s || '').trim())
    const matchesKeyword = (user: env.User) => {
      if (!keyword) {
        return true
      }
      const haystack = `${user.fullName || ''} ${user.email || ''}`
      return new RegExp(keyword, 'i').test(haystack)
    }

    if (current.type === bookcarsTypes.UserType.Admin) {
      const agencies = await User.find({
        type: bookcarsTypes.UserType.Supplier,
        blacklisted: { $ne: true },
        expireAt: null,
        ...(keyword
          ? {
            $or: [
              { fullName: { $regex: keyword, $options: 'i' } },
              { email: { $regex: keyword, $options: 'i' } },
            ],
          }
          : {}),
      })
        .select(PEER_FIELDS)
        .sort({ fullName: 1 })
        .limit(40)

      res.json(agencies.map((agency) => toPeer(agency, current)))
      return
    }

    const contacts: env.User[] = []
    const support = await findSupportAdmin()
    if (support && support._id.toString() !== current._id.toString()) {
      contacts.push(support)
    }

    if (!current.parentAgency) {
      const branches = await User.find({
        type: bookcarsTypes.UserType.Supplier,
        parentAgency: current._id,
        blacklisted: { $ne: true },
        expireAt: null,
      })
        .select(PEER_FIELDS)
        .sort({ fullName: 1 })
        .limit(40)
      contacts.push(...branches)
    } else {
      const parent = await User.findById(current.parentAgency).select(PEER_FIELDS)
      if (parent) {
        contacts.push(parent)
      }
    }

    res.json(contacts.filter(matchesKeyword).map((contact) => toPeer(contact, current)))
  } catch (err) {
    logger.error(`[chat.searchAgencies] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}
