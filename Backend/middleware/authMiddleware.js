import jwt from "jsonwebtoken";
import User from "../Models/usermodel.js";
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) return res.status(401).json({ msg: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // your token payload is: { userId, role }
    const userId = decoded.userId;
    if (!userId) return res.status(401).json({ msg: "Invalid token" });

    req.user = await User.findById(userId).select("-password");
    if (!req.user) return res.status(401).json({ msg: "User not found" });

    next();
  } catch (err) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (!["admin", "police"].includes(req.user?.role)) {
    return res.status(403).json({ msg: "Admin or Police access only" });
  }
  next();
};
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ msg: "No token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // 🔥 THIS IS CRITICAL

    console.log("REQ USER:", req.user); // DEBUG

    next();
  } catch (error) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ msg: "Admin access only" });
  }
  next();
};