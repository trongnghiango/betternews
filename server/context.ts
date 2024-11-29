import type { Env } from "hono";
import type { Session, User } from "./utils/auth";

export interface Context extends Env {
  Variables: {
    user: User | null;
    session: Session | null;
  };
}
