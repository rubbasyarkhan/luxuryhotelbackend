import express from "express";
import dotenv from "dotenv";
import userroutes from "./src/routes/UserRoutes.js";
import roomRoutes from "./src/routes/RoomRoutes.js";
import bookingRoutes from "./src/routes/BookingRoutes.js";
import billingRoutes from "./src/routes/BillingRoutes.js";
import settingsRoutes from "./src/routes/SettingsRoutes.js";
import connectDb from "./src/db/index.js";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors({
  origin: '*' 
}));

app.use(express.json());

// API Routes
app.use("/api/user", userroutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/settings", settingsRoutes);

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!", timestamp: new Date().toISOString() });
});

connectDb()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
