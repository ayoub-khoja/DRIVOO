import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const chatMessageSchema = new Schema<env.ChatMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'ChatConversation',
      required: [true, "can't be blank"],
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "can't be blank"],
      index: true,
    },
    text: {
      type: String,
      required: [true, "can't be blank"],
      trim: true,
      maxlength: 4000,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'ChatMessage',
  },
)

chatMessageSchema.index({ conversation: 1, createdAt: -1, _id: -1 })

const ChatMessage = model<env.ChatMessage>('ChatMessage', chatMessageSchema)

export default ChatMessage
