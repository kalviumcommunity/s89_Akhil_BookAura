const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const auth = require("../middleware/auth");

// routes/payment.js
router.post("/create-checkout-session",auth, async (req, res) => {
    const { book } = req.body;
  
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: book.title,
              description: `By ${book.author}`,
              images: [book.coverimage],
            },
            unit_amount: book.price * 100, // price in cents
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });
  
    res.json({ url: session.url });
  });
  module.exports = router;