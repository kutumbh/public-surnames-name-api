const mongoose = require('mongoose')
const EntityLogSchema = new mongoose.Schema({

docType:{
    type:String
},

eCode:{
    type:String
},
refURL:{
    type:String
},

comment:{
    type:String
},
surnameId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "surname",
},
nameId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "name",
},
FamousPersonId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "ptUser",
},
modifiedBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "pdUser",
}},


    {
        timestamps: true
    }

)
module.exports = mongoose.model('entityLog', EntityLogSchema,'entityLog')
