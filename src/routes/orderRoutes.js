const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/auth");

// Apply auth middleware to all order routes
router.use(auth);

// User routes
router.post("/createOrder", orderController.createOrder);
router.get("/allOrders", orderController.getAllOrders);
router.get("/:orderId", orderController.getOrderById);
router.put("/:orderId/cancel", orderController.cancelOrder);
router.put("/:orderId/items", orderController.updateOrderItems);
router.put("/:orderId/status", orderController.updateOrderStatus); // User can update to pending/cancelled

// Admin only routes
router.put("/:orderId/payment", orderController.updatePaymentStatus);

module.exports = router;