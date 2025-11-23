import { NextRequest, NextResponse } from 'next/server';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import config from '@payload-config';
import Stripe from 'stripe';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

export async function POST(req: NextRequest) {
  const payload = await getPayloadHMR({ config });

  try {
    // Get the Payload token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('payload-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify the token and get the user
    const { user } = await payload.auth({ headers: req.headers });

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { tier } = body;

    // Determine price ID based on tier requested
    const PRICE_MAP: Record<string, string> = {
      basic: process.env.STRIPE_PRICE_BASIC!,
      pro: process.env.STRIPE_PRICE_PRO!,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
    };

    const priceId = PRICE_MAP[tier];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    console.log(`Creating checkout session for user: ${user.email}, tier: ${tier}`);

    // 1. Ensure Stripe customer exists
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      console.log('Creating new Stripe customer...');

      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          payloadUserId: user.id,
        },
      });

      customerId = customer.id;

      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          stripeCustomerId: customerId,
        },
      });

      console.log(`✓ Stripe customer created: ${customerId}`);
    } else {
      console.log(`Using existing Stripe customer: ${customerId}`);
    }

    // 2. Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.PUBLIC_WEBSITE_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_WEBSITE_URL}/billing/cancel`,
      subscription_data: {
        metadata: {
          payloadUserId: user.id,
          tier,
        },
      },
    });

    console.log(`✓ Checkout session created: ${session.id}`);

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
