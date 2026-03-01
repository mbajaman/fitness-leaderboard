# Fitness Leaderboard

A React application that displays a fitness leaderboard by fetching data from a Supabase PostgreSQL database.

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- pnpm or yarn
- Supabase account and project

### Installation

1. Clone this repository:
```
git clone <repository-url>
cd fitness-leaderboard
```

2. Install dependencies:
```
pnpm install
```
or
```
yarn install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```
   (Slack linking uses the same `REACT_APP_SUPABASE_ANON_KEY`; no extra env needed.)

### Supabase Setup

1. Create a new Supabase project.
2. In the Supabase SQL Editor, run the schema script: **`supabase/schema.sql`**
   - This creates `users`, `star_types`, `daily_star_entries`, and `user_scores` tables, plus the score-calculation function and triggers.
   - Star types (yellow, blue, red) are seeded with default point values; you can edit `star_types` and `available_on_dow` for day-specific stars.
3. If you use existing data, run migrations in order: **`supabase/migrations/`** (e.g. `20250228_star_quantity_and_score.sql`, `20250228_users_is_tag_team.sql`, `20250301_slack_bot_linking.sql`).

### Running the Application

```
pnpm start
```
or
```
yarn start
```

The application will be available at http://localhost:3000

## Features

- **Leaderboard** – Rankings by total score.
- **Register / Login** – Username-only auth; session is stored in localStorage.
- **Log stars** – Logged-in users can click on “+ Add” to pick a date and check off stars per day; score is computed on the database.
- **Embed view** – Use `/embed` (e.g. `https://yoursite.com/fitness-leaderboard/embed`) in an iframe (e.g. SharePoint) for a minimal leaderboard view with optional Login.
- **Slack bot** – Slash commands to log stars, view score, and leaderboard from Slack (see below).
- Responsive design; top 3 highlighted with medals.

### Slack Bot (optional)

The app can be used from Slack via Supabase Edge Functions. Users link their Slack account in the web app (“Connect Slack”), then use slash commands in your workspace.

**1. Database**

- Run **`supabase/migrations/20250301_slack_bot_linking.sql`** then **`supabase/migrations/20250302_slack_tag_team_multi_link.sql`** in the SQL Editor (adds `slack_link_codes`, `slack_user_links`, and `users.has_slack_linked`; tag teams can link multiple Slack accounts to the same leaderboard user).

**2. Edge Functions**

- Deploy the functions (e.g. with Supabase CLI):  
  `supabase functions deploy slack-fitness` and  
  `supabase functions deploy slack-create-link-code`
- Set **Secrets** in the Supabase Dashboard (Project Settings → Edge Functions → Secrets):
  - **`SLACK_SIGNING_SECRET`** – From your Slack app: Basic Information → App Credentials → Signing Secret. Required for `slack-fitness`.
  - **`SUPABASE_ANON_KEY`** – Your project’s anon key (Project Settings → API → anon public). Required for `slack-create-link-code` so it can validate requests from the web app (which sends the same anon key). If Supabase already injects this for Edge Functions, you can skip it.
  - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are usually set automatically for Edge Functions.
- **Verify JWT:** Turn **off** “Verify JWT with legacy secret” (or “Enforce JWT”) for Edge Functions in Supabase (Project Settings → Edge Functions). Slack sends slash-command requests without a JWT; if verification is on, Supabase rejects them before they reach your function and Slack shows “dispatch_failed.”

**3. Slack app**

- Create an app at [api.slack.com/apps](https://api.slack.com/apps) and install it to your workspace.
- **Slash Commands** – Create commands with Request URL =  
  `https://YOUR_PROJECT_REF.supabase.co/functions/v1/slack-fitness`  
  (replace `YOUR_PROJECT_REF` with your Supabase project reference):

  | Command       | Short description                          |
  |---------------|--------------------------------------------|
  | `/link`       | Link Slack to leaderboard (use code from web app) |
  | `/log`        | Log activity/daily/bonus stars             |
  | `/score`      | Show my score and star breakdown            |
  | `/leaderboard`| Show top N (e.g. `/leaderboard 10`)        |

- **OAuth & Permissions** – Bot token scopes: `commands` (required). Optionally `chat:write` if you post to channels later.

**4. Usage**

- In the web app, log in and click **Connect Slack**. Copy the code shown, then in Slack run: `/link YOUR_CODE`.
- After linking: `/log 3 activity` (3 yellow stars today), `/log daily`, `/score`, `/leaderboard`.
- Only March dates are accepted for logging (challenge month).

## Technologies Used

- React
- Supabase (PostgreSQL)
- CSS Grid for layout
- Environment variables for configuration
