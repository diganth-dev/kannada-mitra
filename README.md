# Kannada Mitra 💛❤️
### *Learn Kannada. Connect with Karnataka.*

> **Built for the Kannada Digital Innovation Hackathon 2026**
> A beginner-friendly web application designed to help people learn practical, everyday Kannada through their own mother tongue, complete with user authentication, personalized language onboarding, and Cloud Firestore sync.

---

## 🌟 1. Project Overview

Moving to Karnataka or wanting to connect with its rich culture often begins with understanding everyday spoken Kannada. However, most language apps teach Kannada through English, ignoring the natural linguistic bridges shared with other Indian languages (such as Dravidian sisters Telugu, Tamil, and Malayalam, or historical neighbors Marathi, Hindi, and regional sister language Tulu).

**Kannada Mitra** bridges this gap:
* A Telugu speaker learns *"ಧನ್ಯವಾದ"* by seeing *"నమస్కారం / ధన్యవాదాలు"*.
* A Tamil speaker immediately connects *"ಬೇಕು"* with *"வேண்டும்"*.
* A Hindi speaker connects *"ಶುಭೋದಯ"* with *"सुप्रभात"*.
* A Tulu speaker connects *"ಬನ್ನಿ"* with *"ಬಲೆ"*.

---

## 🎯 2. Core User Journey & Application Flow

1. **Welcome & Authentication (Screen 1 & 2)**:
   * Karnataka-inspired aesthetics (Yellow `#FFD100` and Red `#D32F2F`), greeting (*"ನಮಸ್ಕಾರ!"*), live interactive pronunciation preview.
   * Secure **Email & Password Sign-Up**, **Email & Password Login**, and **Google Sign-In** powered by Firebase Authentication.
   * Real-time client-side form validation, loading spinners, and clear error messaging.
2. **First-Login Language Onboarding (Screen 3)**:
   * **Step 1 — Your Language**: Choose the language you speak from 9 supported options (**Kannada, Hindi, English, Telugu, Tamil, Malayalam, Marathi, Bengali, Urdu**).
   * **Step 2 — Language to Learn**: Independently choose target language (**Kannada, Hindi, English, Telugu, Tamil, Malayalam, Marathi, Bengali**).
   * Summary card showing selected learning bridge with compatibility indicator, Back/Continue buttons, and Finish Setup.
3. **Personalized Kannada Learning Dashboard (Screen 4)**:
   * Prominent personalized indicator: e.g. *"Learning Kannada through Hindi (ಕನ್ನಡ through हिन्दी)"*.
   * Interactive flashcards displaying authentic Kannada script, Romanized phonetic pronunciation, English meaning, mother tongue equivalent, contextual example sentences, browser speech audio synthesis, and *"Mark as Learned"*.
   * Clear limitation messaging and supported alternatives if an unsupported combination is selected.
4. **Interactive Quiz (Screen 5)**:
   * 5-question dynamic quiz with 4 multiple-choice answers, immediate correct/incorrect visual & icon feedback, detailed explanations, and score tracking.
5. **My Progress (Screen 6)**:
   * Track total mastered words, category-by-category breakdown, completed quizzes, best score, and mastered word review list.
6. **User Isolation & Profile Settings**:
   * Header profile menu with user email, quick bridge switcher, "Change Language Preferences" option, and "Sign Out" button.
   * Completely isolated per-user learning data stored in Cloud Firestore (`/users/{uid}`) and user-scoped local storage.

---

## 🚀 3. Quick Start & Local Execution

### Prerequisites
* Node.js (v18+)
* npm (v9+)

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open in browser
# http://localhost:5173
```

### Build & Testing

```bash
# Run test suite (auth validation, onboarding flow, multi-user isolation, quiz generation, storage)
npm test

# Run ESLint check
npm run lint

# Build production bundle
npm run build
```

---

## 🔥 4. Firebase Configuration & Cloud Firestore Setup

Kannada Mitra integrates directly with **Firebase Authentication** and **Cloud Firestore**.

### Step 1: Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/) and create a new project (e.g. `kannada-mitra`).
2. Navigate to **Authentication > Sign-in method**:
   * Enable **Email/Password**.
   * Enable **Google**.
3. Navigate to **Firestore Database** and click **Create database** in Production or Test mode.

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Fill in your Web App credentials from **Project Settings > General > Your apps > Web app**:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 3: Deploy Firestore Security Rules
Deploy the rules from `firestore.rules` using the Firebase CLI or paste them into the Firebase Console Rules tab:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /{subcollection=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    match /{document=**} {
      allow read, write: false;
    }
  }
}
```

---

## 🛠️ 5. Technology Stack

* **React 19** & **Vite 8**
* **Firebase 12** (Firebase Authentication & Cloud Firestore)
* **Tailwind CSS v4** with Karnataka Flag Yellow `#FFD100` and Red `#D32F2F`
* **Lucide React** for accessible iconography
* **Web Speech Synthesis API** for native browser Kannada pronunciation
* **Node.js test runner (`node:test`)** with 16 automated tests covering auth, onboarding, isolation, quiz, and storage integrity
