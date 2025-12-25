const express = require("express");
const router = express.Router();
const Razorpay = require("../utils/razorpay");
const crypto = require("crypto");

// Create order
router.post("/create-order/:listingId", async (req, res) => {
    try {
        const { listingId } = req.params;
        const { amount } = req.body; // amount in rupees

        if (!amount) return res.status(400).json({ error: "Amount is required" });

        // ⚡ Razorpay receipt max length 40
        const shortReceipt = `booking_${listingId.slice(-10)}`; // last 10 chars of listingId

        const options = {
            amount: amount * 100, // convert to paise
            currency: "INR",
            receipt: shortReceipt,
            payment_capture: 1, // auto-capture payment
        };

        const order = await Razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Verify payment
router.post("/verify-payment", (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: "Payment verification failed" });
    }
});

module.exports = router;
