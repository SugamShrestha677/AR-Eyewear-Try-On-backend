const express = require("express");

const router = express.Router();
const orderController = require("../controllers/orderController");

router.post("/createOrder", orderController.createOrder);
router.get("/allOrders", orderController.getAllOrders);
router.get("/:orderId", orderController.getOrderById);
router.put("/:orderId/status", orderController.updateOrderStatus);
router.put("/:orderId/payment", orderController.updatePaymentStatus);
router.put("/:orderId/cancel", orderController.cancelOrder);

module.exports = router;
