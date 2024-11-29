import { db } from "@/adapter";
import type { Context } from "@/context";
import { userTable } from "@/db/schema";
import { lucia } from "@/lucia";
import { loggedIn } from "@/middleware";
import { LoginSchema, type SuccessResponse } from "@/shared/types";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { generateId } from "lucia";
import postgres from "postgres";

export const authRouter = new Hono<Context>()
  .post("/signup", zValidator("form", LoginSchema), async (c) => {
    const { username, password } = c.req.valid("form");

    const passwordHash = await Bun.password.hash(password);
    const userId = generateId(15);

    try {
      await db.insert(userTable).values({
        id: userId,
        username,
        passwordHash,
      });

      const session = await lucia.createSession(userId, { username });
      const sessionCookie = lucia.createSessionCookie(session.id).serialize();

      c.header("Set-Cookie", sessionCookie, { append: true });

      return c.json<SuccessResponse>(
        { success: true, message: "User created" },
        201,
      );
    } catch (error) {
      if (error instanceof postgres.PostgresError && error.code === "23505") {
        throw new HTTPException(409, {
          message: "Username already used",
          cause: { form: true },
        });
      }

      throw new HTTPException(500, { message: "Failed to create user" });
    }
  })
  .post("/login", zValidator("form", LoginSchema), async (c) => {
    const { username, password } = c.req.valid("form");

    const [existingUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.username, username))
      .limit(1);
    if (!existingUser) {
      throw new HTTPException(401, {
        message: "Incorrect username or password",
        cause: { form: true },
      });
    }

    const validPassword = await Bun.password.verify(
      password,
      existingUser.passwordHash,
    );
    if (!validPassword) {
      throw new HTTPException(401, {
        message: "Incorrect username or password",
        cause: { form: true },
      });
    }

    const session = await lucia.createSession(existingUser.id, { username });
    const sessionCookie = lucia.createSessionCookie(session.id).serialize();

    c.header("Set-Cookie", sessionCookie, { append: true });

    return c.json<SuccessResponse>(
      { success: true, message: "Logged in" },
      200,
    );
  })
  .get("/logout", async (c) => {
    const session = c.get("session");
    if (!session) {
      return c.redirect("/");
    }

    await lucia.invalidateSession(session.id);
    const sessionCookie = lucia.createBlankSessionCookie().serialize();

    c.header("Set-Cookie", sessionCookie);

    return c.redirect("/");
  })
  .get("/user", loggedIn, async (c) => {
    const user = c.get("user")!;

    return c.json<SuccessResponse<{ username: string }>>({
      success: true,
      message: "User fetched",
      data: { username: user.username },
    });
  });
