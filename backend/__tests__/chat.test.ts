import 'dotenv/config'
import request from 'supertest'
import * as bookcarsTypes from ':bookcars-types'
import * as databaseHelper from '../src/utils/databaseHelper'
import * as testHelper from './testHelper'
import app from '../src/app'
import * as env from '../src/config/env.config'
import User from '../src/models/User'
import ChatConversation from '../src/models/ChatConversation'
import ChatMessage from '../src/models/ChatMessage'

let ADMIN_USER_ID: string
let SUPPLIER_ID: string

const signInAsAdmin = async () => {
  const res = await request(app)
    .post(`/api/sign-in/${bookcarsTypes.AppType.Admin}`)
    .send({
      email: testHelper.ADMIN_EMAIL,
      password: testHelper.PASSWORD,
      mobile: true,
    })
  expect(res.statusCode).toBe(200)
  return res.body.accessToken as string
}

beforeAll(async () => {
  testHelper.initializeLogger()
  await databaseHelper.connect(env.DB_URI, false, false)
  await testHelper.initialize()
  ADMIN_USER_ID = testHelper.getAdminUserId()
  await User.updateOne({ _id: ADMIN_USER_ID }, { $set: { active: true } })
  const supplierName = testHelper.getSupplierName()
  SUPPLIER_ID = await testHelper.createSupplier(`${supplierName}@test.bookcars.ma`, supplierName)
})

afterAll(async () => {
  await ChatMessage.deleteMany({})
  await ChatConversation.deleteMany({})
  await testHelper.deleteSupplier(SUPPLIER_ID)
  await testHelper.close()
  await databaseHelper.close()
})

describe('Chat API', () => {
  it('should reject unauthenticated access', async () => {
    const res = await request(app).get('/api/chat/conversations')
    expect(res.statusCode).toBe(403)
  })

  it('should let an admin open a conversation with an agency and send a message', async () => {
    const token = await signInAsAdmin()

    let res = await request(app)
      .post('/api/chat/conversations')
      .set(env.X_ACCESS_TOKEN, token)
      .send({ agencyId: SUPPLIER_ID })
    expect(res.statusCode).toBe(200)
    expect(res.body.peer._id).toBe(SUPPLIER_ID)
    const conversationId = res.body._id as string

    res = await request(app)
      .post(`/api/chat/conversations/${conversationId}/messages`)
      .set(env.X_ACCESS_TOKEN, token)
      .send({ text: 'Bonjour agence' })
    expect(res.statusCode).toBe(201)
    expect(res.body.text).toBe('Bonjour agence')
    expect(res.body.sender).toBe(ADMIN_USER_ID)

    res = await request(app)
      .get(`/api/chat/conversations/${conversationId}/messages`)
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)
  })

  it('should expose online presence and let a main agency chat with a branch', async () => {
    const token = await signInAsAdmin()

    let res = await request(app)
      .post('/api/chat/presence')
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(204)

    const mainName = testHelper.getSupplierName()
    const branchName = testHelper.getSupplierName()
    const otherName = testHelper.getSupplierName()
    const mainEmail = `${mainName}@test.bookcars.ma`
    const branchEmail = `${branchName}@test.bookcars.ma`
    const otherEmail = `${otherName}@test.bookcars.ma`
    const MAIN_ID = await testHelper.createSupplier(mainEmail, mainName)
    const BRANCH_ID = await testHelper.createSupplier(branchEmail, branchName)
    const OTHER_ID = await testHelper.createSupplier(otherEmail, otherName)

    await User.updateOne(
      { _id: MAIN_ID },
      { $set: { active: true, agencyApproved: true } },
    )
    await User.updateOne(
      { _id: BRANCH_ID },
      { $set: { active: true, agencyApproved: true, parentAgency: MAIN_ID } },
    )
    await User.updateOne(
      { _id: OTHER_ID },
      { $set: { active: true, agencyApproved: true } },
    )

    const signInAsAgency = async (email: string) => {
      const response = await request(app)
        .post(`/api/sign-in/${bookcarsTypes.AppType.Agency}`)
        .send({
          email,
          password: testHelper.PASSWORD,
          mobile: true,
        })
      expect(response.statusCode).toBe(200)
      return response.body.accessToken as string
    }

    const mainToken = await signInAsAgency(mainEmail)
    res = await request(app)
      .get('/api/chat/agencies')
      .set(env.X_ACCESS_TOKEN, mainToken)
    expect(res.statusCode).toBe(200)
    const contactIds = (res.body as bookcarsTypes.ChatPeer[]).map((peer) => peer._id)
    expect(contactIds).toContain(BRANCH_ID)

    res = await request(app)
      .post('/api/chat/conversations')
      .set(env.X_ACCESS_TOKEN, mainToken)
      .send({ peerId: BRANCH_ID })
    expect(res.statusCode).toBe(200)
    expect(res.body.peer._id).toBe(BRANCH_ID)
    expect(res.body.peer.kind).toBe('branch')

    res = await request(app)
      .post('/api/chat/conversations')
      .set(env.X_ACCESS_TOKEN, mainToken)
      .send({ peerId: OTHER_ID })
    expect(res.statusCode).toBe(403)

    const branchToken = await signInAsAgency(branchEmail)
    res = await request(app)
      .post('/api/chat/conversations')
      .set(env.X_ACCESS_TOKEN, branchToken)
      .send({ peerId: MAIN_ID })
    expect(res.statusCode).toBe(200)
    expect(res.body.peer.kind).toBe('parent')

    await testHelper.deleteSupplier(MAIN_ID)
    await testHelper.deleteSupplier(BRANCH_ID)
    await testHelper.deleteSupplier(OTHER_ID)
  })
})
