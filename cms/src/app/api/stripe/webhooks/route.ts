import { NextRequest, NextResponse } from 'next/server';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import config from '@payload-config';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

export async function POST(req: NextRequest) {
  const payload = await getPayloadHMR({ config });
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('⚠️ Stripe webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook error: ${err.message}` },
      { status: 400 }
    );
  }

  console.log(`✓ Stripe webhook received: ${event.type}`);

  switch (event.type) {
    case 'customer.created': {
      const customer = event.data.object as Stripe.Customer;
      console.log(`Customer created: ${customer.id}`);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as any;

      console.log(`Subscription ${event.type}: ${subscription.id}`);

      const user = await payload.find({
        collection: 'users',
        where: { stripeCustomerId: { equals: subscription.customer as string } },
      });

      if (user.docs.length > 0) {
        console.log(`Updating user: ${user.docs[0].email}`);

        await payload.update({
          collection: 'users',
          id: user.docs[0].id,
          data: {
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionCurrentPeriodEnd: subscription.current_period_end,
            subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });

        console.log(`✓ User updated successfully`);
      } else {
        console.warn(`No user found with stripeCustomerId: ${subscription.customer}`);
      }

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      console.log(`Subscription deleted: ${subscription.id}`);

      const user = await payload.find({
        collection: 'users',
        where: { stripeCustomerId: { equals: subscription.customer as string } },
      });

      if (user.docs.length > 0) {
        console.log(`Canceling subscription for user: ${user.docs[0].email}`);

        await payload.update({
          collection: 'users',
          id: user.docs[0].id,
          data: {
            subscriptionStatus: 'canceled',
            subscriptionTier: 'none',
            subscriptionCurrentPeriodEnd: null,
            stripeSubscriptionId: null,
          },
        });

        console.log(`✓ User subscription canceled`);
      }

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;

      console.log(`Payment failed for invoice: ${invoice.id}`);

      const user = await payload.find({
        collection: 'users',
        where: { stripeCustomerId: { equals: invoice.customer as string } },
      });

      if (user.docs.length > 0) {
        console.log(`Marking user as past_due: ${user.docs[0].email}`);

        await payload.update({
          collection: 'users',
          id: user.docs[0].id,
          data: { subscriptionStatus: 'past_due' },
        });

        console.log(`✓ User marked as past_due`);
      }

      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;

      console.log(`Payment succeeded for invoice: ${invoice.id}`);

      const user = await payload.find({
        collection: 'users',
        where: { stripeCustomerId: { equals: invoice.customer as string } },
      });

      if (user.docs.length > 0) {
        console.log(`Confirming active status for user: ${user.docs[0].email}`);

        await payload.update({
          collection: 'users',
          id: user.docs[0].id,
          data: { subscriptionStatus: 'active' },
        });

        console.log(`✓ User subscription confirmed as active`);
      }

      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
