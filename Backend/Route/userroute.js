import { register, login, verifyOtp, updateUserRole, getAllUsers, forgotPassword, resetPassword, updateProfile } from '../Controllers/usercontroller.js';
import express from 'express';
import { isAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/profile", verifyToken, updateProfile);
router.get("/users", verifyToken, isAdmin, getAllUsers);

router.put(
  "/update-role/:userId",
    verifyToken,
  isAdmin,
  updateUserRole
);
export default router;
