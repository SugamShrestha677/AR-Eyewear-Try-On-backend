const Cart = require("../models/cartModel");
const CartItem = require("../models/cartItemModel");
const Frame = require("../models/frameModel");
const { model } = require("mongoose");
// const { model } = require("mongoose");

const getCart = async (req, res) => {
  try {
    // 1️⃣ Get the logged-in user's ID from the request (set by auth middleware)
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items", // the item field in cart model
      // populate: {
      //   path: "frame", // inside each item, populate the frame details too
      //   model: "Frame",
      // },
    });

    // if user dont have a cart yet, create an empty one
    if (!cart) {
      const newCart = new Cart({
        user: userId,
        items: [],
        totalPrice: 0,
      });
      await newCart.save();

      return res.status(200).json({
        message: "you dont have a cart yet - new empty cart created!",
        cart: newCart,
        items: [],
      });
    }

    // if cart exists, send it to the frontend
    res.status(200).json({
      message: "Cart retrived successfully!",
      cart: cart,
      items: cart.items,
    });
  } catch (error) {
    console.log("Error getting Cart", error);
    res.status(500).json({ message: "Server Error! ", error });
  }
};


const addItemToCart = async (req,res) => {
  try{
    // 1️⃣ Get frameId and quantity from the request body
    const {frameId, quantity} = req.body;

    // 2️⃣ Get the current logged-in user ID (from JWT middleware)
    const userId = req.user._id;

    // 3️⃣ Check if frameId and quantity were sent
    if (!frameId || !quantity) {
      return res.status(400).json({message:"Please provide both frameId and quantity!"})
    }

    // 4️⃣ Find the frame (product) in the database
    const frame = await Frame.findById(frameId);
    if (!frame) {
      return res.status(400).json({error:"Frame not found"})
    }


    // 5️⃣ Check if the user already has a cart, if not create a new one
    const cart = await Cart.findOne({user:userId});
    if (!cart) {
      cart = new Cart({
        user:userId,
        items:[],
        totalPrice:0
      });
      await cart.save();
    }

    // 6️⃣ Check if this frame is already in the cart
    let cartItem = await CartItem.findOne({
      cart:cart._id,
      frame:frameId
    })

    if (cartItem) {
      cartItem.quantity+=quantity;
      await cartItem.save();
    }
    else{
      cartItem = new CartItem({
        cart:cart._id,
        frame:frameId,
        quantity:quantity,
        price:frame.price,
      });
      await cartItem.save();

      // Add this new CartItem’s ID to the Cart’s items array
      cart.items.push(cartItem._id);
      await cart.save();
    }


    // 7️⃣ Update total price of the cart
    await updateCartTotal(cart._id);

    // fetch updated cart with full frame details 
    const updatedCart =await Cart.findById(cart._id)
    .populate({
      path:"items",
      populate:{path:"frame",model:"Frame",select:"name price image brand"},
    });

    // send success respomse back
    res.status(200).json({message:"Item added to cart successfully!",
      cart:updatedCart
    })


  }
  catch(error){
    console.log("Error in adding to cart", error);
    res.status(500).json({error:"Server error"});
  }
}

// This function takes the cart ID and updates its total price
const updateCartTotal = async (cartId) => {
  try {
    // 1️⃣ Find all cart items that belong to this cart
    const cartItems = await CartItem.find({ cart: cartId });

    // 2️⃣ Calculate total by looping through all items
    // Example: price * quantity for each item, then sum them all
    let total = 0;
    for (let item of cartItems) {
      total += item.price * item.quantity;
    }

    // 3️⃣ Update the cart’s totalPrice in the database
    await Cart.findByIdAndUpdate(cartId, { totalPrice: total });

    // 4️⃣ (Optional) return the total, in case other functions need it
    return total;
  } catch (error) {
    console.error("Error updating cart total:", error);
    throw error; // throw the error so the controller can handle it
  }
};



// UPDATE CART ITEM (change quantity)
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { frameId, quantity } = req.body;

    // 1️⃣ Validate input
    if (frameId == null || quantity == null) {
      return res.status(400).json({ message: "frameId and quantity are required!" });
    }

    // 2️⃣ Find user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found!" });
    }

    // 3️⃣ Find the specific item in the cart
    const cartItem = await CartItem.findOne({
      cart: cart._id,
      frame: frameId
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart!" });
    }

    // 4️⃣ If quantity is 0 → remove item from cart
    if (quantity === 0) {
      await CartItem.deleteOne({ _id: cartItem._id });

      // Remove from cart.items array
      cart.items = cart.items.filter(id => id.toString() !== cartItem._id.toString());
      await cart.save();

      await updateCartTotal(cart._id);

      return res.status(200).json({ message: "Item removed from cart!" });
    }

    // 5️⃣ Otherwise, update quantity
    cartItem.quantity = quantity;
    await cartItem.save();

    // 6️⃣ Update total price
    await updateCartTotal(cart._id);

    // 7️⃣ Return updated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items",
      populate: { path: "frame", model: "Frame" }
    });

    res.status(200).json({
      message: "Cart updated successfully!",
      cart: updatedCart
    });

  } catch (error) {
    console.log("Error updating cart:", error);
    res.status(500).json({ error: "Server error" });
  }
};



// REMOVE ITEM FROM CART
const removeFromCart = async (req, res) =>{
  try {
    const {cartItemId} = req.params;
    const userId = req.user._id;

    if (!cartItemId) {
      return res.status(400).json({error:"Cart item ID is required!"})
    }
    // Also populate its 'cart' field so we know which cart it belongs to
    const cartItem = await CartItem.findById(cartItemId).populate("cart");
    if (!cartItem) {
      return res.status(404).json({error:"Cart item not found!"})
    }

    if (cartItem.cart.user.toString() !== userId.toString()) {
      return res.status(403).json({error:"You are not allowed to remove this item!"})
    }

    const cartId = cartItem.cart._id; // Store cart ID for later


    // 4️⃣ Delete the CartItem document from database
    await CartItem.findByIdAndDelete(cartItemId);

    // 👉 9. Remove the item from the cart's items array
    await Cart.findByIdAndUpdate(cartId,{
      $pull:{items:cartItemId} // Remove the ID from the array
    })
    
    await updateCartTotal(cartId);

    const updatedCart = await Cart.findById(cartId).populate({
      path:"items",
      populate:{path:"frame", model:"Frame"}
    });

    res.status(200).json({
      message:"Item removed from cart",
      cart:updatedCart
    });
    

  } catch (error) {
    console.log("Error in removing items from cart", error)
    res.status(500).json({error:"Server error. Please try again later!"})
  }
}

const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find user's cart
    const cart = await Cart.findOne({user:userId});
    if (!cart) {
      return res.status(404).json({message:"Cart not found!"})
    }


    // remove from cart

    await CartItem.deleteMany({cart:cart._id})

    //reset after delete

    cart.items=[]
    cart.totalPrice=0
    await cart.save();

    res.status(200).json({message:"Cart cleared successfully!",
      cart:cart
    });


    
  } catch (error) {
    console.log("Error in clearing Cart");
    res.status(500).json*{error:"Server Error! Please try again Later."}
  }
} 
module.exports={getCart,addItemToCart,updateCartItem, removeFromCart, clearCart};