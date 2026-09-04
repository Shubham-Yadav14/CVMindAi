# CVMindAI

> **Build, edit, and perfect your resume with AI.**

CVMindAI is an AI-powered resume building platform that helps users create professional, ATS-friendly resumes using modern templates and an interactive AI assistant. Users can build resumes from scratch, edit LaTeX directly, or simply describe changes in natural language and let the AI update the resume for them.

---

## ✨ Features

### 🔐 Authentication

* OAuth-based authentication
* Email & password authentication
* Email verification for new accounts
* Resend verification email functionality
* Forgot password functionality
* Secure password reset through email
* Protected user sessions

### 📄 Resume Builder

* Create multiple resumes
* Choose from a pool of professionally designed templates
* Template-based resume generation
* Live resume preview
* Direct LaTeX code editing
* Real-time resume updates
* Generate and download resumes as PDF

### 🤖 AI Resume Assistant

* Conversational AI-powered resume editing
* Edit your resume using natural language
* AI understands the requested changes
* Streams updated LaTeX code in real time
* Automatically applies AI-generated changes to the resume
* Improve and rewrite resume sections
* Modify formatting, structure, content, and styling using AI

For example:

> **"Make my experience section more concise and highlight my leadership experience."**

CVMindAI analyzes the existing resume and streams the updated LaTeX code directly into the editor.

### 📝 LaTeX Editor

* Full manual control over resume source code
* Edit LaTeX directly
* Live resume preview
* Combine manual and AI-powered editing
* Modify layouts, formatting, and content

### 📁 Resume Management

* Create and manage multiple resume projects
* Archive projects
* Soft delete projects
* Restore archived projects
* Permanently hard delete projects
* Manage all resumes from a centralized dashboard

### 📥 Export & Download

* Generate production-ready PDF resumes
* Download resumes directly
* Preserve professional formatting
* Export resumes whenever needed

---

## 🧠 How It Works

```text
        ┌──────────────────┐
        │     Sign Up      │
        │   OAuth / Email  │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │ Choose a Resume  │
        │     Template     │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────────────┐
        │     CVMindAI Editor      │
        │                          │
        │  ┌────────┐  ┌────────┐  │
        │  │ AI Chat│  │ LaTeX  │  │
        │  │ Editor │  │ Editor │  │
        │  └────┬───┘  └───┬────┘  │
        │       │           │       │
        │       └─────┬─────┘       │
        │             ▼             │
        │       Live Preview        │
        └─────────────┬────────────┘
                      │
                      ▼
             ┌────────────────┐
             │  Export as PDF │
             └────────────────┘
```

### 1. Authenticate

Create an account using OAuth or email/password authentication.

Users registering with email and password receive a verification email before accessing protected functionality.

### 2. Choose a Template

Select a resume template from the available template library.

### 3. Build Your Resume

After selecting a template, you'll enter the CVMindAI editor where you can:

* Edit the LaTeX source manually
* Ask the AI assistant to make changes
* Preview your resume in real time

### 4. Edit With AI

Describe what you want to change using natural language.

For example:

> "Add a stronger summary focused on software engineering."

CVMindAI processes the request and **streams the updated LaTeX code**, which is automatically applied to the resume and reflected in the live preview.

### 5. Export

Once your resume is ready, generate and download the final PDF.

---

## 🤖 AI Editing Flow

CVMindAI is built around a conversational resume editing experience.

```text
User Request
     │
     ▼
AI Assistant
     │
     ▼
Analyze Existing LaTeX
     │
     ▼
Generate Updated LaTeX
     │
     ▼
Stream Response
     │
     ▼
Update Editor
     │
     ▼
Render Resume
     │
     ▼
Live Preview
```

Users don't need to understand LaTeX to make advanced changes to their resume.

---

## 🗂️ Project Lifecycle

CVMindAI provides flexible project management for resume projects.

```text
                ┌─────────────┐
                │   Active    │
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │   Archived  │
                └──────┬──────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
          Restore            Delete
                                │
                                ▼
                         Permanent Delete
```

Projects can be archived when they're no longer actively being edited, soft-deleted when removed from the main workspace, or permanently deleted when no longer needed.

---

## 🔑 Authentication Flows

### OAuth

```text
User
 │
 ▼
OAuth Provider
 │
 ▼
Authentication
 │
 ▼
CVMindAI
 │
 ▼
Dashboard
```

