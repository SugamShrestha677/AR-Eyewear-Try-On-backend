const Frame = require("../models/frameModel");
const MainCategory = require("../models/MainCategoryModel");
const SubCategory = require("../models/SubCategoryModel");

// Add Frame
const addFrame = async(req, res) => {
    try {
        const {
            name, 
            brand, 
            mainCategory, 
            subCategory, 
            type, 
            shape, 
            price, 
            quantity, 
            colors, 
            description,
            size
        } = req.body;

        // Check if files are uploaded
        if (!req.files || !req.files.images || !req.files.overlayImage) {
            return res.status(400).json({error:"Product images and overlay image are required!"});
        }

        // Required fields validation
        if (!name || !brand || !mainCategory || !subCategory || !type || !shape || 
            !price || !quantity || !colors || !size) {
            return res.status(400).json({error:"All fields are required!"});
        }

        // Check if categories exist
        const mainCatExists = await MainCategory.findById(mainCategory);
        const subCatExists = await SubCategory.findById(subCategory);
        
        if (!mainCatExists) {
            return res.status(400).json({error:"Main category not found!"});
        }
        if (!subCatExists) {
            return res.status(400).json({error:"Sub category not found!"});
        }

        // Check if frame with same name already exists
        const existingFrame = await Frame.findOne({name});
        if (existingFrame) {
            return res.status(400).json({error:"Frame already exists!"});
        }

        // Process multiple product images
        const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        const processedImages = imageFiles.map(file => ({
            data: file.buffer,
            contentType: file.mimetype,
            filename: file.originalname,
            size: file.size
        }));

        // Process overlay image
        const overlayImageFile = req.files.overlayImage[0];
        const processedOverlayImage = {
            data: overlayImageFile.buffer,
            contentType: overlayImageFile.mimetype,
            filename: overlayImageFile.originalname,
            size: overlayImageFile.size
        };

        // Create new frame with images stored in MongoDB
        const frame = new Frame({
            name,
            brand,
            mainCategory,
            subCategory,
            type,
            shape,
            price,
            quantity,
            images: processedImages,
            colors: Array.isArray(colors) ? colors : [colors],
            overlayImage: processedOverlayImage,
            description: description || "",
            size
        });

        await frame.save();
        
        // Populate category details in response
        const populatedFrame = await Frame.findById(frame._id)
            .populate('mainCategory', 'name')
            .populate('subCategory', 'name')
            .select('-images.data -overlayImage.data'); // Exclude binary data from response

        res.status(201).json({
            success: true,
            message: "Frame added successfully with images .", 
            data: populatedFrame
        });
    } catch (error) {
        console.log("Error adding Frame:", error);
        res.status(500).json({error:"Server error. Please try again later!"});
    }
}

// Delete Frame
const deleteFrame = async (req,res) => {
    try {
        const {frameId} = req.params;
        const frame = await Frame.findByIdAndDelete(frameId);
        
        if (!frame) {
            return res.status(404).json({error:"Frame not found"});
        }

        res.status(200).json({
            success: true,
            message: "Frame deleted successfully!",
            data: frame
        });
    } catch (error) {
        console.log("Error deleting frame", error);
        res.status(500).json({error:"Server Error. Please Try again later."});
    }
}

// Get all frames (without image binary data for performance)
const getAllFrames = async (req,res) => {
    try {
        const frames = await Frame.find()
            .populate('mainCategory', 'name')
            .populate('subCategory', 'name')
            .select('-images.data -overlayImage.data') // Exclude binary data
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: "Frames retrieved successfully",
            data: frames,
            count: frames.length
        });
    } catch (error) {
        console.log("Error fetching all frames.", error);
        res.status(500).json({error:"Server error. Please Try again Later!"});
    }
}

// Get Frame by ID (without image binary data)
const getFrameById = async (req, res) => {
    try {
        const { frameId } = req.params;
        const frame = await Frame.findById(frameId)
            .populate('mainCategory', 'name')
            .populate('subCategory', 'name')
            .select('-images.data -overlayImage.data');
            
        if (!frame) {
            return res.status(404).json({ error: "Frame not found!" });
        }
        res.status(200).json({
            success: true,
            message: "Frame retrieved successfully",
            data: frame
        });
    } catch (error) {
        console.log("Error fetching frame by ID", error);
        res.status(500).json({ error: "Server error! Please try again later!" });
    }
};

