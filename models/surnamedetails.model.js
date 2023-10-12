const mongoose = require('mongoose')
const surnamedetailsSchema = new mongoose.Schema(
  {
    lastName: {
      type: String,
      trim: true,
      unique: true
      // required: true
    },
    count :{
        type:Number
    },
    categoryCount: [{
      _id: String,
      count: {
        type: Number,
        trim: true,
      }
    }],
    place: [{
      _id: String,
      count:{
        type: Number,
        trim: true,
      }
    }],
  },
    {
      timestamps: true
    })

module.exports = mongoose.model('surnamedetails', surnamedetailsSchema)
