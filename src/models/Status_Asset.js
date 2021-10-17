import mongoose from "mongoose";

const StatusAssetSchema = new mongoose.Schema({
  statusAssetName: {
    type: String,
    required: true,
    trim: true
  },
  asset:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Asset",
    required: true
  },
  updateBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  updateAt: {
    type: Date,
    required: true,
    default: () => Date.now()
  },
  createdAt: {
    type: Date,
    required: true,
    default: () => Date.now()
  }
});

const Status_Asset = mongoose.model("Status_Asset", StatusAssetSchema);

export default Status_Asset;