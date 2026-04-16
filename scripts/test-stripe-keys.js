/* Simple Stripe key smoke test.
 * - Loads STRIPE_SECRET_KEY and REACT_APP_STRIPE_PUBLISHABLE_KEY from .env
 * - Validates basic format
 * - Calls stripe.balance.retrieve() to confirm the secret key works
 *
 * Usage:
 *   node scripts/test-stripe-keys.js
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from project root .env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const secretKey = process.env.STRIPE_SECRET_KEY;
const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

if (!secretKey) {
  console.error('Missing STRIPE_SECRET_KEY in .env');
  process.exit(1);
}

if (!publishableKey) {
  console.error('Missing REACT_APP_STRIPE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

const isTestSecret = secretKey.startsWith('sk_test_');
const isLiveSecret = secretKey.startsWith('sk_live_');
const isTestPublishable = publishableKey.startsWith('pk_test_');
const isLivePublishable = publishableKey.startsWith('pk_live_');

console.log('Publishable key mode:', isTestPublishable ? 'test' : isLivePublishable ? 'live' : 'unknown');
console.log('Secret key mode:', isTestSecret ? 'test' : isLiveSecret ? 'live' : 'unknown');

if (isTestPublishable !== isTestSecret || isLivePublishable !== isLiveSecret) {
  console.warn('Warning: Publishable and secret key environments do not match.');
}

const stripe = require('stripe')(secretKey);

async function main() {
  try {
    const balance = await stripe.balance.retrieve();
    console.log('✅ Stripe secret key works. Balance object retrieved.');
    console.log('  Available:', balance.available.map(b => `${b.amount} ${b.currency}`).join(', ') || 'none');
    console.log('  Pending:', balance.pending.map(b => `${b.amount} ${b.currency}`).join(', ') || 'none');
  } catch (err) {
    console.error('❌ Stripe secret key test failed.');
    if (err.type) console.error('Type:', err.type);
    if (err.code) console.error('Code:', err.code);
    if (err.message) console.error('Message:', err.message);
    process.exit(1);
  }
}

main();

