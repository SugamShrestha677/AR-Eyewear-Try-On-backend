const Order = require("../models/orderModel");
const Frame = require("../models/frameModel");

// Helper function to check if user can modify order
const canUserModifyOrder = (order, userId, userRole) => {
  // ADMIN can do anything
  if (userRole === "ADMIN") return true;
  
  // User can only modify their own orders
  if (order.user.toString() !== userId.toString()) return false;
  
  // User can only modify orders with specific statuses
  const allowedStatusesForUser = ["pending", "processing"];
  return allowedStatusesForUser.includes(order.orderStatus);
};

// Helper function to check if status transition is valid
const isValidStatusTransition = (currentStatus, newStatus, userRole) => {
  const validTransitions = {
    "pending": ["processing", "cancelled"],
    "processing": ["shipped", "cancelled"], // Removed "pending" from user transitions
    "shipped": ["delivered"],
    "delivered": [],
    "cancelled": []
  };

  // ADMIN can do any transition
  if (userRole === "ADMIN") return true;

  // User can only cancel pending/processing orders
  if (userRole === "user") {
    if (newStatus === "cancelled" && ["pending", "processing"].includes(currentStatus)) return true;
    // User cannot revert from processing to pending
    return false;
  }

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

// Create Order (User only)
const createOrder = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body is empty" });
    }

    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Order must have at least one item!" });
    }

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ 
        error: "Shipping address and payment method are required!",
      });
    }

    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
      return res.status(400).json({ 
        error: "Shipping address must contain fullName, phone, and address fields!" 
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.frame || !item.quantity) {
        return res.status(400).json({ 
          error: "Each item must have frame ID and quantity!" 
        });
      }

      const frame = await Frame.findById(item.frame);
      if (!frame) {
        return res.status(404).json({ 
          error: `Frame with ID ${item.frame} not found!` 
        });
      }

      if (frame.quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${frame.name}. Available: ${frame.quantity}, Requested: ${item.quantity}`,
        });
      }

      const itemSubtotal = frame.price * item.quantity;
      totalAmount += itemSubtotal;

      orderItems.push({
        frame: frame._id,
        quantity: item.quantity,
        price: frame.price,
        subtotal: itemSubtotal,
      });

      // Update stock
      frame.quantity -= item.quantity;
      await frame.save();
    }

    const order = new Order({
      user: req.userId,
      items: orderItems,
      shippingAddress,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "cash-on-delivery" ? "pending" : "paid",
      orderStatus: "pending",
      notes: notes || "",
    });

    await order.save();

    res.status(201).json({ 
      message: "Order created successfully.", 
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.log("Error creating order", error);
    res.status(500).json({ 
      error: "Server error. Please try again later!",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get All Orders
const getAllOrders = async (req, res) => {
  try {
    let query = {};

    // Regular users can only see their own orders
    if (req.user.role !== "ADMIN") {
      query.user = req.userId;
    }

    if (req.query.status) {
      query.orderStatus = req.query.status;
    }

    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }

    const orders = await Order.find(query)
      .populate("user", "username fullname email mobile")
      .populate("items.frame", "name brand image price")
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (error) {
    console.log("Error fetching orders", error);
    res.status(500).json({ error: "Server error. Please try again later!" });
  }
};

// Get Single Order
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "username fullname email mobile")
      .populate("items.frame", "name brand image price");

    if (!order) {
      return res.status(404).json({ error: "Order not found!" });
    }

    // Check if user owns the order or is ADMIN
    if (req.user.role !== "ADMIN" && order.user._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized to access this order!" });
    }

    res.status(200).json({ order });
  } catch (error) {
    console.log("Error fetching order", error);
    res.status(500).json({ error: "Server error. Please try again later!" });
  }
};

// Update Order Status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, trackingNumber } = req.body;

    if (!orderStatus) {
      return res.status(400).json({ error: "Order status is required!" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found!" });
    }

    // Check if user can modify this order
    if (!canUserModifyOrder(order, req.userId, req.user.role)) {
      return res.status(403).json({ 
        error: "Not authorized to modify this order!",
        details: "You can only modify pending or processing orders"
      });
    }

    // Check if status transition is valid
    if (!isValidStatusTransition(order.orderStatus, orderStatus, req.user.role)) {
      return res.status(400).json({ 
        error: "Invalid status transition!",
        currentStatus: order.orderStatus,
        requestedStatus: orderStatus,
        userRole: req.user.role,
        allowedTransitions: req.user.role === "user" 
          ? ["cancelled (from pending/processing)"] 
          : ["processing (from pending)", "shipped (from processing)", "delivered (from shipped)", "cancelled (from pending/processing)"]
      });
    }

    // Handle stock changes
    if (orderStatus === "cancelled" && order.orderStatus !== "cancelled") {
      // Restore stock when cancelling
      for (const item of order.items) {
        const frame = await Frame.findById(item.frame);
        if (frame) {
          frame.quantity += item.quantity;
          await frame.save();
        }
      }
    } else if (order.orderStatus === "cancelled" && orderStatus !== "cancelled") {
      // Reduce stock when uncancelling (moving from cancelled to another status) - ADMIN only
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Only ADMIN can uncancel orders!" });
      }
      
      for (const item of order.items) {
        const frame = await Frame.findById(item.frame);
        if (frame && frame.quantity >= item.quantity) {
          frame.quantity -= item.quantity;
          await frame.save();
        } else {
          return res.status(400).json({
            error: `Insufficient stock for ${frame.name}. Cannot uncancel order.`,
          });
        }
      }
    }

    // Update order
    order.orderStatus = orderStatus;
    if (trackingNumber && req.user.role === "ADMIN") {
      order.trackingNumber = trackingNumber;
    }
    order.updatedAt = Date.now();

    await order.save();

    res.status(200).json({ 
      message: "Order status updated successfully!", 
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        updatedAt: order.updatedAt,
        trackingNumber: order.trackingNumber
      }
    });
  } catch (error) {
    console.log("Error updating order status", error);
    res.status(500).json({ error: "Server error. Please try again later!" });
  }
};

// Update Payment Status (ADMIN only)
const updatePaymentStatus = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Only ADMIN can update payment status!" });
    }

    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({ error: "Payment status is required!" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found!" });
    }

    order.paymentStatus = paymentStatus;
    order.updatedAt = Date.now();

    await order.save();

    res.status(200).json({ 
      message: "Payment status updated successfully!", 
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.log("Error updating payment status", error);
    res.status(500).json({ error: "Server error. Please try again later!" });
  }
};

// Cancel Order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found!" });
    }

    // Check if user can cancel this order
    if (!canUserModifyOrder(order, req.userId, req.user.role)) {
      return res.status(403).json({ 
        error: "Not authorized to cancel this order!",
        details: "You can only cancel pending or processing orders"
      });
    }

    // Check if order can be cancelled
    if (!["pending", "processing"].includes(order.orderStatus)) {
      return res.status(400).json({
        error: `Cannot cancel order with status: ${order.orderStatus}`,
        allowedStatuses: ["pending", "processing"]
      });
    }

    // Restore stock
    for (const item of order.items) {
      const frame = await Frame.findById(item.frame);
      if (frame) {
        frame.quantity += item.quantity;
        await frame.save();
      }
    }

    order.orderStatus = "cancelled";
    order.updatedAt = Date.now();
    await order.save();

    res.status(200).json({ 
      message: "Order cancelled successfully!", 
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.log("Error cancelling order", error);
    res.status(500).json({ error: "Server error. Please try again later!" });
  }
};

// Update Order Items (User can update items when order is pending)
const updateOrderItems = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Items are required!" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found!" });
    }

    // Only user can update their own order, and only when status is pending
    if (order.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized to update this order!" });
    }

    if (order.orderStatus !== "pending") {
      return res.status(400).json({ 
        error: `Cannot update order items when status is ${order.orderStatus}. Only pending orders can be updated.` 
      });
    }

    // Restore original stock first
    for (const oldItem of order.items) {
      const frame = await Frame.findById(oldItem.frame);
      if (frame) {
        frame.quantity += oldItem.quantity;
        await frame.save();
      }
    }

    let totalAmount = 0;
    const updatedItems = [];

    // Process new items
    for (const item of items) {
      if (!item.frame || !item.quantity) {
        return res.status(400).json({ 
          error: "Each item must have frame ID and quantity!" 
        });
      }

      const frame = await Frame.findById(item.frame);
      if (!frame) {
        return res.status(404).json({ 
          error: `Frame with ID ${item.frame} not found!` 
        });
      }

      if (frame.quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${frame.name}. Available: ${frame.quantity}, Requested: ${item.quantity}`,
        });
      }

      const itemSubtotal = frame.price * item.quantity;
      totalAmount += itemSubtotal;

      updatedItems.push({
        frame: frame._id,
        quantity: item.quantity,
        price: frame.price,
        subtotal: itemSubtotal,
      });

      // Deduct new quantities
      frame.quantity -= item.quantity;
      await frame.save();
    }

    // Update order
    order.items = updatedItems;
    order.totalAmount = totalAmount;
    order.updatedAt = Date.now();

    await order.save();

    res.status(200).json({ 
      message: "Order items updated successfully!", 
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        items: order.items,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.log("Error updating order items", error);
    res.status(500).json({ error: "Server error. Please try again later!" });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  updateOrderItems,
};