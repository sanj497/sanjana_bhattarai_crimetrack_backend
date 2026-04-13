// socket.js
import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URI || "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://sanjana-bhattarai-crimetrack-frontend.vercel.app",
        "https://sanjana-bhattarai-crimetrack-frontend-mj2nt0eqc.vercel.app"
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Join user to their role-based room
    socket.on("authenticate", (userData) => {
      const { userId, role } = userData;

      if (userId) {
        socket.userId = userId;
        socket.role = role;

        // Join user-specific room
        socket.join(`user_${userId}`);
        console.log(`User ${userId} (${role}) joined their personal room`);

        // Join role-based room
        if (role === "police") {
          socket.join("police_room");
          console.log(`Police ${userId} joined police room`);
        } else if (role === "admin") {
          socket.join("admin_room");
          console.log(`Admin ${userId} joined admin room`);
        } else {
          socket.join("users_room");
          console.log(`User ${userId} joined users room`);
        }
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