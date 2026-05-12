import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirectTo: "/",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/login?error=credenciales");
      }
      throw err;
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-white font-bold text-xl tracking-wide">La Paltería</div>
          <div className="text-[#a3e635] text-xs tracking-widest uppercase mt-1">Gestor</div>
        </div>

        <div className="bg-[#1c1f26] rounded-xl border border-[#2a2d35] p-8">
          <h1 className="text-[#f9fafb] font-semibold text-lg mb-6">Iniciar sesión</h1>

          {error === "credenciales" && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
              Email o contraseña incorrectos.
            </div>
          )}

          <form action={login} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-[#9ca3af] mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full bg-[#13161e] border border-[#2a2d35] rounded-lg px-3 py-2.5 text-sm text-[#f9fafb] focus:outline-none focus:border-[#a3e635] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[#9ca3af] mb-1.5">Contraseña</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full bg-[#13161e] border border-[#2a2d35] rounded-lg px-3 py-2.5 text-sm text-[#f9fafb] focus:outline-none focus:border-[#a3e635] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
