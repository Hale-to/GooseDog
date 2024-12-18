require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const path = require('path'); // For handling file paths

const app = express();
const PORT = process.env.PORT || 4242;

app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from /public
app.use(express.json());
app.use(cors({ origin: 'https://goosedog.art' })); // Replace with your frontend URL

// Function to calculate shipping cost
function calculateShippingCost(destinationAddress) {
  const flatRate = 1000; // Flat shipping fee (in cents)
  return flatRate;
}

// Create a Stripe checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    const shippingCost = calculateShippingCost(shippingAddress);
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100, // Convert dollars to cents
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Shipping Fee',
        },
        unit_amount: shippingCost, // Already in cents
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: 'https://goosedog.art/success', // Replace with your production URL
      cancel_url: 'https://goosedog.art/cancel', // Replace with your production URL
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(400).send({ error: error.message });
  }
});

// Serve success page
app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// Serve cancel page
app.get('/cancel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cancel.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
