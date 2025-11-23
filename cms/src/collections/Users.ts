import { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'createdAt'],
  },

  access: {
    read: ({ req }) => {
      // admins can read everyone
      if (req.user?.role === 'admin') return true;

      // agents can read service providers and themselves
      if (req.user?.role === 'agent') return true;

      // basic users can only read themselves
      if (req.user) {
        return {
          id: { equals: req.user.id },
        };
      }

      return false;
    },

    create: () => true, // allow signups

    update: ({ req }) => {
      if (req.user?.role === 'admin') return true;

      // users can edit their own profile only
      if (req.user) {
        return {
          id: { equals: req.user.id },
        };
      }

      return false;
    },

    delete: ({ req }) => req.user?.role === 'admin',
  },

  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'client',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Agent', value: 'agent' },
        { label: 'Broker / Team Leader', value: 'broker' },
        { label: 'Client / Consumer', value: 'client' },
        { label: 'Investor (Pro Tier)', value: 'investor' },
        { label: 'Service Provider (Title, Lender, Vendor)', value: 'provider' },
        { label: 'Host (Short-Term Rentals)', value: 'host' },
      ],
    },

    // Stripe Subscription Fields - Step 33
    {
      name: 'stripeCustomerId',
      type: 'text',
      label: 'Stripe Customer ID',
      admin: { readOnly: true },
    },

    {
      name: 'stripeSubscriptionId',
      type: 'text',
      label: 'Stripe Subscription ID',
      admin: { readOnly: true },
    },

    {
      name: 'subscriptionTier',
      type: 'select',
      label: 'Subscription Tier',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Basic', value: 'basic' },
        { label: 'Pro', value: 'pro' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
      defaultValue: 'none',
    },

    {
      name: 'subscriptionStatus',
      type: 'select',
      label: 'Subscription Status',
      options: [
        { label: 'Inactive', value: 'inactive' },
        { label: 'Active', value: 'active' },
        { label: 'Trialing', value: 'trialing' },
        { label: 'Past Due', value: 'past_due' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Unpaid', value: 'unpaid' },
      ],
      defaultValue: 'inactive',
    },

    {
      name: 'subscriptionCurrentPeriodEnd',
      type: 'number',
      label: 'Subscription Period End (Unix timestamp)',
      admin: { readOnly: true },
    },

    {
      name: 'subscriptionCancelAtPeriodEnd',
      type: 'checkbox',
      label: 'Cancel at Period End',
      admin: { readOnly: true },
    },

    {
      name: 'profile',
      type: 'group',
      fields: [
        { name: 'firstName', type: 'text' },
        { name: 'lastName', type: 'text' },
        { name: 'company', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'bio', type: 'textarea' },
      ],
    },
  ],
};
