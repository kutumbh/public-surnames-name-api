const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    aws_id: {
      type: String,
      trim: true,
      required: false,
    },
    fname: {
      type: String,
      trim: true,
      required: true,
    },
    lname: {
      type: String,
      trim: true,
      required: true,
    },
    uname: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },

    role: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "masterData",
      },
    ],
    catAllocated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "masterData",
      },
    ],
    fsAllocated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "fileSource",
      },
    ],
    psAllocated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "placesData",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("user", userSchema);
