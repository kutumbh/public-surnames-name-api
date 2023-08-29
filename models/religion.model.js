const mongoose = require('mongoose')
const religionSchema = new mongoose.Schema({
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
module.exports = mongoose.model('religion', religionSchema)
