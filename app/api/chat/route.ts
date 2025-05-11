import { NextResponse } from "next/server"
import { availableModels } from "@/config/models"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { messages, modelId } = await req.json()

    // Find the selected model configuration
    const modelConfig = availableModels.find((model) => model.id === modelId) || availableModels[0]

    // Format messages for the API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Prepare headers based on the provider
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Add the appropriate authorization header based on the provider
    let apiKey = ""
    if (modelConfig.provider === "xai") {
      // Use XAI_API_KEY for Grok models
      apiKey = process.env.XAI_API_KEY || ""
      if (!apiKey) {
        return NextResponse.json(
          { error: "XAI API key is not configured. Please add XAI_API_KEY in the environment variables." },
          { status: 500 },
        )
      }
      headers["Authorization"] = `Bearer ${apiKey}`
      console.log("Using XAI_API_KEY for Grok model")
    } else if (modelConfig.provider === "openai") {
      // Use OPENAI_API_KEY for OpenAI models
      apiKey = process.env.OPENAI_API_KEY || ""
      if (!apiKey) {
        return NextResponse.json(
          { error: "OpenAI API key is not configured. Please add OPENAI_API_KEY in the environment variables." },
          { status: 500 },
        )
      }
      headers["Authorization"] = `Bearer ${apiKey}`
      console.log("Using OPENAI_API_KEY for OpenAI model")
    }

    // Prepare the request body
    const requestBody = {
      model: modelConfig.modelId,
      messages: formattedMessages,
      temperature: modelConfig.temperature || 0.7,
      max_tokens: modelConfig.maxTokens || 2000,
      stream: true,
    }

    console.log(`Making request to ${modelConfig.apiEndpoint} for model ${modelConfig.modelId}`)

    try {
      // Make the request to the appropriate endpoint
      const response = await fetch(modelConfig.apiEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        let errorMessage = `API error: ${response.status}`

        try {
          const errorData = await response.json()
          console.error("API error:", errorData)

          // Extract more detailed error message if available
          if (errorData.error?.message) {
            errorMessage = `${errorMessage} - ${errorData.error.message}`
          } else if (errorData.error) {
            errorMessage = `${errorMessage} - ${typeof errorData.error === "string" ? errorData.error : JSON.stringify(errorData.error)}`
          }

          // Add helpful context for common errors
          if (response.status === 401) {
            if (modelConfig.provider === "openai") {
              errorMessage += ". Please check your OpenAI API key in the environment variables."
            } else if (modelConfig.provider === "xai") {
              errorMessage += ". Please check your XAI API key in the environment variables."
            }
          } else if (response.status === 404) {
            errorMessage += `. The model "${modelConfig.modelId}" may not be available or the endpoint is incorrect.`
          } else if (response.status === 429) {
            errorMessage += ". You've exceeded your rate limit or quota. Please check your usage and billing."
          }
        } catch (e) {
          // If we can't parse the error response, just use the status code
          console.error("Error parsing error response:", e)
        }

        return NextResponse.json({ error: errorMessage }, { status: response.status })
      }

      // Return the stream directly
      return new Response(response.body)
    } catch (error: any) {
      console.error("Error making API request:", error)
      return NextResponse.json(
        {
          error: `Error making API request: ${error.message || "Unknown error"}`,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      {
        error: `An error occurred during your request: ${error.message || "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
