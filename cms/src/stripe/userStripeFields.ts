/**
 * User Stripe Fields - Step 31
 * Placeholder for Stripe-related user fields
 * Will be integrated into Users collection in Step 33
 *
 * DO NOT import this into Users.ts yet
 */

export const stripeUserFields = {
  customerId: {
    type: 'text' as const,
  },
  subscriptionStatus: {
    type: 'text' as const,
  },
  subscriptionTier: {
    type: 'text' as const,
  },
};
