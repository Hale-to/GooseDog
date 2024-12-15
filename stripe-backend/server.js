require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const path = require('path'); // For handling file paths

const app = express();
const PORT = process.env.PORT || 4242;

app.use(express.static('public'));
app.use(express.json());
app.use(cors({ origin: 'https://your-frontend-url.com' })); // Replace with your frontend URL

// Function to calculate shipping cost
function calculateShippingCost(destinationAddress) {
  const flatRate = 1000; // Flat shipping fee (in cents)
  return flatRate;
}

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, shippingAddress } = req.body;
    
    // Calculate shipping and total amount
    const shippingCost = calculateShippingCost(shippingAddress);
    const totalAmount = amount + shippingCost; 

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount, 
      currency,
      automatic_payment_methods: { enabled: true },
      shipping: {
        name: shippingAddress.name,
        address: shippingAddress.address
      }
    });

    res.send({ 
      clientSecret: paymentIntent.client_secret,
      shippingCost: shippingCost / 100, 
      totalAmount: totalAmount / 100  
    });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(400).send({ error: error.message });
  }
});

app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html')); // Serves /public/success.html
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
