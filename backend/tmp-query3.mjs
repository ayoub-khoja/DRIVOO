import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
await mongoose.connect(process.env.BC_DB_URI);
const cols = await mongoose.connection.db.listCollections().toArray();
console.log(cols.map(c=>c.name).join(", "));
const users = await mongoose.connection.db.collection("users").findOne({ _id: new mongoose.Types.ObjectId("6a7ce00980d260d2663df24e") });
console.log("users coll", users?.fullName);
await mongoose.disconnect();
