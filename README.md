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

### Supabase Setup

1. Create a new Supabase project.
2. In the Supabase SQL Editor, run the schema script: **`supabase/schema.sql`**
   - This creates `users`, `star_types`, `daily_star_entries`, and `user_scores` tables, plus the score-calculation function and triggers.
   - Star types (yellow, blue, red, green) are seeded with default point values; you can edit `star_types` and `available_on_dow` for day-specific stars.

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
- Responsive design; top 3 highlighted with medals.

## Technologies Used

- React
- Supabase (PostgreSQL)
- CSS Grid for layout
- Environment variables for configuration
