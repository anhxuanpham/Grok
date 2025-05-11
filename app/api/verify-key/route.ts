import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { provider, apiKey } = await req.json()

    let endpoint = ""
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }
    const body: any = {}

    // Set up test request based on provider
    if (provider === "openai") {
      endpoint = "https://api.yescale.io/v1/models"
      // No body needed for models endpoint
    } else if (provider === "xai") {
      endpoint = "https://api.yescale.io/v1/models"
      // No body needed for models endpoint
    } else {
      return NextResponse.json({ valid: false, error: "Unsupported provider" }, { status: 400 })
    }

    // Make a simple request to verify the API key
    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    })

    if (response.ok) {
      return NextResponse.json({ valid: true })
    } else {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({
        valid: false,
        error: errorData.error?.message || `API error: ${response.status}`,
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        error: error.message || "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
