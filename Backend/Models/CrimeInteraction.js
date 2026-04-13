import mongoose from "mongoose";

const crimeInteractionSchema = new mongoose.Schema(
  {
    crimeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crime",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: { type: String }, // Redundant for performance
    content: {
      type: String,
      required: [true, "Feedback content is required"],
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ["observation", "witness", "appreciation", "requirement"],
      default: "observation",
    },
  },
  { timestamps: true }
);

// Index for fast retrieval per crime
crimeInteractionSchema.index({ crimeId: 1, createdAt: -1 });

export default mongoose.model("CrimeInteraction", crimeInteractionSchema);
