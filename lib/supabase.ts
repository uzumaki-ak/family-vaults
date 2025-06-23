import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadFile(file: File, path: string) {
  // First, try to upload the file
  const { data, error } = await supabase.storage.from("vaults").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    console.error("Upload error:", error)
    throw error
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("vaults").getPublicUrl(path)

  return publicUrl
}

export async function deleteFile(path: string) {
  const { error } = await supabase.storage.from("vaults").remove([path])

  if (error) throw error
}
