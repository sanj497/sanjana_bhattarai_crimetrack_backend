import { register, registerStaff, login, verifyOtp, updateUserRole, getAllUsers, forgotPassword, resetPassword, updateProfile, verifyPoliceApplication, deleteUser, getProfile, uploadProfilePicture } from '../Controllers/usercontroller.js';
import express from 'express';
import { isAdmin, verifyToken } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/multer.js';

const router = express.Router();

router.post('/register', register);
router.post('/register-staff', registerStaff);
router.post('/login', login);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.post("/profile/picture", verifyToken, upload.single("profilePicture"), uploadProfilePicture);
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
