import createMiddleware from "next-intl/middleware";
import { routing } from "@/core/i18n";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
