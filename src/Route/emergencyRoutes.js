import express from "express";

const router = express.Router();

// Emergency Contact Controllers
import {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  seedDefaultContacts,
} from "../Controllers/emergencyContactController.js";

// SOS Controllers
import {
  sendSOS,
  getAllSOS,
  updateSOSStatus,
  trackSosLocation,
} from "../Controllers/Soscontroller.js";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

// ── Emergency Contacts ─────────────────────────────────────────

// GET  /api/emergency
// POST /api/emergency
router.route("/")
  .get(getAllContacts)
  .post(createContact);

// POST /api/emergency/seed
router.post("/seed", seedDefaultContacts);
// ── SOS ROUTES ──
router.post("/sos",           authMiddleware, sendSOS);
router.get("/sos",            authMiddleware, adminMiddleware, getAllSOS);
router.post("/sos/:id/track", authMiddleware, trackSosLocation);
router.patch("/sos/:id",      authMiddleware, adminMiddleware, updateSOSStatus);
// GET /PUT /DELETE /api/emergency/:id
router.route("/:id")
  .get(getContactById)
  .put(updateContact)
  .delete(deleteContact);

// ── SOS Alerts ─────────────────────────────────────────

export default router;