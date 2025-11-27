const Frame = require("../models/frameModel");

// Add Frame
const addFrame = async(req, res) => {
    try {
        const {name, brand, type, shape, price, quantity, image, colors, overlayImage} = req.body;
        if (!name || !brand || !type || !shape || !price || !quantity || !image || !colors || !overlayImage){
            return res.status(400).json({error:"All fields are required!"})
        }
        const existingFrame = await Frame.findOne({name})
        if (existingFrame) {
            return res.status(400).json({error:"Frame already exists!"})
        }
        const frame = new Frame({
            name,
            brand,
            type,
            shape,
            price,
            quantity,
            image,
            colors,
            overlayImage
        });

        await frame.save();
        res.status(201).json({message:"Frame added successfully.", frame});
    } catch (error) {
        console.log("Error adding Frame:", {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        res.status(500).json({error:"Server error. Please try again later!"})
    }
}

// Delete Frame
const deleteFrame = async (req,res) => {
    try {
        const {frameId} = req.params;
        const frame = await Frame.findByIdAndDelete(frameId);
        if (!frame) {
            res.status(404).json({error:"Frame not found"})
        }
        res.status(200).json({message:"Frame deleted successfully!"})
        
    } catch (error) {
        console.log("Error deleting frame", error)
        res.status(500).json({error:"Server Error. Please Try again later."})
    }
}

// get all frames
const getAllFrames = async (req,res) => {
    try {
        const frames = await Frame.find();
        res.status(200).json({frames})   
    } catch (error) {
        console.log("Error fetching all users.", error)
        res.status(500).json({error:"Server error. Please Try again Later!"});
    }
}

// Update Frame
const UpdateFrame = async (req,res) => {
    try {
        const {name, brand, type, shape, price, quantity, image, colors, overlayImage} = req.body;
        const {frameId} = req.params;
        const frame = await Frame.findByIdAndUpdate(frameId)
        if (!frame) {
            return res.status(404).json({error:"Frame not found!"})
        }

        const Updatedframe = new Frame({
            name,
            brand,
            type,
            shape,
            price,
            quantity,
            image,
            colors,
<<<<<<< HEAD
            overlayImage
=======
            overlayImage,
>>>>>>> 993ca65e0ad6261d529e10e25174a1ca5c9ad150
        });

        await Updatedframe.save();
         res.status(201).json({message:"Frame Updated successfully.", Updatedframe});
    } catch (error) {
        console.log("Error in updating frame!", error)
        res.status(500).json({error:"Server error! Please try again later!"})
    }
    
    
}

// Get Frame by ID
const getFrameById = async (req, res) => {
    try {
        const { frameId } = req.params;
        const frame = await Frame.findById(frameId);
        if (!frame) {
            return res.status(404).json({ error: "Frame not found!" });
        }
        res.status(200).json({ frame });
    } catch (error) {
        console.log("Error fetching frame by ID", error);
        res.status(500).json({ error: "Server error! Please try again later!" });
    }
};
        
module.exports={addFrame, getAllFrames, deleteFrame, UpdateFrame, getFrameById}