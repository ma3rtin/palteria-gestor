import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);
export default auth;

export const config = {
  // Excluye rutas internas de Next.js y la propia ruta de auth de NextAuth
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
