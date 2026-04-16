/* Create and optionally confirm/cancel a small test PaymentIntent.
 *
 * Default: creates a $1.00 (or 100 of currency subunits) PaymentIntent in test mode.
 * It does NOT confirm the payment; it just checks that the key can create intents.
 *
 * Usage:
 *   node scripts/stripe-create-payment-intent.js
 *
 * Optional env vars:
 *   STRIPE_SECRET_KEY          - required (loaded from .env if present)
 *   CURRENCY                   - defaults to USD
 *   AMOUNT                     - integer subunits, defaults to 100
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('Missing STRIPE_SECRET_KEY in .env');
  process.exit(1);
}

const currency = process.env.CURRENCY || 'usd';
const amount = parseInt(process.env.AMOUNT || '100', 10);

if (!Number.isInteger(amount) || amount <= 0) {
  console.error('AMOUNT must be a positive integer (minor units).');
  process.exit(1);
}

const stripe = require('stripe')(secretKey);

async function main() {
  try {
    console.log(`Creating test PaymentIntent for ${amount} ${currency}...`);
    const pi = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card'],
      description: 'Test PaymentIntent created by scripts/stripe-create-payment-intent.js',
      metadata: { created_by: 'stripe-create-payment-intent-script' },
    });

    console.log('✅ PaymentIntent created:');
    console.log('  id:', pi.id);
    console.log('  client_secret:', pi.client_secret);
    console.log('  status:', pi.status);

    console.log('Note: This PaymentIntent is not confirmed. You can use the client_secret to test confirmation with a test card if needed, or cancel it:');
    console.log(`  stripe payment_intents cancel ${pi.id}`);
  } catch (err) {
    console.error('❌ Failed to create PaymentIntent');
    if (err.type) console.error('Type:', err.type);
    if (err.code) console.error('Code:', err.code);
    if (err.message) console.error('Message:', err.message);
    process.exit(1);
  }
}

main();

