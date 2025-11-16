const Order = require("../models/orderModel");
const Frame = require("../models/frameModel");

// Create Order
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Order must have at least one item!" });
    }

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ error: "Shipping address and payment method are required!" });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Validate items and calculate total
    for (const item of items) {
      const frame = await Frame.findById(item.frame);

      if (!frame) {
        return res.status(404).json({ error: "Frame not found!" });
      }

      if (!frame.quantity || frame.quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${frame.name}. Available: ${frame.quantity}, Requested: ${item.quantity}`,
        });
      }

      const itemSubtotal = frame.price * item.quantity;
      totalAmount += itemSubtotal;

      orderItems.push({
        frame: frame._id,
        frameId: frame._id,
        quantity: item.quantity,
        price: frame.price,
        subtotal: itemSubtotal,
      });

      // Update stock
      frame.quantity -= item.quantity;
      await frame.save();
    }

    // Create order
    const order = new Order({
      user: req.user.userId,
      items: orderItems,
      shippingAddress,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "cash-on-delivery" ? "pending" : "paid",
      orderStatus: "pending",
      notes,
    });

    await order.save();

    res.status(201).json({ message: "Order created successfully.", order });
  } catch (error) {
    console.log("Error creating order", error);
    res.status(500).json({ error: "Server error. Please try again later!" });
  }
};

// Get All Orders
const getAllOrders = async (req, res) => {
  try {
    let query = {};

    // Regular users can only see their own orders
    if (req.user.role !== "admin") {
      query.user = req.user.userId;
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
      .populate("user", "username fullname email mobile address")
      .populate("items.frame", "name brand image price");

    if (!order) {
      return res.status(404).json({ error: "Order not found!" });
    }

    // Check if user owns the order or is admin
    if (req.user.role !== "admin" && order.user._id.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: "Not authorized to access this order!" });
    }

    res.status(200).json({ order });
  } catch (error) {
    console.log("Error fetching order", error);
    res.status(500).json({ error: "Server error. Please try again later!" });
  }
};

// Update Order Status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, trackingNumber } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found!" });
    }

    // Restore stock if order is cancelled
    if (orderStatus === "cancelled" && order.orderStatus !== "cancelled") {
      for (const item of order.items) {
        const frame = await Frame.findById(item.frame);
        if (frame) {
          frame.quantity += item.quantity;
          await frame.save();
        }
      }
    }

    order.orderStatus = orderStatus;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    order.updatedAt = Date.now();

    await order.save();

    res.status(200).json({ message: "Order status updated successfully!", order });
  } catch (error) {
    console.log("Error updating order status", error);
    res.status(500).json({ error: "Server error. Please try again later!" });
  }
};

// Update Payment Status (Admin only)
const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus, updatedAt: Date.now() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found!" });
    }

    res.status(200).json({ message: "Payment status updated successfully!", order });
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

    // Check authorization
    if (req.user.role !== "admin" && order.user.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: "Not authorized to cancel this order!" });
    }

    // Check if order can be cancelled
    if (["cancelled", "delivered", "shipped"].includes(order.orderStatus)) {
      return res.status(400).json({
        error: `Cannot cancel order with status: ${order.orderStatus}`,
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

    res.status(200).json({ message: "Order cancelled successfully!", order });
  } catch (error) {
    console.log("Error cancelling order", error);
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
};
