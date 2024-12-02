# BetterNews - A Fullstack Hacker News Clone

This project is a full-stack clone of [Hacker News](https://news.ycombinator.com/), that implements the core features like posting, commenting (with nested comments), and username/password authentication. I've deployed this project on [Fly.io](https://fly.io/), but deployment with Docker is also supported.

## Tech Stack

- [Hono](https://hono.dev/docs/api/routing) - backend server (like Express.js, but faster)
- [Bun](https://bun.sh/) - package manager (Node.js alternative)
- [Drizzle ORM](https://orm.drizzle.team/) - database ORM library (like Prisma)
- Postgres SQL - backend database
- [Tanstack Router, Query, and Form](https://tanstack.com/) - Tanstack Query is a data management library and Tanstack Form is a form state manager
- Zod - validations
- TypeScript - static typing for JavaScript

![](./preview.png)

## Usage

To use this project, you will first need a running Postgres server. You can set this up with Docker.

### Development

1. Clone the repo
2. Run `bun install`
3. Add in environment variables to `.env`
4. Run the development servers for both backend and frontend:

- `bun dev` for the backend
- `cd frontend && bun dev` for the frontend

### Production

1. Clone the repo
2. Add in environment variables to `.env`
3. Build the frontend `cd frontend && bun run build`
4. Run `bun server/index.ts`

## Goals

I've tried to implement the core features of Hacker News while creating a full-stack application.

## Credits

- [Build a HackerNews Clone](https://www.youtube.com/watch?v=eHbO5OWBBpg&t=2273s)
