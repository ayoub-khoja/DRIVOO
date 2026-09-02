import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
const run = async () => {
  try {
    await mongoose.connect(process.env.BC_DB_URI);
    const db = mongoose.connection.db;
    const car = await db.collection("Car").findOne({});
    const user = await db.collection("User").findOne({ type: "user" });
    const loc = await db.collection("Location").findOne({});
    console.log(JSON.stringify({ carId: car?._id?.toString(), supplierId: car?.supplier?.toString(), userId: user?._id?.toString(), userEmail: user?.email, locId: loc?._id?.toString() }));
  } catch (e) {
    console.error("ERR", e);
  } finally {
    await mongoose.disconnect();
  }
};
run();
