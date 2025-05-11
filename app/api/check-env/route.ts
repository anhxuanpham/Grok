import { NextResponse } from "next/server"

export async function GET() {
  // Check which environment variables are available
  const envVariables = {
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    XAI_API_KEY: !!process.env.XAI_API_KEY,
  }

  // Log the environment variables status (for debugging)
  console.log("Environment variables status:", envVariables)

  return NextResponse.json(envVariables)
}
