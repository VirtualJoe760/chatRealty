import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    cms: 'Payload CMS is online',
    timestamp: new Date().toISOString(),
  })
}
