import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);
export default auth;

export const config = {
  // Excluye rutas internas de Next.js, api de auth y archivos estáticos (imágenes, fuentes, robots.txt, etc.)
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff|woff2)).*)",
  ],
};
