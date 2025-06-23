import { type NextRequest, NextResponse } from "next/server"
import { uploadFileAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate unique filename
    const fileName = `${type || "file"}-${Date.now()}-${file.name}`
    const filePath = `uploads/${fileName}`

    // Upload to Supabase Storage
    const fileUrl = await uploadFileAdmin(file, filePath)

    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
