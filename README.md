# BetterNews - A Fullstack HackerNews Clone

This repo is an implementation of some of the core features of HackerNews. It includes post, comments, nested comments, authentication and deployment with Docker as well.

Utilises the following:

- Hono - backend server (like Express.js, but faster)
- Bun - package manager (Node.js alternative)
- DrizzleORM - database ORM library (like Prisma)
- Postgres - backend database
- Tanstack Router - router for frontend
- Tanstack Query / React Query - data managment library
- Tanstack Form - form state managment
- Zod - validations
- TypeScript - static typing for JavaScript

![](./preview.png)

## Usage

To use this project, you will first need to have a running postgres server. You can set this up with Docker.

### Development

1. Clone the repo
2. Run `bun install`
3. Add in environment variables to `.env`
4. Run the development servers for both backend and frontend:

- `bun dev` for backend
- `cd frontend && bun dev` for frontend

### Production

1. Clone the repo
2. Add in environment variables to `.env`
3. Build the frontend `cd frontend && bun run build`
4. Run `bun server/index.ts`
