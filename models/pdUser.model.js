const mongoose = require('mongoose')
const pdUserSchema = new mongoose.Schema(
    {
        fname: {
            type:String,
            trim: true,
            required:true
        },
        lname: {
            type:String,
            trim: true,
            required:true
        },
        uname:{ type: String},
        email:{
            type:String,
            unique:true,
            trim: true,
            required:true
        },
        passwordChangeFlag:{type:Number},
        smsCount: { type: Number, default: 0 },
        updatedSmsCountDate: { type: Date, default: Date.now },
        
        //change this after cognito users are migrated
        // password: {type: String,  select: false },
        password: { type: String },
        accessLevel: String,
        accessToken: String,
        emailVerification: String,
        emailVerified: { type: Boolean, default: false },    
        cognitousername: {
            type: String,
            default: null
        },
        
        forgotPasswordVerification: String,
        role: [{ type: mongoose.Schema.Types.ObjectId, ref: "masterData" }],
        catAllocated: [{ type: mongoose.Schema.Types.ObjectId, ref: "masterData" }],
        fsAllocated: [{ type: mongoose.Schema.Types.ObjectId, ref: "" }],
        psAllocated: [{ type: mongoose.Schema.Types.ObjectId, ref: "" }],
        
    },
    { timestamps: true }
    
)
module.exports = mongoose.model('pdUser', pdUserSchema ,'pdUsers')
//export default mongoose.model("pdUser", schema ,"pdUsers")
//const model=mongoose.model("pdUsers", schema)
//module.exports=model