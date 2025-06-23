import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client with service role (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function uploadFileAdmin(file: File, path: string) {
  const { data, error } = await supabaseAdmin.storage.from("vaults").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    console.error("Upload error:", error)
    throw error
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from("vaults").getPublicUrl(path)

  return publicUrl
}
