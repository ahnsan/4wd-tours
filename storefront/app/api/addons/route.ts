/**
 * API Route - Get Add-ons
 *
 * This API route handles server-side data fetching for add-ons display.
 * Following Next.js 14 App Router patterns for client/server separation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchAllAddOns } from '@/lib/data/addons-service'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const regionId = searchParams.get('region_id')

    console.log(`[Addons API] Fetching add-ons with region: ${regionId || 'default'}`)

    // Fetch add-ons from backend (region_id is optional, will use env default)
    const response = await fetchAllAddOns(regionId || undefined)

    console.log(`[Addons API] Successfully fetched ${response.count} add-ons from ${response.source}`)

    return NextResponse.json({
      success: true,
      ...response,
    })
  } catch (error) {
    console.error('[Addons API] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
