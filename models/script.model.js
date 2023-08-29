const mongoose = require('mongoose')
const scriptSchema = new mongoose.Schema({
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
module.exports = mongoose.model('script', scriptSchema)
