import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
await mongoose.connect(process.env.BC_DB_URI);
const db = mongoose.connection.db;
const suppliers = await db.collection("User").find({ type: "supplier" }).toArray();
const supplierIds = new Set(suppliers.map(s => s._id.toString()));
const cars = await db.collection("Car").find({}).toArray();
for (const car of cars) {
  const sid = car.supplier?.toString();
  const ok = supplierIds.has(sid);
  console.log(car._id.toString(), car.name, "supplier", sid, ok ? "OK" : "MISSING");
}
await mongoose.disconnect();
