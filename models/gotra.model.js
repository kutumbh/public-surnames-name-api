const mongoose = require('mongoose')
const gotraSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: false
      }
    },
    {
        timestamps: true
    }
)
module.exports = mongoose.model('gotra', gotraSchema)
