import { register, registerStaff, login, verifyOtp, updateUserRole, getAllUsers, forgotPassword, resetPassword, updateProfile, verifyPoliceApplication, deleteUser } from '../Controllers/usercontroller.js';
import express from 'express';
import { isAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/register-staff', registerStaff);
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
router.put("/verify-police/:userId", verifyToken, isAdmin, verifyPoliceApplication);
router.delete("/remove/:userId", verifyToken, isAdmin, deleteUser);
export default router;
