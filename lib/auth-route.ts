// Keep the route file in app/api/auth/[...nextauth]/route.ts a thin re-export.
// This file is the actual handler. Separating it makes typechecking smoother
// since the route segment file inherits its own NextRequest type rules.
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
