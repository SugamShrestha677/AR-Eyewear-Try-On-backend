const mongoose = require('mongoose');
const config = require('./config');
const db={}
db.connect=async()=>{
    try {
        await mongoose.connect(config.MONGODB_URI)
        console.log("Database connection successfull!");
    } catch (error) {
        console.log("Database connection error!")
    }
}

db.disconnect =async ()=>{
    try {
        await mongoose.connection.close(config.MONGODB_URI)
        console.log("Database disconnected!");
    } catch (error) {
        console.log("Database disconnection failed!");
    }
}
module.exports=db;