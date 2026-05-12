import type { NextAuthConfig } from "next-auth";

// Config liviana sin imports de DB ni bcrypt — seguro para edge runtime (middleware)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const logueado = !!auth?.user;
      if (logueado && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/", nextUrl));
      }
      return logueado;
    },
  },
};
