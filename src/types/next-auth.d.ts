import { RolUsuario } from "@/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    rol?: RolUsuario;
  }

  interface Session {
    user: {
      id?: string;
      rol?: RolUsuario;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rol?: RolUsuario;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    rol?: RolUsuario;
  }
}
