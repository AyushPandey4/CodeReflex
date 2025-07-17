# CodeReflex: AI Mock Interview Simulator

CodeReflex is a cutting-edge AI-powered mock interview simulator designed to help you ace your technical interviews. It provides a realistic interview experience with real-time feedback, coding challenges, and personalized performance analysis.

## Features

- **Realistic AI Interviewer**: Engage in a natural conversation with an AI interviewer that adapts to your responses.
- **Multiple Interview Types**: Practice various interview formats, including behavioral, technical, and case studies.
- **Live Coding Challenges**: Solve coding problems in a built-in editor and get instant feedback on your solution.
- **Real-time Feedback**: Receive continuous feedback on your communication, problem-solving, and technical skills throughout the interview.
- **Emotion Analysis**: Get insights into your body language and tone of voice to improve your non-verbal communication.
- **Personalized Performance Reports**: After each interview, receive a detailed report with your strengths, weaknesses, and areas for improvement.
- **Resume-based Questions**: The AI can ask you questions based on your resume to make the interview more personalized.
- **Credit System**: Users get free daily credits to practice interviews.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The project is a Next.js application with the following structure:

```
.
├── .next/
├── .git/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.js        # Handles chat-related API requests
│   │   │   └── extract-pdf/
│   │   │       └── route.js        # Extracts text from PDF resumes
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.js        # Handles OAuth callback
│   │   ├── dashboard/
│   │   │   └── page.js             # User dashboard
│   │   ├── feedback/
│   │   │   └── [id]/
│   │   │       └── page.js         # Displays feedback for a specific interview
│   │   ├── interview/
│   │   │   └── [id]/
│   │   │       └── page.js         # The main interview page
│   │   ├── layout.js               # Main layout
│   │   └── page.js                 # Home page
│   ├── components/                 # Reusable components
│   ├── context/
│   │   ├── CacheContext.js         # Manages user session, interviews, and feedback caching
│   │   └── ToastContext.js         # Manages toast notifications
│   ├── hooks/                      # Custom React hooks
│   │   ├── useInterview.js         # Fetches and manages a single interview
│   │   ├── useSpeechToText.js      # Handles speech-to-text functionality
│   │   ├── useTextToSpeech.js      # Handles text-to-speech functionality
│   │   ├── useSubmission.js        # Handles interview submission logic
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.js             # Initializes and configures the Supabase client
│   │   ├── credits.js              # Manages user credits
│   │   └── ...
│   └── middleware.js               # Handles security headers and other middleware
├── public/                         # Static assets
├── .gitignore
├── next.config.mjs
├── package.json
└── README.md
```

## Routes

- **`/`**: The home page, where users can log in and learn about the project.
- **`/dashboard`**: The user's dashboard, where they can see their past interviews and start a new one.
- **`/interview/[id]`**: The main interview page, where the user interacts with the AI interviewer.
- **`/feedback/[id]`**: The feedback page, which displays a detailed report of the user's performance in a specific interview.
- **`/auth/callback`**: The callback URL for Google OAuth.

## Supabase Tables

The project uses Supabase for the database. Here are the main tables:

### `interviews`

This table stores all the information about each interview.

```sql
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  job_role TEXT,
  company_name TEXT,
  interview_type TEXT,
  difficulty_level TEXT,
  duration INTEGER,
  job_description TEXT,
  interviewer_personality TEXT,
  enable_webcam BOOLEAN,
  custom_focus_areas TEXT[],
  resume_text TEXT,
  transcript JSONB,
  code_snippet TEXT,
  emotion_summary JSONB,
  ai_feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);
```

### `feedback`

This table stores the feedback for each interview.

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id),
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER,
  strengths TEXT[],
  weaknesses TEXT[],
  suggestions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `users`

This table is managed by Supabase Auth and is extended with a `credits` column.

```sql
-- This table is managed by Supabase Auth.
-- You just need to add the `credits` column.
ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 3;
```

### `refill_daily_credits`

This is a remote procedure call (RPC) that refills the user's credits daily.

```sql
CREATE OR REPLACE FUNCTION refill_daily_credits(user_id_param UUID)
RETURNS TABLE(credits_updated INT) AS $$
DECLARE
    last_refill_date DATE;
    current_user_credits INT;
BEGIN
    -- Get the last refill date and current credits for the user
    SELECT last_credit_refill, credits INTO last_refill_date, current_user_credits
    FROM users
    WHERE id = user_id_param;

    -- If today is not the last refill date, update credits and the date
    IF last_refill_date IS NULL OR last_refill_date < CURRENT_DATE THEN
        UPDATE users
        SET credits = 3, last_credit_refill = CURRENT_DATE
        WHERE id = user_id_param;
        credits_updated := 3;
    ELSE
        credits_updated := current_user_credits;
    END IF;

    RETURN QUERY SELECT credits_updated;
END;
$$ LANGUAGE plpgsql;
```

## Environment Variables

The following environment variables are required to run the application. Create a `.env.local` file in the root of the project and add the following:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
OPENROUTER_API_KEY=<your-openrouter-api-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

You can get these values from your Supabase project settings.
