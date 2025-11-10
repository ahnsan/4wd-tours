/**
 * API Route - Get Category Steps for Add-ons Flow
 *
 * This API route handles server-side data fetching for the add-ons flow page.
 * Following Next.js 14 App Router patterns for client/server separation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCategoryStepsV2 } from '@/lib/data/addon-flow-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tourHandle = searchParams.get('tour')

    if (!tourHandle) {
      return NextResponse.json({
        success: false,
        error: 'Tour handle is required',
      }, { status: 400 })
    }

    console.log(`[Category Steps API] Fetching for tour: ${tourHandle}`)

    const steps = await getCategoryStepsV2(tourHandle)

    const totalAddons = steps.reduce((sum, step) => sum + step.addons.length, 0)
    console.log(`[Category Steps API] Returning ${steps.length} steps with ${totalAddons} total addons`)

    return NextResponse.json({
      success: true,
      steps,
      meta: {
        stepCount: steps.length,
        addonCount: totalAddons,
      },
    })
  } catch (error) {
    console.error('[Category Steps API] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