// Get individual image by frame ID and image index
const getFrameImage = async (req, res) => {
    try {
        const { frameId, imageIndex } = req.params;
        
        const frame = await Frame.findById(frameId);
        if (!frame) {
            return res.status(404).json({ error: "Frame not found!" });
        }

        // Get specific image or overlay image
        let imageData;
        if (imageIndex === 'overlay') {
            imageData = frame.overlayImage;
        } else {
            const index = parseInt(imageIndex);
            if (isNaN(index) || index < 0 || index >= frame.images.length) {
                return res.status(404).json({ error: "Image not found!" });
            }
            imageData = frame.images[index];
        }

        if (!imageData || !imageData.data) {
            return res.status(404).json({ error: "Image data not found!" });
        }

        // Set appropriate content type and send image data
        res.set('Content-Type', imageData.contentType);
        res.send(imageData.data);
    } catch (error) {
        console.log("Error fetching frame image", error);
        res.status(500).json({ error: "Server error! Please try again later!" });
    }
};

// Get overlay image
const getFrameOverlayImage = async (req, res) => {
    try {
        const { frameId } = req.params;
        
        const frame = await Frame.findById(frameId);
        if (!frame) {
            return res.status(404).json({ error: "Frame not found!" });
        }

        if (!frame.overlayImage || !frame.overlayImage.data) {
            return res.status(404).json({ error: "Overlay image not found!" });
        }

        res.set('Content-Type', frame.overlayImage.contentType);
        res.send(frame.overlayImage.data);
    } catch (error) {
        console.log("Error fetching overlay image", error);
        res.status(500).json({ error: "Server error! Please try again later!" });
    }
};

// Update Frame
const updateFrame = async (req,res) => {
    try {
        const {
            name, 
            brand, 
            mainCategory, 
            subCategory, 
            type, 
            shape, 
            price, 
            quantity, 
            colors, 
            description,
            size
        } = req.body;
        
        const {frameId} = req.params;

        // Check if frame exists
        const frame = await Frame.findById(frameId);
        if (!frame) {
            return res.status(404).json({error:"Frame not found!"});
        }

        const updateData = {
            name: name || frame.name,
            brand: brand || frame.brand,
            mainCategory: mainCategory || frame.mainCategory,
            subCategory: subCategory || frame.subCategory,
            type: type || frame.type,
            shape: shape || frame.shape,
            price: price || frame.price,
            quantity: quantity || frame.quantity,
            colors: colors || frame.colors,
            description: description || frame.description,
            size: size || frame.size
        };

        // Handle image updates if new images are provided
        if (req.files) {
            if (req.files.images) {
                const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
                updateData.images = imageFiles.map(file => ({
                    data: file.buffer,
                    contentType: file.mimetype,
                    filename: file.originalname,
                    size: file.size
                }));
            }

            if (req.files.overlayImage) {
                const overlayImageFile = req.files.overlayImage[0];
                updateData.overlayImage = {
                    data: overlayImageFile.buffer,
                    contentType: overlayImageFile.mimetype,
                    filename: overlayImageFile.originalname,
                    size: overlayImageFile.size
                };
            }
        }

        const updatedFrame = await Frame.findByIdAndUpdate(
            frameId, 
            updateData, 
            { new: true, runValidators: true }
        )
        .populate('mainCategory', 'name')
        .populate('subCategory', 'name')
        .select('-images.data -overlayImage.data');

        res.status(200).json({
            success: true,
            message: "Frame updated successfully.", 
            data: updatedFrame
        });
    } catch (error) {
        console.log("Error in updating frame!", error);
        res.status(500).json({error:"Server error! Please try again later!"});
    }
}

// Other existing functions...
const getFramesByCategory = async (req, res) => {
    try {
        const { mainCategoryId, subCategoryId } = req.query;
        let filter = {};
        
        if (mainCategoryId) {
            filter.mainCategory = mainCategoryId;
        }
        if (subCategoryId) {
            filter.subCategory = subCategoryId;
        }

        const frames = await Frame.find(filter)
            .populate('mainCategory', 'name')
            .populate('subCategory', 'name')
            .select('-images.data -overlayImage.data')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Frames retrieved successfully",
            data: frames,
            count: frames.length
        });
    } catch (error) {
        console.log("Error fetching frames by category", error);
        res.status(500).json({ error: "Server error! Please try again later!" });
    }
};

const getAvailableSizes = async (req, res) => {
    try {
        const sizes = [
            { value: "extra-small", label: "Extra Small" },
            { value: "small", label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large", label: "Large" },
            { value: "extra-large", label: "Extra Large" }
        ];
        
        res.status(200).json({
            success: true,
            message: "Sizes retrieved successfully",
            data: sizes
        });
    } catch (error) {
        console.log("Error fetching sizes", error);
        res.status(500).json({ error: "Server error! Please try again later!" });
    }
};

module.exports = {
    addFrame, 
    getAllFrames, 
    deleteFrame, 
    updateFrame, 
    getFrameById,
    getFrameImage,
    getFrameOverlayImage,
    getFramesByCategory,
    getAvailableSizes
};