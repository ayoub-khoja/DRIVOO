import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const run = async () => {
  await mongoose.connect(process.env.BC_DB_URI)
  const db = mongoose.connection.db
  const cars = await db.collection('Car').find({ available: true }).toArray()
  let fixed = 0

  for (const car of cars) {
    if (!car.supplier) {
      continue
    }
    const supplier = await db.collection('User').findOne({ _id: car.supplier })
    if (!supplier) {
      await db.collection('Car').updateOne(
        { _id: car._id },
        { $set: { available: false, fullyBooked: false } },
      )
      fixed += 1
      console.log('Disabled car without supplier:', car._id.toString(), car.name)
    }
  }

  console.log(`Done. Disabled ${fixed} car(s).`)
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
