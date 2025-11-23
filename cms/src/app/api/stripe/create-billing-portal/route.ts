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

    // Check if user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer ID found. Please subscribe first.' },
        { status: 400 }
      );
    }

    console.log(`Creating billing portal session for user: ${user.email}`);

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.PUBLIC_WEBSITE_URL}/billing`,
    });

    console.log(`✓ Billing portal session created: ${session.id}`);

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Billing Portal Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
