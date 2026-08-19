import { describe, expect, it } from 'vitest'
import { FIRESTORE_COLLECTIONS, getConversationMessagesPath, getConversationPath } from './constants'

describe('Firestore path helpers', () => {
  it('uses nested conversation messages', () => {
    expect(getConversationPath('abc')).toBe(`${FIRESTORE_COLLECTIONS.conversations}/abc`)
    expect(getConversationMessagesPath('abc')).toBe(`${FIRESTORE_COLLECTIONS.conversations}/abc/${FIRESTORE_COLLECTIONS.messages}`)
  })
})