### Email & Password

```text
Sign Up
   │
   ▼
Verification Email
   │
   ▼
Verify Account
   │
   ▼
Login
   │
   ▼
Dashboard
```

### Forgot Password

```text
Forgot Password
      │
      ▼
Enter Email
      │
      ▼
Password Reset Email
      │
      ▼
Secure Reset Link
      │
      ▼
Set New Password
      │
      ▼
Login
```

---

## 🛠️ Tech Stack

> Update this section with the exact technologies used in your implementation.

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Responsive UI

### Backend

* Next.js API Routes / Server-side APIs
* TypeScript
* Authentication & authorization
* REST APIs

### Database

* MongoDB
* Mongoose

### AI

* AI-powered conversational editing
* Streaming AI responses
* LaTeX-aware resume modification

### Resume Generation

* LaTeX
* PDF compilation
* Live preview

### Authentication & Communication

* OAuth
* Email/password authentication
* SMTP
* Email verification
* Password reset emails

---

## 📁 Core Concepts

| Feature                | Description                            |
| ---------------------- | -------------------------------------- |
| **Templates**          | Professionally designed resume layouts |
| **Projects**           | Individual resume workspaces           |
| **AI Assistant**       | Conversational resume editing          |
| **LaTeX Editor**       | Direct source-code editing             |
| **Live Preview**       | Real-time resume visualization         |
| **PDF Export**         | Download production-ready resumes      |
| **Archive**            | Store inactive projects                |
| **Soft Delete**        | Temporarily remove projects            |
| **Hard Delete**        | Permanently remove projects            |
| **OAuth**              | Social authentication                  |
| **Email Verification** | Verify email-based accounts            |
| **Password Reset**     | Recover forgotten passwords            |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm / pnpm / yarn
* MongoDB
* LaTeX distribution/compiler
* OAuth credentials
* SMTP credentials
* AI API credentials

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd cvmindai
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env.local
```

Configure the required environment variables:

```env
# Database
MONGODB_URI=

# Authentication
AUTH_SECRET=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# SMTP
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=

# AI
AI_API_KEY=

# Application
NEXT_PUBLIC_APP_URL=
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🔒 Security

CVMindAI implements security-focused authentication and project-management mechanisms, including:

* Email verification
* Secure password reset flow
* OAuth authentication
* Protected application routes
* Expiring verification and reset tokens
* Soft deletion before permanent deletion
* Server-side authentication checks
* Environment-based secret management

> **Never commit `.env`, API keys, OAuth secrets, SMTP passwords, or other credentials to the repository.**

---

## 🧩 Architecture

At a high level, CVMindAI consists of four major layers:

```text
┌───────────────────────────────────────────┐
│                  Client                   │
│                                           │
│  Dashboard • Templates • AI Editor        │
│  LaTeX Editor • Preview • Project Manager │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│                  API                      │
│                                           │
│ Authentication • Projects • AI • PDF      │
└───────────────┬───────────────┬───────────┘
                │               │
                ▼               ▼
        ┌──────────────┐  ┌──────────────┐
        │   MongoDB    │  │   AI Model   │
        └──────────────┘  └──────────────┘
                │
                ▼
        ┌──────────────┐
        │ LaTeX / PDF  │
        │  Generation  │
        └──────────────┘
```

---

## 📌 Roadmap

* [ ] More resume templates
* [ ] AI-powered ATS scoring
* [ ] Job-description-based resume optimization
* [ ] AI cover letter generation
* [ ] Resume version comparison
* [ ] Resume analytics
* [ ] Custom template builder
* [ ] Resume sharing via public links
* [ ] Multiple export formats
* [ ] More OAuth providers
* [ ] AI-powered grammar and language optimization
* [ ] Job-specific resume recommendations

---

## 🎯 Vision

CVMindAI aims to make professional resume creation as simple as having a conversation.

Instead of struggling with formatting, wording, and LaTeX, users can focus on their career story while CVMindAI handles the complexity behind the scenes.

> **Your experience. Your career. Your resume — powered by AI.**

---

## 🤝 Contributing

Contributions, ideas, and feedback are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit your changes
5. Push the branch
6. Open a Pull Request

---

## 📄 License

This project is currently private / proprietary unless otherwise specified.

---

## ⭐ CVMindAI

**Build better resumes. Edit with AI. Get career-ready.**
