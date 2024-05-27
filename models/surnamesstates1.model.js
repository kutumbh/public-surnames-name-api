const mongoose = require('mongoose')
const surnamesstates1Schema = new mongoose.Schema(
  {
    surname: {
      type: String,
      trim: true,
      unique: true
      // required: true
    },
    // count :{
    //     type:Number
    // },
    states: [{
      stateCode: String,
      count: {
        type: Number,
        trim: true,
      }
    }],
  //   
},
    {
      timestamps: true
    })

module.exports = mongoose.model('surnamesstates1', surnamesstates1Schema)
