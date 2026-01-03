const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const errorMiddleware = require("./middleware/error");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:4000",
      "https://kv.radheytechsolutions.in",
      "https://kv.radheytechsolutions.in/api",
    ],
    credentials: true, // if you're using cookies/auth
  })
);

//config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({ path: "backend/config/config.env" });
}

// Increase body parser limit to handle large base64 images (50MB)
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const familyMemberRoutes = require("./routes/familyMemberRoutes");
const exportRoutes = require("./routes/exportRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const statsRoutes = require("./routes/statsRoutes");
const enumRoutes = require("./routes/enumRoutes");
const roleRoutes = require("./routes/roleRoutes");
const eventRoutes = require("./routes/eventRoutes");
const pollRoutes = require("./routes/pollRoutes");
const commentRoutes = require("./routes/commentRoutes");
const userRelationshipRoutes = require("./routes/userRelationshipRoutes");
const familyMemberRequestRoutes = require("./routes/familyMemberRequestRoutes");
const locationRoutes = require("./routes/locationRoutes");

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", familyMemberRoutes);
app.use("/api/admin/export", exportRoutes);
app.use("/api/admin/activity-logs", activityLogRoutes);
app.use("/api/admin/stats", statsRoutes);
app.use("/api/admin/enums", enumRoutes);
app.use("/api/admin/roles", roleRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/user-relationships", userRelationshipRoutes);
app.use("/api/family-member-requests", familyMemberRequestRoutes);
app.use("/api/locations", locationRoutes);

app.use("/uploads", express.static("uploads"));

// Serve static files from React app
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Catch-all handler: serve React app for any non-API routes
// app.get("*", (req, res, next) => {
//   // Skip API routes - if it's an API route, pass to error handler if needed
//   if (req.path.startsWith("/api/")) {
//     return next();
//   }
//   res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
// });

// Error middleware MUST be last - Express will call it when next(error) is called
app.use(errorMiddleware);

module.exports = app;
