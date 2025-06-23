import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateCaption(imageUrl: string, mediaType: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    let prompt = ""
    if (mediaType === "IMAGE") {
      prompt =
        "Generate a brief, meaningful caption for this image that captures the emotion and context. Keep it under 100 characters."
    } else if (mediaType === "AUDIO") {
      prompt =
        "Generate a brief caption for this audio file. Describe what type of audio it might be (music, voice recording, etc.)."
    } else if (mediaType === "VIDEO") {
      prompt = "Generate a brief caption for this video file. Describe what the video might contain."
    }

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: await fetch(imageUrl)
            .then((res) => res.arrayBuffer())
            .then((buffer) => Buffer.from(buffer).toString("base64")),
          mimeType: mediaType === "IMAGE" ? "image/jpeg" : mediaType === "AUDIO" ? "audio/mpeg" : "video/mp4",
        },
      },
    ])

    return result.response.text()
  } catch (error) {
    console.error("Error generating caption:", error)
    return null
  }
}
