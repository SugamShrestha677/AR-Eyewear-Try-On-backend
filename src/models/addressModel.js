const mongoose = require('mongoose');
const AddressSchema=new mongoose.Schema({
    streetAddress:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    province:{
        type:String,
        required:true
    },
    zipCode:{
        type:Number,
        required:true
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:"users"
    },
})

const Address = mongoose.model("addresses",AddressSchema)
module.exports=Address;