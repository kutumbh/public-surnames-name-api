const mongoose = require('mongoose')
const pdUser = require('./pdUser.model');
const surnameSchema = new mongoose.Schema(
  {
    surname: {
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
    source: {
      type: String,
      trim: true,
      // required: true
    },
    origin: {
      type: String,
      trim: true,
      //required: true
    },
    religion: [{
      type: String,
      // required: true
    }],
    community: [{
      type: String,
      trim: true,
      // required: true,
    }],
    gotra: [{
      type: String,
      trim: true,
      // required: true,
    }],
    kuldevtaFamilyDeity: [{
      type: String,
      trim: true,
      // required: true,
    }],
    script: [{
      type: String,
      trim: true,
      // required: true,
    }],
    alternative: [{
      type: String,
      trim: true,
      // required: true,
    }],
    vansha: {
      type: String,
      trim: true,
    },
    veda: {
      type: String,
      trim: true,
    },
    // type:[{
    //   sType: String,
    //   sValue: String,
    // }],
    surnameType:{
      type:String,
      trim:true
    },
    value:{
      type:String,
      trim:true
    },
    // profession:{
    //   type: String,
    //   trim: true,
    // },
    // placeName:{
    //   type: String,
    //   trim: true,
    // },
    // placeId:{
    //   type: String,
    //   trim: true,
    // },
    // caste: {
    //   type: String,
    //   trim: true,
    // },
    wikiUrl:{
      type: String,
      trim: true,
    },
    sStatus:{
      type: String,
      trim: true
    },
    history:{
      type: String,
      trim: true
    },    
    isPublished:{
      type:String,
      trim:true
    },    
    assignTo:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: "pdUser",
    }],
    weekOfYear:{
      type:Number,
    },
    pd_count:{
      type:Number
    },    
    pg_content:{
      type:String
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
      ref: "pdUser",
      required: false,
      default: null
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "pdUser",
      required: false,
      default: null
    },
    likeCount: {
      type: Number,
      default: 0
    },
    dislikeCount: {
      type: Number,
      default: 0
    }
  },
    {
      timestamps: true
    })

module.exports = mongoose.model('surname', surnameSchema)
