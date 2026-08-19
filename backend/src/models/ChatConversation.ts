import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const chatConversationSchema = new Schema<env.ChatConversation>(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: {
        validator: (value: unknown[]) => Array.isArray(value) && value.length === 2,
        message: 'A conversation must have exactly two participants',
      },
    },
    participantKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lastMessage: {
      type: String,
      trim: true,
    },
    lastMessageAt: {
      type: Date,
    },
    lastMessageSender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    unreadBy: {
      type: Map,
      of: Number,
      default: () => new Map<string, number>(),
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'ChatConversation',
  },
)

chatConversationSchema.index({ participants: 1, lastMessageAt: -1 })

const ChatConversation = model<env.ChatConversation>('ChatConversation', chatConversationSchema)

export default ChatConversation
