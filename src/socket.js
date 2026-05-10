// socket.js
import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        const allowed = [
          "http://localhost:3000",
          "http://localhost:5173",
          "http://localhost:5174",
        ];
        
        // Accept any Vercel preview/production URL for this project
        if (
          origin.includes("sanjana-bhattarai-crimetrack-frontend") ||
          origin.includes("vercel.app") ||
          allowed.includes(origin)
        ) {
          return callback(null, true);
        }
        
        console.log("Socket.io CORS rejected origin:", origin);
        callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["polling", "websocket"],
    allowEIO3: true
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Join user to their role-based room or email-based room
    socket.on("authenticate", (userData) => {
      const { userId, role, email } = userData;

      if (userId) {
        socket.userId = userId;
        socket.role = role;
        socket.join(`user_${userId}`);
        console.log(`User ${userId} (${role}) joined their personal room`);

        if (role === "police") socket.join("police_room");
        else if (role === "admin") socket.join("admin_room");
        else socket.join("users_room");
      }
      
      // Allow joining a room based on email for OTP tracking during registration/forgot-pass
      if (email) {
        socket.join(`email_${email}`);
        console.log(`Client joined tracking room for email: ${email}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

// Send notification to specific user
export const sendNotificationToUser = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit("new_notification", notification);
    console.log(`📨 Sent notification to user ${userId}`);
  }
};

// Send notification to all users
export const sendNotificationToAllUsers = (notification) => {
  if (io) {
    io.to("users_room").emit("new_notification", notification);
    console.log("📨 Sent notification to all users");
  }
};

// Send notification to all police
export const sendNotificationToPolice = (notification) => {
  if (io) {
    io.to("police_room").emit("new_notification", notification);
    console.log("👮 Sent notification to all police");
  }
};

// Send notification to all admins
export const sendNotificationToAdmins = (notification) => {
  if (io) {
    io.to("admin_room").emit("new_notification", notification);
    console.log("👨‍💼 Sent notification to all admins");
  }
};

// Broadcast to all connected clients
export const broadcastToAll = (notification) => {
  if (io) {
    io.emit("broadcast_notification", notification);
    console.log("📢 Broadcasted to all clients");
  }
};

/**
 * Professional Real-time OTP Backup
 * Emits the OTP to a room identified by the user's email.
 */
export const sendOTPRealTime = (email, otp, context) => {
  if (io) {
    io.to(`email_${email}`).emit("otp_received", {
      success: true,
      otp: otp,
      context: context,
      message: `SECURITY ALERT: Your verification code for ${context} is ${otp}.`,
      timestamp: new Date().toISOString()
    });
    
    // Log to admin dashboard for audit/debugging
    io.to("admin_room").emit("system_alert", {
      type: "OTP_DISPATCHED",
      details: `OTP [${otp}] dispatched to ${email} for ${context}`,
      severity: "low"
    });
    
    console.log(`⚡ Real-time OTP dispatched to email room: email_${email}`);
  }
};

// Role-based broadcast
export const broadcastByRole = async (role, notification, excludeUserId = null) => {
  if (!io) return;

  let roomName;
  switch (role) {
    case "police":
      roomName = "police_room";
      break;
    case "admin":
      roomName = "admin_room";
      break;
    case "user":
      roomName = "users_room";
      break;
    default:
      roomName = null;
  }

  if (roomName) {
    if (excludeUserId) {
      // Emit to all in room except excluded user
      const sockets = await io.in(roomName).fetchSockets();
      sockets.forEach(socket => {
        if (socket.userId !== excludeUserId) {
          socket.emit("new_notification", notification);
        }
      });
    } else {
      io.to(roomName).emit("new_notification", notification);
    }
    console.log(`📨 Sent notification to ${role} room`);
  }
};

export const getIO = () => io;