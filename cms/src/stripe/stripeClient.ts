/**
 * Stripe Client - Step 31
 * Centralizes Stripe connection for the CMS
 * Ensures no other file needs to import Stripe directly
 *
 * Note: STRIPE_SECRET_KEY is optional until Step 32
 * The client will be initialized once the key is provided
 */

import Stripe from 'stripe';

// Lazy initialization - only create client if key is present
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY missing from environment");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
    });
  }

  return stripeInstance;
};

// For backwards compatibility - will be used in Step 32+
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    return getStripe()[prop as keyof Stripe];
  }
});
