# MFP GYM Management System

Values-driven gym management platform built with modern web technologies.

## 🚀 Technology Stack

### Frontend
-   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **Icons**: [Lucide React](https://lucide.dev/)

### Backend
-   **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
-   **Authentication**: Custom PIN-based Auth (hashed with `bcryptjs`) linked to Supabase
-   **Server Actions**: Next.js Server Actions for API logic
-   **ORM/Query Builder**: Supabase JS Client

### Deployment
-   **Platform**: [Vercel](https://vercel.com/)
-   **Edge Functions**: Next.js Edge Runtime

## ✨ Key Features

### 1. Robust Authentication
-   **Mobile & PIN Login**: Secure, passwordless login using mobile number and a 4-digit PIN.
-   **Role-Based Access**: Distinct portals for **Members** and **Admins**.
-   **Secure Sessions**: encrypted HTTP-only cookies using `jose`.

### 2. Admin Dashboard
-   **Live Activity Feed**: Real-time tracking of gym check-ins and check-outs.
-   **Member Management**: Create, edit, and manage member profiles directly.
-   **Financial Stats**: Track revenue, recent payments, and membership expiries.
-   **Trainers Management**: Add and manage trainer profiles.

### 3. Smart Attendance System
-   **NFC/Tap Ready**: Dedicated `/attendance/tap` page for quick check-ins via NFC tags or kiosks.
-   **Auto-Checkout**: Automatically closes sessions that have been active for more than 3 hours.
-   **Daily Logs**: Comprehensive daily logs of all member movements.

### 4. Member Portal
-   **Personal Dashboard**: Members can view their plan status and gym activity.
-   **Diet AI**: AI-powered diet recommendations (integrated via OpenRouter).

### 5. Utilities
-   **Bulk Upload**: Import members from Excel sheets.
-   **Responsive Design**: Fully mobile-optimized interface.

## 🛠️ Setup & Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/legitnieraj1/MFP-GYM.git
    cd MFP-GYM
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env.local` file with:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    SESSION_SECRET=your_complex_secret
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 📂 Project Structure

-   `/src/app`: App Router pages and layouts.
-   `/src/app/actions`: Server actions for backend logic (attendance, admin, auth).
-   `/src/components`: Reusable UI components.
-   `/src/lib`: Utilities (supabase client, auth helpers, session management).
-   `/scripts`: Database maintenance scripts.
