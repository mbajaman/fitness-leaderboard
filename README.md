# Fitness Leaderboard

A React application that displays a fitness leaderboard by fetching data from a Supabase PostgreSQL database.

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- npm or yarn
- Supabase account and project

### Installation

1. Clone this repository:
```
git clone <repository-url>
cd fitness-leaderboard
```

2. Install dependencies:
```
npm install
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

1. Create a new Supabase project
2. Create a table called `scores` with the following columns:
   - `id` (uuid, primary key)
   - `name` (text, not null)
   - `score` (integer, not null)
   - `created_at` (timestamp with time zone, default: now())

3. Add some sample data to test the leaderboard

### Running the Application

```
npm start
```
or
```
yarn start
```

The application will be available at http://localhost:3000

## Features

- Displays a leaderboard of fitness scores
- Automatically sorts by score (highest first)
- Highlights the top 3 performers
- Allows refreshing the data
- Responsive design

## Technologies Used

- React
- Supabase (PostgreSQL)
- CSS Grid for layout
- Environment variables for configuration
