const mongoose = require("mongoose");
const filesSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: false,
      default: null,
    },
    // fileId: {
    //     type: String,
    //     // unique: false,
    //     required: false,
    //     default: null
    // },
    fileUrl: {
      type: Array,
      trim: true,
      // required: true
    },
    // fileUrl: [
    //   {
    //     imageUrl: {
    //       type: mongoose.SchemaTypes.ObjectId,
    //       trim: true,
    //     },
    //   },
    // ],
    fileName: {
      type: String,
      trim: true,
      required: true,
    },
    fileSource: {
      type: String,
      trim: true,
      required: true,
    },
    fileType: {
      type: String,
      trim: true,
      required: true,
    },
    files: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "files",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      default: null,
    },
    fileSourceDate: {
      type: Date,
      default: Date.now,
      trim: true,
      required: true,
    },
    language: {
      type: String,
      trim: true,
      required: true,
    },
    category: {
      type: String,
      trim: true,
      required: true,
    },
    fsId: {
      type: mongoose.Schema.Types.ObjectId,
      //required: false,
      // default: null
    },
    fileSourceDateYear: {
      type: Number,
      trim: true,
    },
    fstatus: {
      type: String,
    },
    noOfRecords: {
      type: Number,
    },
    refUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("files", filesSchema);
