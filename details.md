# TeleQuiz Project Documentation

## 1. Introduction
TeleQuiz is a comprehensive, full-stack web application designed to streamline the creation, management, and deployment of quiz polls to Telegram channels. It leverages AI for content generation and provides robust tools for organizing and exporting quiz data.

## 2. Core Features

### 2.1. AI Quiz Generation & Workflow
- **AI-Powered Creation**: TeleQuiz utilizes **Google's Gemini Pro** model through the `@google/genai` SDK. Users can provide raw text, and the AI parses it into structured JSON matching the `QuizQuestion` schema.
- **Context Preservation**: The system remembers the last input text to allow for "Generate More" functionality without re-pasting content.
- **Manual Editor**: A robust interface to fine-tune AI-generated questions. Features include real-time validation of correct option indices and mandatory explanation fields.
- **Image Integration**:
  - **URL-based**: Direct linking to cloud-hosted images.
  - **Storage-based**: Integration with Supabase Storage or external hosting providers.
- **Dynamic Bulk Operations**:
  - **Batch Topic Assignment**: Updates the `topic` field across selected PostgreSQL records in a single transaction or batch.
  - **Telegram Queueing**: Parallelized sending logic with rate-limit awareness to prevent bot throttling.
  - **Sync-to-Draft**: Instant status update from `pending` to `draft`, triggering real-time UI updates via listener hooks.

### 2.2. Draft & Poll Management
- **Drafts Page**: A dedicated workspace for questions not yet ready for publication.
  - **Persistence**: Drafts are stored in PostgreSQL (Supabase), ensuring they persist across sessions.
  - **Workflow**: Drafts can be sent directly to Telegram. Upon successful sending, they are moved to the "Sent Polls" list.
- **Sent Polls Page**: A historical archive of all polls successfully deployed to Telegram channels.
- **Real-time Sync**: The application uses Supabase Realtime to provide real-time updates across all devices.

### 2.3. Role-Based Access Control (RBAC) & Admin Tools
- **Hierarchical Access**:
  - **Admins**: Have full system visibility, including global statistics, user directory management, and feature toggle authority.
  - **Regular Users**: Access is strictly limited to authorized "Pages" (Features).
- **Admin Dashboard**:
  - **User Management**: Admins can create, delete, and modify user permissions.
- **Admin Stats**: Real-time aggregated data showing total users, total polls sent, and system activity logs.
- **Feature Directory**: A central hub where admins can visualize and test new integrations before rolling them out to users.

### 2.4. Telegram & Bot Execution Logic
- **Secured Credentials**: Bot tokens and Channel IDs are stored in user-specific Supabase tables, never exposed in client-side code repositories.
- **Poll Construction**: The application converts internal question objects into Telegram `sendPoll` or `sendPhoto` + `sendPoll` method calls depending on image presence.
- **Message Templates**: Supports dynamic injection of prefixes/suffixes (e.g., `[Topic] Question?`).

### 2.5. UI/UX Layout Optimization
- **Responsive Toolbar Design**: The `QuizListToolbar` and `QuizListHeader` have been optimized for high-density information display. On desktop, typography is scaled up for better legibility (e.g., larger select fields and labels), while on mobile, a vertical "stacked" layout is used to prevent horizontal clipping.
- **Improved Information Hierarchy**: Stats cards (Generated/Sent) and configuration previews (Prefix/Suffix) now feature subtle shadows, refined indigo/purple color palettes, and clear uppercase labels for a professional, "dashboard-like" aesthetic.
- **Action-Oriented Workflow**: The main "Send All" button is now more prominent and consistently positioned at the bottom of the toolbar configuration on mobile or as a clear CTA on desktop.

## 3. Branding
- **Logo**: The application features a custom logo (Purple/White Playful Quiz Time branding) used as the favicon, Apple touch icon, and in the authentication headers.
- **App Name**: TeleQuiz.

## 4. Technical Architecture

### 4.1. Frontend
- **Framework**: React 18+ with Vite.
- **Styling**: Tailwind CSS for responsive, utility-first design.
- **State Management**: React Hooks (`useState`, `useEffect`) and custom feature-specific hooks.
- **Animations**: `motion` (framer-motion) for smooth UI transitions.
- **Icons**: `lucide-react`.

### 4.2. Backend & Infrastructure
- **Database**: Supabase PostgreSQL.
- **Authentication**: Supabase Auth.
- **Security**: Supabase Row Level Security (RLS) enforce data ownership (users can only access their own quizzes, drafts, and settings).
- **Deployment**: Deployed on Google Cloud Run.

## 5. Project Structure

- `/src/features/`: Contains feature-based modules.
  - `quiz/`: Quiz generation, editing, listing, and bulk actions.
  - `draft/`: Draft management logic and components.
  - `auth/`: Authentication flow.
  - `settings/`: Telegram bot and channel configuration.
  - `profile/`: User profile management.
  - `admin/`: User and system management for admins.
- `/src/components/`: Shared UI components (Header, Footer, Navigation, ProtectedRoute).
- `/src/lib/`: Utility functions (e.g., `supabase.ts` for database connection).
- `/src/app/`: Application entry points (`App.tsx`, `AppRoutes.tsx`, `useAppInit.ts`).

## 6. Security & Validation
- **Supabase RLS**: Strict rules ensure that users can only read/write their own data (`userId` matching `auth.uid()`).
- **Error Handling**: Custom error boundaries and Supabase error handlers ensure that permission issues are logged and surfaced to the user.

## 7. Development Guidelines

### 7.1. Component Development
- All `.tsx` files should be kept under 120 lines of code for modularity (extended to accommodate rich UI components).
- Use functional components and hooks.
- Use Tailwind CSS for all styling.

### 7.2. State Management
- Prefer primitive values in dependency arrays for `useEffect`.
- Avoid infinite re-renders by not updating state directly in the component body.

### 7.3. Supabase Integration
- Use `supabase_schema.sql` for initial setup.
- Always use `.subscribe()` or PostgreSQL triggers for real-time data needs.
- Implement robust error handling for all database operations.

## 8. Future Improvements
- Add support for more Telegram poll types (e.g., quiz, regular poll).
- Implement advanced analytics for sent polls.
- Add support for more AI models for content generation.
- Enhance CSV Modifier with more advanced data transformation options.
- Implement unit and integration tests for core features.
- Optimize PostgreSQL queries for better performance.
- Add support for custom themes in quiz generation.
- Enhance Telegram channel formatting options.
- Add support for user-defined quiz templates.

## 9. Conclusion
TeleQuiz is designed to be a scalable, secure, and user-friendly platform for Telegram quiz management. By leveraging modern web technologies and Supabase, it provides a seamless experience for creators to generate, manage, and deploy content efficiently. The modular architecture ensures that new features can be added with minimal friction, making it a robust solution for content creators.

---