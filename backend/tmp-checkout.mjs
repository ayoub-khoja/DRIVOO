import axios from "axios";
const payload = {
  payLater: true,
  booking: {
    supplier: "6a7ce00980d260d2663df24e",
    car: "6a7ce15f80d260d2663df282",
    driver: "6a7b2cf281b6c490bfb3bed5",
    pickupLocation: "6a7c9918ed01ffe3fa7c7afe",
    dropOffLocation: "6a7c9918ed01ffe3fa7c7afe",
    from: new Date("2026-08-31T08:00:00.000Z"),
    to: new Date("2026-09-03T08:00:00.000Z"),
    status: "Pending",
    cancellation: true,
    amendments: true,
    theftProtection: false,
    collisionDamageWaiver: false,
    fullInsurance: false,
    additionalDriver: false,
    price: 100,
  },
};
try {
  const res = await axios.post("http://localhost:4002/api/checkout", payload);
  console.log("OK", res.status, res.data);
} catch (e) {
  console.log("FAIL", e.response?.status, e.response?.data);
  console.log("MSG", e.message);
}
