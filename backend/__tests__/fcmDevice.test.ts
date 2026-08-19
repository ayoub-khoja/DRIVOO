import 'dotenv/config'
import request from 'supertest'
import * as bookcarsTypes from ':bookcars-types'
import * as databaseHelper from '../src/utils/databaseHelper'
import * as testHelper from './testHelper'
import app from '../src/app'
import * as env from '../src/config/env.config'
import FirebaseDevice from '../src/models/FirebaseDevice'
import User from '../src/models/User'

let USER_ID: string
let ADMIN_USER_ID: string

const signinAsAdmin = async () => {
  const res = await request(app)
    .post(`/api/sign-in/${bookcarsTypes.AppType.Admin}`)
    .send({
      email: testHelper.ADMIN_EMAIL,
      password: testHelper.PASSWORD,
      mobile: true,
    })
  expect(res.statusCode).toBe(200)
  expect(typeof res.body.accessToken).toBe('string')
  return res.body.accessToken as string
}

beforeAll(async () => {
  testHelper.initializeLogger()
  await databaseHelper.connect(env.DB_URI, false, false)
  await testHelper.initialize()
  USER_ID = testHelper.getUserId()
  ADMIN_USER_ID = testHelper.getAdminUserId()
  await User.updateMany(
    { _id: { $in: [USER_ID, ADMIN_USER_ID] } },
    { $set: { active: true } },
  )
})

afterAll(async () => {
  await FirebaseDevice.deleteMany({ user: { $in: [USER_ID, ADMIN_USER_ID] } })
  await testHelper.close()
  await databaseHelper.close()
})

describe('POST /api/fcm-devices', () => {
  it('should reject unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/fcm-devices')
      .send({
        token: 'token-unauthenticated',
        platform: bookcarsTypes.FcmDevicePlatform.Web,
      })
    expect(res.statusCode).toBe(403)
  })

  it('should reject an invalid payload', async () => {
    const token = await signinAsAdmin()
    const res = await request(app)
      .post('/api/fcm-devices')
      .set(env.X_ACCESS_TOKEN, token)
      .send({ token: 'abc', platform: 'windows' })
    expect(res.statusCode).toBe(400)
  })

  it('should register a device for the authenticated user', async () => {
    const token = await signinAsAdmin()
    const res = await request(app)
      .post('/api/fcm-devices')
      .set(env.X_ACCESS_TOKEN, token)
      .send({
        token: 'fcm-token-admin-chrome',
        platform: bookcarsTypes.FcmDevicePlatform.Web,
        browser: 'chrome',
        deviceName: 'Chrome Windows',
        environment: 'development',
      })
    expect(res.statusCode).toBe(200)
    expect(res.body.user).toBe(ADMIN_USER_ID)
    expect(res.body.token).toBe('fcm-token-admin-chrome')
    expect(res.body.isActive).toBe(true)
  })

  it('should be idempotent for the same token', async () => {
    const token = await signinAsAdmin()
    const res = await request(app)
      .post('/api/fcm-devices')
      .set(env.X_ACCESS_TOKEN, token)
      .send({
        token: 'fcm-token-admin-chrome',
        platform: bookcarsTypes.FcmDevicePlatform.Web,
        browser: 'chrome',
        environment: 'development',
      })
    expect(res.statusCode).toBe(200)
    expect(res.body.user).toBe(ADMIN_USER_ID)

    const matches = await FirebaseDevice.find({ token: 'fcm-token-admin-chrome' })
    expect(matches.length).toBe(1)
  })
})

describe('GET /api/fcm-devices', () => {
  it('should list only the authenticated user devices', async () => {
    await new FirebaseDevice({
      user: USER_ID,
      token: 'fcm-token-other-user',
      platform: bookcarsTypes.FcmDevicePlatform.Web,
      isActive: true,
      environment: 'development',
    }).save()

    const token = await signinAsAdmin()
    const res = await request(app)
      .get('/api/fcm-devices')
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.every((device: { user: string }) => device.user === ADMIN_USER_ID)).toBe(true)
    expect(res.body.some((device: { token: string }) => device.token === 'fcm-token-other-user')).toBe(false)
  })
})

describe('DELETE /api/fcm-devices', () => {
  it('should not deactivate another user device', async () => {
    const token = await signinAsAdmin()
    const res = await request(app)
      .delete('/api/fcm-devices')
      .set(env.X_ACCESS_TOKEN, token)
      .send({ token: 'fcm-token-other-user' })
    expect(res.statusCode).toBe(204)
    const device = await FirebaseDevice.findOne({ token: 'fcm-token-other-user' })
    expect(device?.isActive).toBe(true)
    expect(device?.user.toString()).toBe(USER_ID)
  })

  it('should deactivate the authenticated user device', async () => {
    const token = await signinAsAdmin()
    const res = await request(app)
      .delete('/api/fcm-devices')
      .set(env.X_ACCESS_TOKEN, token)
      .send({ token: 'fcm-token-admin-chrome' })
    expect(res.statusCode).toBe(200)
    const device = await FirebaseDevice.findOne({ token: 'fcm-token-admin-chrome' })
    expect(device?.isActive).toBe(false)
    expect(device?.user.toString()).toBe(ADMIN_USER_ID)
  })
})
