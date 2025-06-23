"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { AuthDialog } from "@/components/auth-dialog"
import { AuthDialog } from "./auth-dialog"
import { Vault, Users, Shield, Heart, Camera, MessageCircle, MapPin, Tag, Activity, Menu, X } from "lucide-react"

export function HomePage() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode)
    setAuthDialogOpen(true)
  }

  const features = [
    {
      icon: <Vault className="h-8 w-8 text-blue-600" />,
      title: "Family Vaults",
      description: "Create secure, private spaces for your family memories with customizable themes and covers.",
    },
    {
      icon: <Camera className="h-8 w-8 text-green-600" />,
      title: "Multi-Media Support",
      description: "Upload photos, videos, audio recordings, and write text memories all in one place.",
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Collaborative Sharing",
      description: "Invite family members with different permission levels and collaborate on preserving memories.",
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "Democratic Moderation",
      description: "Community voting system for content moderation ensures family-appropriate content.",
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-orange-600" />,
      title: "Interactive Comments",
      description: "Add comments to memories, share stories, and engage with family content.",
    },
    {
      icon: <MapPin className="h-8 w-8 text-teal-600" />,
      title: "Location Memories",
      description: "Tag memories with locations and view them on an interactive map.",
    },
    {
      icon: <Tag className="h-8 w-8 text-pink-600" />,
      title: "Smart Tagging",
      description: "Organize memories with tags and mentions for easy discovery and filtering.",
    },
    {
      icon: <Activity className="h-8 w-8 text-indigo-600" />,
      title: "Activity Feed",
      description: "Stay updated with a chronological feed of all family vault activities.",
    },
  ]

  const faqs = [
    {
      question: "How secure are my family memories?",
      answer:
        "Your memories are stored securely with end-to-end encryption. Only invited family members can access your vault, and you control all permissions.",
    },
    {
      question: "Can I control who sees what content?",
      answer:
        "Yes! You can set different permission levels for family members, make notes private, and use the democratic voting system for content moderation.",
    },
    {
      question: "What file types are supported?",
      answer:
        "We support all major image formats (JPEG, PNG, GIF, WebP), audio files (MP3, WAV, OGG), and video files (MP4, WebM, OGG) up to 50MB each.",
    },
    {
      question: "How does the voting system work?",
      answer:
        "When someone wants to delete content they didn't upload, other family members can vote. If the majority agrees, the content is moved to trash.",
    },
    {
      question: "Can I use this on mobile devices?",
      answer: "Legacy is fully responsive and works great on phones, tablets, and desktop computers.",
    },
    {
      question: "Is there a limit to how many memories I can store?",
      answer:
        "Each vault has generous storage limits, and you can create multiple vaults for different family branches or occasions.",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Vault className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Legacy</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
                How it Works
              </a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">
                About
              </a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">
                FAQ
              </a>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => openAuth("login")}>
                  Login
                </Button>
                <Button onClick={() => openAuth("register")}>Sign Up</Button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-white py-4">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
                  How it Works
                </a>
                <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">
                  About
                </a>
                <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">
                  FAQ
                </a>
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Button variant="ghost" onClick={() => openAuth("login")} className="justify-start">
                    Login
                  </Button>
                  <Button onClick={() => openAuth("register")} className="justify-start">
                    Sign Up
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Preserve Your Family
              <span className="text-blue-600 block">Legacy Forever</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create secure family vaults to store, share, and preserve your most precious memories. From photos and
              videos to audio recordings and stories - keep your family history alive for generations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => openAuth("register")} className="text-lg px-8 py-3">
                Start Your Family Vault
              </Button>
              <Button size="lg" variant="outline" onClick={() => openAuth("login")} className="text-lg px-8 py-3">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features for Families</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create, organize, and share your family memories in one secure platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How Legacy Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started with your family vault in just a few simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your Vault</h3>
              <p className="text-gray-600">
                Sign up and create your first family vault. Customize it with a name, description, and theme.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Invite Family</h3>
              <p className="text-gray-600">
                Share your vault's invite code or link with family members. Set their permissions and roles.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Share Memories</h3>
              <p className="text-gray-600">
                Upload photos, videos, audio, and write stories. Tag, comment, and organize your family history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Built for Families, By Families</h2>
              <p className="text-lg text-gray-600 mb-6">
                Legacy was created with the understanding that family memories are irreplaceable. We've built a platform
                that prioritizes security, collaboration, and ease of use - because your family's story deserves the
                best.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="text-gray-700">Designed with love for families</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Bank-level security and privacy</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-gray-700">Collaborative and democratic</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 text-center">
              <Vault className="h-24 w-24 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Family Legacy</h3>
              <p className="text-gray-600">
                Preserve memories, share stories, and keep your family connected across generations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about Legacy</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-left">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your Family Legacy?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of families who are already preserving their memories with Legacy.
          </p>
          <Button size="lg" variant="secondary" onClick={() => openAuth("register")} className="text-lg px-8 py-3">
            Create Your Vault Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Vault className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold">Legacy</span>
              </div>
              <p className="text-gray-400">
                Preserving family memories for generations. Secure, collaborative, and built with love.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Legacy. All rights reserved. Made with ❤️ for families.</p>
          </div>
        </div>
      </footer>

      {/* Auth Dialog */}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} mode={authMode} />
    </div>
  )
}
