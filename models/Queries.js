import mongoose from "mongoose";

const querySchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  subject: { type: String, required: true },
  category: { type: String, default: 'General' },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  messages: [{
    sender: { type: String, enum: ['user', 'admin'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.models.Query || mongoose.model("Query", querySchema);