import 'dotenv/config'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'
import * as databaseHelper from '../utils/databaseHelper'
import User from '../models/User'
import * as logger from '../utils/logger'
import * as authHelper from '../utils/authHelper'

try {
  const connected = await databaseHelper.connect(env.DB_URI, env.DB_SSL, env.DB_DEBUG)

  if (!connected) {
    logger.error('Failed to connect to the database')
    process.exit(1)
  }

  const email = (env.ADMIN_EMAIL || 'contact@drivoo.net').trim().toLowerCase()
  const password = process.env.BC_ADMIN_PASSWORD || 'Drivoo2026&'
  const passwordHash = await authHelper.hashPassword(password)

  let adminUser = await User.findOne({ email })

  if (!adminUser) {
    adminUser = new User({
      fullName: 'DRIVOO Admin',
      email,
      password: passwordHash,
      language: env.DEFAULT_LANGUAGE,
      type: bookcarsTypes.UserType.Admin,
      active: true,
      verified: true,
      enableEmailNotifications: true,
    })
    await adminUser.save()
    logger.info(`Admin user created successfully: ${email}`)
  } else {
    adminUser.fullName = adminUser.fullName || 'DRIVOO Admin'
    adminUser.password = passwordHash
    adminUser.type = bookcarsTypes.UserType.Admin
    adminUser.active = true
    adminUser.verified = true
    adminUser.blacklisted = false
    await adminUser.save()
    logger.info(`Admin user updated successfully: ${email}`)
  }

  process.exit(0)
} catch (err) {
  logger.error('Error during setup:', err)
  process.exit(1)
}
