# 📸 Legacy – Family Vault for Memories

> A secure, collaborative, and beautifully designed digital vault for families to preserve their cherished memories across generations.

![Banner](public/banner.png)

---

## 🧠 Overview

**Legacy – Family Vault** is a full-stack web application designed for families to **store, organize, and share precious media like photos, videos, and audio memories** in a shared digital vault.

Built using **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Supabase**, **Prisma**, and **shadcn/ui**, the app combines smooth UI with robust backend features. It includes essential features like shared vault access and safe deletion, while also supporting advanced add-ons like memory timelines, media verification flows, and legacy notes.

---

## 🚀 Live Demo

🔗 [Coming Soon](https://github.com/uzumaki-ak/family-vault)

---

## 🧰 Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Supabase (PostgreSQL), Prisma ORM
- **Auth**: Supabase Auth + JWT
- **AI**: Google Gemini 1.5 Flash (Free Tier API)


---

## ✨ Core Features (Must-Have)

- 👨‍👩‍👧‍👦 **Shared Vault Access**  
  Users can create or join a shared family vault with multiple contributors.

- 📥 **Upload & View Memories**  
  Upload images (and optionally videos/audio). All vault members can view once approved.

- 🗑️ **Safe Delete Mechanism**  
  Members can delete their uploads; admins can manage vault-wide deletion.

- 🎨 **Vault Personalization**  
  Give each vault a unique name, theme color, or cover photo.

---

## 🌟 Bonus Features (Extra Points)

- 🗳️ **Voting-Based Deletion**  
  Majority vote required before a memory is permanently deleted.

- 🕵️ **Media Verification Flow**  
  Uploaded media goes into a “pending” state for admin review before public visibility.

- 🎥 **Audio & Video Support**  
  Uploads aren’t just photos — voice recordings and videos are supported too.

- 🧭 **Memory Timeline**  
  Organize memories chronologically to visually scroll through family history.

- 💬 **Legacy Notes**  
  Leave meaningful written messages or life stories for future generations.

---

## ⚙️ Settings Panel

Inside the `/settings` route:
- Manage vault name, cover image
- Control vault theme color
- Invite/Remove family members
- Set deletion policy (voting or direct delete)
- Enable/disable AI features (e.g., Gemini auto-labeling)

---

## 🧠 AI Integration (Gemini Flash 1.5)

- Used to auto-label uploaded memories with suggested tags
- Helps generate prompts for legacy notes (optional)
- Example: “Generate a title and tags for this audio recording of Grandpa’s story”

🔐 Add your Gemini API key in `.env`:

git clone https://github.com/uzumaki-ak/family-vaults.git
cd family-vault

# database setup
- npx prisma db push
- npx prisma generate


# i pushed it toady but here is when i started the project : 

