# Emma English Coach

**Emma English Coach** is an AI-powered English learning application designed primarily for Chinese-speaking learners. It combines structured courses, speaking practice, pronunciation analysis, vocabulary review, real-world conversation training, IELTS speaking practice, learning analytics, and an always-available AI learning assistant named **Emma**.

The project is built around a simple idea: English learning should be more than reading lessons or chatting with a generic chatbot. Learners should have a clear path, frequent opportunities to speak, immediate feedback, visible progress, and an AI coach that understands what they are currently learning.

Emma English Coach brings those pieces together in one responsive web application that can be used on both desktop and mobile devices.

---

## Table of Contents

- [What the Project Does](#what-the-project-does)
- [Core Learning Experience](#core-learning-experience)
- [Course System](#course-system)
- [Practice Center](#practice-center)
- [Emma AI Learning Coach](#emma-ai-learning-coach)
- [AI Capabilities](#ai-capabilities)
- [Learning Data and Progress Tracking](#learning-data-and-progress-tracking)
- [Cross-Device Sync](#cross-device-sync)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Available Scripts](#available-scripts)
- [PWA and Mobile Usage](#pwa-and-mobile-usage)
- [Deployment](#deployment)
- [Security Notes](#security-notes)
- [Quality Assurance](#quality-assurance)
- [Current Project Status](#current-project-status)
- [Roadmap Priorities](#roadmap-priorities)

---

## What the Project Does

Emma English Coach is a full English-learning system rather than a single-purpose AI chat interface.

It currently includes:

- A structured English course path with progressive module unlocking
- Phonics and pronunciation foundations
- Intonation, rhythm, stress, and natural speech training
- Mindset and confidence-oriented lessons for learners who struggle to speak
- Guided scene demonstrations and role-play exercises
- 100 real-world conversation scenarios
- Fluency-focused conversation training
- Pronunciation recording and AI scoring
- Guided Shadowing practice for rhythm, stress, pausing, and connected speech
- Grammar correction and sentence improvement
- Dictation and listening comprehension exercises
- Vocabulary collection, review, and sentence practice
- Programming and technical English assistance
- Image-based English learning using AI vision
- IELTS Speaking Part 1, Part 2, and Part 3 practice
- Personalized progress tracking and learning analytics
- An AI learning coach named Emma
- Cross-device learning-state synchronization
- Progressive Web App support for mobile-friendly use

The interface is designed for Chinese-speaking learners, with explanations and coaching primarily delivered in Chinese while keeping English examples and practice content at the center of the learning experience.

---

## Core Learning Experience

The application is organized around five main areas:

### 1. Dashboard

The dashboard acts as the learner's home base. It summarizes learning activity, course progress, streaks, vocabulary review, recommendations, and current learning status.

### 2. Courses

The course center provides a structured progression from pronunciation fundamentals to real-world speaking and fluency. Modules unlock as learners complete prerequisite material.

### 3. Practice

The practice center gives learners a place to actively use English through recording, grammar correction, listening, dictation, IELTS practice, technical English, and AI-assisted exercises.

### 4. Vocabulary

The vocabulary system stores words and collocations encountered during lessons and practice sessions, supports review, and includes output challenges that turn saved vocabulary into spoken sentences.

### 5. Profile and Learning Analytics

The profile area tracks progress, pronunciation performance, grammar weaknesses, learning activity, and other useful signals that help learners understand where to focus next.

---

## Course System

The current structured curriculum contains more than 100 lessons and 100 additional real-world scenarios.

| Module | Content | Current Size |
| --- | --- | ---: |
| Phonics | Sound-letter relationships, decoding, pronunciation foundations | 22 lessons |
| Intonation | Stress, rhythm, intonation, and natural speech patterns | 11 lessons |
| Mindset | Confidence, speaking habits, and cognitive barriers | 30 lessons |
| Scene Demonstration | Guided situational speaking and model dialogues | 21 lessons |
| Real-World Scenes | AI role-play across practical everyday situations | 100 scenarios |
| Fluency | Conversation skills, discourse strategies, and natural communication | 20 lessons |

### Progressive Unlocking

The learning path uses prerequisite-based unlocking so learners are encouraged to build skills in a logical order.

The current progression is approximately:

```text
Phonics
   ↓
Intonation
   ↓
Mindset
   ↓
Scene Demonstration
   ↓
Real-World Scenes
   ↓
Fluency
```

Each module tracks completion and can use progress thresholds to unlock the next stage.

The goal is to keep learners focused while still allowing the application to grow into a more personalized learning system over time.

---

## Practice Center

The practice center extends the structured curriculum with targeted exercises.

Current practice modes include:

### Free Speaking and Recording

Learners can record their voice and receive AI-assisted pronunciation analysis and feedback.

### Shadowing Practice

Learners can listen to model sentences, imitate their rhythm and stress, record themselves, and reuse the pronunciation-analysis flow for targeted feedback.

### Grammar Correction

Users can submit English sentences and receive corrections, explanations, and improved alternatives. Grammar mistakes can also contribute to the learner's weakness profile.

### Dictation

Learners listen to English sentences, type what they hear, and receive word-level comparison and feedback.

### Listening Comprehension

AI can generate listening material and comprehension questions for targeted practice.

### Technical and Programming English

A dedicated practice mode helps learners understand technical vocabulary, programming terminology, and English expressions commonly used in software development.

### Snap-to-Learn English

Users can provide an image and use AI vision to learn vocabulary, expressions, and descriptions related to what appears in the image.

### IELTS Speaking

The application includes dedicated IELTS speaking practice for:

- Part 1: short personal questions and answers
- Part 2: Cue Card preparation and extended speaking
- Part 3: deeper discussion and opinion-based responses

AI analysis can provide estimated scoring dimensions and targeted improvement suggestions.

---

## Emma AI Learning Coach

**Emma** is the global AI learning assistant built into the application.

Emma is designed to function more like a personal learning coach than a generic chatbot. She can use the learner's current context, learning progress, weaknesses, and recent activity to provide more relevant guidance.

Emma can help with tasks such as:

- Recommending what to study next
- Explaining pronunciation or grammar questions
- Identifying learning weaknesses
- Creating a learning plan for the day
- Suggesting relevant lessons or practice modes
- Helping learners overcome speaking anxiety
- Reviewing learning progress
- Guiding users toward vocabulary, pronunciation, listening, grammar, IELTS, or conversation practice

Emma is available both as a dedicated teacher page and as a global assistant accessible from other parts of the application.

The application also includes learning-context and memory-related utilities so Emma can progressively become more aware of the learner's history and recent sessions.

---

## AI Capabilities

Emma English Coach uses multiple AI services because different models are better suited to different learning tasks.

### Google Gemini

Gemini is used for multimodal and analysis-heavy features such as:

- Pronunciation analysis
- Speech transcription
- Listening exercises
- Image understanding
- Vocabulary expansion
- IELTS speaking analysis
- Speech similarity and speaking feedback

### DeepSeek

DeepSeek is used primarily for language reasoning and conversational features such as:

- AI role-play conversations
- Fluency conversations
- Emma's learning-coach conversations
- Grammar correction
- Sentence evaluation
- Technical English explanations
- Conversation review and feedback
- Mindset-related exercise generation

### ElevenLabs

ElevenLabs provides text-to-speech output for high-quality spoken English examples and multilingual coaching audio.

The current application favors consistent high-quality TTS rather than falling back to inconsistent browser speech synthesis.

---

## Learning Data and Progress Tracking

Supabase is used for authentication, persistence, and learning data.

The application currently tracks data such as:

- User authentication and sessions
- Course progress
- Lesson completion
- Scores
- Audio recordings
- Conversation history
- Vocabulary items
- Check-in and streak activity
- Learning-state synchronization

Some lightweight learning data is also cached locally for responsiveness and offline-friendly behavior.

Examples include:

- Daily study time
- Recent grammar errors
- Word-of-the-day cache
- Milestone state
- Temporary learning preferences

---

## Cross-Device Sync

When the same account is used across desktop and mobile, the application can synchronize important learning state through Supabase.

Examples of synchronized data include:

- IELTS goals and recent speaking activity
- Daily learning minutes and targets
- Diagnostic profiles
- Grammar weakness history
- Combined weakness profiles
- Emma's recent memory-related learning state
- Milestone state
- Recent learning context
- Vocabulary output challenges and the last practice entry

Cross-device synchronization depends on the latest `learning_state` table being present in Supabase.

If the table has not been created yet, the application can still run, but locally stored learning state will not persist correctly across devices.

---

## Technology Stack

### Frontend

- **React 19**
- **Vite 8**
- **React Router**
- **Tailwind CSS v4**
- **Zustand**

### Backend and Data

- **Supabase Auth**
- **Supabase Database**
- **Supabase Storage**
- **Row Level Security**

### AI and Voice

- **Google Gemini API**
- **DeepSeek API**
- **ElevenLabs API**

### Testing and Tooling

- **ESLint**
- **Playwright**
- Custom smoke-test and service-health scripts

### App Platform

- Responsive web application
- Progressive Web App support
- Desktop and mobile layouts
- Cross-device learning synchronization

---

## Project Architecture

A simplified view of the repository:

```text
src/
├── assets/                 # Static application assets
├── components/             # Shared UI and learning components
│   ├── AudioRecorder.jsx   # Recording and pronunciation feedback
│   ├── EmmaBubble.jsx      # Global Emma assistant
│   └── ui/                 # Reusable UI primitives and status components
├── data/                   # Course and scenario datasets
│   ├── phonics.js
│   ├── intonation.js
│   ├── mindset.js
│   ├── demo.js
│   ├── scenes.js
│   └── fluency.js
├── hooks/                  # Shared React hooks
├── pages/
│   ├── Course/             # Course modules and lesson pages
│   ├── Practice/           # Speaking and practice center
│   ├── Dashboard.jsx
│   ├── TeacherChat.jsx
│   ├── Vocabulary.jsx
│   └── Profile.jsx
├── services/
│   ├── gemini.js           # Gemini integration
│   ├── deepseek.js         # DeepSeek integration
│   └── supabase.js         # Supabase client and data helpers
├── store/                  # Zustand state stores
├── utils/                  # TTS, learning sync, timers, memory, and helpers
├── main.jsx                # Application entry point
└── router.jsx              # Route configuration

scripts/
├── qa-smoke.mjs            # Core application smoke checks
├── e2e-smoke.mjs           # End-to-end smoke checks
├── voice-health.mjs        # Voice-service health checks
└── deploy-functions.sh     # Deployment helper

docs/
└── qa-checklist.md         # Manual release QA checklist

supabase-setup.sql           # Database, RLS, storage, and learning-state setup
```

---

## Getting Started

### Prerequisites

Before running the project locally, you should have:

- Node.js installed
- npm installed
- A Supabase project
- A Google Gemini API key
- A DeepSeek API key
- An ElevenLabs API key

### Installation

Clone the repository:

```bash
git clone https://github.com/gg476259862-jpg/AI-english-teacher.git
cd AI-english-teacher
```

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env.local
```

Add your service credentials to `.env.local`, then start the development server:

```bash
npm run dev
```

Vite will print the local development URL in the terminal.

---

## Environment Variables

The application currently expects the following environment variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_DEEPSEEK_API_KEY=
VITE_ELEVENLABS_API_KEY=
```

Do not commit real credentials to the repository.

Use `.env.example` as the template and keep real secrets inside `.env.local` or your deployment platform's environment-variable settings.

The provider variables in `.env.local` are used by the deployment and service-health scripts. Browser AI requests are sent through the Supabase Edge Function proxies described below.

---

## Supabase Setup

The repository includes:

```text
supabase-setup.sql
```

Open the **SQL Editor** in your Supabase project and execute the script.

The setup includes the project's core persistence layer, including structures for:

- User course progress
- Recording records
- Conversation records
- Vocabulary
- Check-in statistics
- Cross-device learning state
- Row Level Security policies
- Recording storage
- User-scoped storage access rules

The `learning_state` table is particularly important for synchronizing learning preferences and recent learning context between devices.

Whenever the schema evolves, run the latest version of `supabase-setup.sql` before testing cross-device behavior.

---

## Available Scripts

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run ESLint:

```bash
npm run lint
```

Run the core QA smoke checks:

```bash
npm run qa
```

Run end-to-end smoke checks:

```bash
npm run e2e
```

Check voice-related service health:

```bash
npm run voice:check
```

Preview the production build locally:

```bash
npm run preview
```

---

## PWA and Mobile Usage

Emma English Coach includes Progressive Web App support and is designed to work across desktop and mobile layouts.

On supported browsers, the application can be installed to the home screen and used more like a standalone app.

The current interface includes:

- Mobile bottom navigation
- Desktop sidebar navigation
- Responsive learning pages
- Mobile-friendly recording flows
- PWA icons and metadata
- Cross-device account-based learning-state synchronization

For quick mobile testing during development, a temporary tunnel can be used. For persistent access, deploy the application to a stable HTTPS domain.

---

## Deployment

For long-term hosting, suitable options include platforms such as:

- Vercel
- Cloudflare Pages
- Other static/frontend hosting platforms that support Vite applications

The deployed application must receive the same required environment variables used during local development.

The repository also includes Supabase Edge Functions under `supabase/functions/` for Gemini, DeepSeek, and ElevenLabs. Deploy these functions and configure the required provider keys as Supabase secrets before testing AI features in production. The helper script `scripts/deploy-functions.sh` can perform both steps after the local environment file is configured.

Before a production launch, validate the complete user journey on the deployed environment:

1. Register or sign in
2. Open the dashboard
3. Complete a lesson
4. Record audio
5. Receive AI analysis
6. Save vocabulary
7. Start an AI conversation
8. Complete a conversation review
9. Confirm progress persistence
10. Confirm mobile/desktop synchronization

---

## Security Notes

### Important

The current client routes Gemini, DeepSeek, and ElevenLabs requests through these Supabase Edge Functions:

- `supabase/functions/gemini-proxy`
- `supabase/functions/deepseek-proxy`
- `supabase/functions/tts-proxy`

These functions keep provider credentials out of browser requests. Production deployments must configure the required provider keys as Supabase secrets and verify that all three functions are deployed. Do not commit real credentials or expose production provider keys through frontend code.

You should also review:

- Supabase Row Level Security policies
- Storage access rules
- Authentication flows
- Rate limits
- API usage limits
- Error logging
- Abuse prevention
- Data-retention requirements

---

## Quality Assurance

The project includes automated and manual quality checks.

Recommended checks before deployment:

```bash
npm run build
npm run lint
npm run qa
npm run e2e
npm run voice:check
```

If ElevenLabs reports an exhausted quota, wait for the account quota to reset or add credits. That result is a provider-account limit rather than a frontend failure.

A manual release checklist is also available at:

```text
docs/qa-checklist.md
```

High-priority user flows should always be tested on both desktop and mobile, especially microphone permissions, recording, AI analysis, authentication, persistence, and cross-device sync.

---

## Current Project Status

Emma English Coach is currently best suited for:

- Personal use
- Local development
- Controlled testing
- Small private beta groups

The core learning experience is already substantial, with structured courses, 100 real-world scenarios, AI-powered speaking practice, vocabulary management, progress analytics, Emma coaching, Supabase persistence, and PWA support.

However, additional production hardening is recommended before a broad public release.

---

## Roadmap Priorities

The most valuable next steps include:

### 1. Harden AI Proxy Operations

Add production monitoring, rate limits, and structured error logs around the existing Gemini, DeepSeek, and ElevenLabs Edge Function proxies.

### 2. Improve Personalized Daily Learning Plans

Turn the dashboard into a clearer daily learning workflow that automatically combines pronunciation, vocabulary, speaking, and review based on the learner's current weaknesses.

### 3. Expand Fluency Training

Continue adding advanced conversational strategies such as hedging, repair strategies, vague language, discourse markers, and natural conversational fillers.

### 4. Improve Vocabulary Training

Add stronger collocation, phrase, recall, and context-based review modes instead of treating vocabulary as isolated words.

### 5. Deepen Emma's Long-Term Memory

Allow Emma to retain more useful learning context across sessions so recommendations become increasingly personalized.

### 6. Improve IELTS Goal Personalization

Allow learners to set a target band score and adapt IELTS practice difficulty, feedback, and recommendations around that goal.

### 7. Expand Automated Testing

Increase coverage for critical services, authentication, learning-state persistence, AI-response parsing, and user flows.

---

## Project Philosophy

Emma English Coach is built around four principles:

**Speak early.** Learners should start producing English as soon as possible instead of waiting until they feel "ready."

**Get immediate feedback.** Pronunciation, grammar, vocabulary, and conversation practice become more useful when feedback arrives while the attempt is still fresh.

**Follow a path.** A structured learning sequence reduces decision fatigue and helps learners build skills in the right order.

**Make AI context-aware.** An AI coach becomes significantly more useful when it understands the learner's current lesson, recent mistakes, progress, and goals.

The long-term goal is to make Emma feel less like a chatbot added to an English-learning website and more like a persistent personal English coach that connects every part of the learning experience.
