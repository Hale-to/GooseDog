require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const path = require('path'); 

const app = express();
const PORT = process.env.PORT || 4242;

app.use(express.static(__dirname));
app.use(express.json());
app.use(cors({ origin: 'https://goosedog.art' })); // Replace with your frontend URL

// Function to calculate shipping cost
function calculateShippingCost(destinationAddress) {
  return 1000; // Flat shipping fee in cents ($10.00)
}

// Create a Checkout Session for Stripe
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { cartItems, shippingAddress } = req.body;
    
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Convert cart items to Stripe line items
    const lineItems = cartItems.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add shipping as a separate line item
    const shippingCost = calculateShippingCost(shippingAddress);
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Shipping",
        },
        unit_amount: shippingCost,
      },
      quantity: 1,
    });

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: "https://goosedog.art/success.html",
      cancel_url: "https://goosedog.art/cart.html",
      shipping_address_collection: {
        allowed_countries: ["US", "CA"], // Adjust as needed
      },
    });

    res.json({ sessionId: session.id });

  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Serve success page
app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
