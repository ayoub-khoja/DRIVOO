import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const run = async () => {
  await mongoose.connect(process.env.BC_DB_URI)
  const db = mongoose.connection.db
  const cars = await db.collection('Car').find({ available: true }).toArray()
  const supplierIds = [...new Set(cars.map((c) => c.supplier?.toString()).filter(Boolean))]
  const existing = await db.collection('User').find({
    _id: { $in: supplierIds.map((id) => new mongoose.Types.ObjectId(id)) },
  }).project({ _id: 1, fullName: 1, active: 1 }).toArray()
  const existingSet = new Set(existing.map((s) => s._id.toString()))
  const orphaned = supplierIds.filter((id) => !existingSet.has(id))
  const orphanedCars = cars.filter((c) => orphaned.includes(c.supplier?.toString()))

  console.log(JSON.stringify({
    totalAvailableCars: cars.length,
    uniqueSuppliers: supplierIds.length,
    existingSuppliers: existing.length,
    orphanedSupplierIds: orphaned,
    orphanedCarsCount: orphanedCars.length,
    sampleOrphanedCars: orphanedCars.slice(0, 5).map((c) => ({ carId: c._id.toString(), name: c.name, supplier: c.supplier?.toString() })),
  }, null, 2))

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
