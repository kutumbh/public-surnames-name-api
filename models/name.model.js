const mongoose = require('mongoose')
const nameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true
      // required: true
    },
    meaning: {
      type: String,
      trim: true,
      // required: true,
    },
    gender: [{
      type: String,
      trim: true,
      // required: true,
    }],
    source: {
      type: String,
      trim: true,
      // required: true
    },
    tags: [{ type: String }],
    wikiUrl:{
      type: String,
      trim: true,
    },
    nStatus:{
      type: String,
      trim: true
    },
    history:{
      type: String,
      trim: true
    },
    numerology: {
      type: String,
      trim: true,
      // required: true
    },
    rashi: {
      type: String,
      trim: true,
      // required: true,
    },
    nakshatra: {
      type: String,
      trim: true,
      // required: true,
    },
    religion: [{
      type: String,
    }],
    equalTo: {
      type: String,
      trim: true,
    },
    translations: [{
      lang: String,
      value: [{
        type: String,
        trim: true,
      }]
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      default: null
    },
    createdAt: {
      type: Date,
      trim: true,
    },
  },
  {
    timestamps: true
  })

module.exports = mongoose.model('name', nameSchema)
