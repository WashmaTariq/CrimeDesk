import express       from "express";
import mongoose      from "mongoose";
import cors          from "cors";
import http          from "http";
import { Server }    from "socket.io";
import dotenv        from "dotenv";
import caseRoutes    from "./routes/caseRoutes.js";
import officerRoutes from "./routes/officerRoutes.js"; // ← NEW

dotenv.config();

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.use("/api/cases",   caseRoutes);
app.use("/api/officers", officerRoutes); // ← NEW

app.get("/", (_req, res) => res.json({ status: "CrimeDesk API running" }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});