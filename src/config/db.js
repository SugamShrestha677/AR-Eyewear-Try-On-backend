const mongoose = require('mongoose');
const config = require('./config');
const db={}
db.connect=async()=>{
    try {
        await mongoose.connect(config.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Database connection successful!");
    } catch (error) {
        console.error("Database connection error:", error.message);
        throw error; // Propagate the error
    }
}

db.disconnect = async () => {
    try {
        await mongoose.connection.close();
        console.log("Database disconnected!");
    } catch (error) {
        console.error("Database disconnection failed:", error.message);
        throw error;
    }
}
module.exports=db;