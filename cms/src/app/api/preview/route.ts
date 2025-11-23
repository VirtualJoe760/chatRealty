import { NextResponse } from 'next/server'

/**
 * Preview Token Endpoint
 * Returns the private API token for preview mode access
 *
 * This endpoint should be protected in production or only accessible
 * from authenticated admin sessions
 */
export async function GET() {
  return NextResponse.json({
    preview: true,
    token: process.env.PRIVATE_CMS_TOKEN,
  })
}
