import { HomePage } from "@/components/home-page"

export default async function RootPage() {
  // Remove database check for home page to avoid connection errors
  // Users will be redirected after successful login
  return <HomePage />
}
