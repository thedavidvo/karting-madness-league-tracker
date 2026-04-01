# Kart Madness League Tracker

Next.js application for managing a karting league across years, seasons, rounds, and race classes.

## Core Features

- Year and season switching (4 seasons per year)
- Weekly round management (one round = one week)
- League classes:
	- Juniors
	- Adults Amateur
	- Adults Pro
- Full standings ladder with per-round columns (points + finishing position)
- Round detail pages
- Round editing to correct mistakes
- Per-result fields:
	- Finishing position
	- Fastest lap time
	- Base points
	- Flat times (manual entry, +1 per flat time)
- Automatic best-lap bonus (+1 to the best lap in each league for the round)

## Tech Stack

- Next.js App Router
- TypeScript
- Prisma ORM
- PostgreSQL (Neon)

## Setup

1. Install dependencies

```bash
npm install
```

2. Copy environment file

```bash
copy .env.example .env
```

3. Set your Neon connection string in `.env`

```env
DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/karting_league?sslmode=require"
```

4. Apply schema to Neon

```bash
npx prisma migrate deploy
```

If this is your first run and you prefer direct sync instead of migrations:

```bash
npx prisma db push
```

5. Generate Prisma client

```bash
npx prisma generate
```

6. Start development server

```bash
npm run dev
```

7. Open the app

http://localhost:3000

## Build

```bash
npm run build
```

## Database Tables

The initial migration is in `prisma/migrations/0001_init/migration.sql` and creates:

- LeagueYear
- Season
- Round
- Driver
- Result
- LeagueType enum
