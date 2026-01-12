"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type LoginStatus = "idle" | "DOCENTE" | "ADMIN";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("huampuque2000@gmail.com");
  const [password, setPassword] = useState("Huampuque8");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<LoginStatus>("idle"); // según rol del login

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      // data.role debe venir del backend ("ADMIN" | "DOCENTE")
      const role = (data.role as LoginStatus) || "DOCENTE";
      setStatus(role);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Error de conexión");
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center text-white relative"
      style={{
        backgroundImage: "url('/fondo-animado.gif')", // o tu fondo actual
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Logo SestIA arriba */}
      <div className="pt-6 text-center">
        <Image
          src="/sestia.jpeg"
          alt="SestIA – Generador Educativo"
          width={430}
          height={130}
          className="mx-auto drop-shadow-[0_12px_35px_rgba(0,0,0,0.25)] rounded-2xl"
        />
      </div>

      {/* Card central */}
      <div className="flex-1 flex items-center justify-center w-full px-4">
        <div
          className="
            relative
            w-full
            max-w-xl
            rounded-2xl
            text-center
            backdrop-blur-2xl
            bg-gradient-to-br
            from-emerald-400/20
            via-cyan-400/15
            to-blue-500/20
            border border-white/25
            shadow-[0_25px_60px_rgba(0,0,0,0.35)]
            p-6
          "
        >
          <div className="rounded-2xl bg-black/30 backdrop-blur-xl border border-white/15 px-6 py-6 space-y-4">
            {/* === ESTADO 1: antes de iniciar sesión === */}
            {status === "idle" && (
              <>
                <p className="text-lg md:text-xl text-white/90 font-semibold drop-shadow">
                  Inicia sesión para generar sesiones y fichas en segundos.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  {error && (
                    <div className="text-sm bg-red-900/60 text-red-100 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}

                  {/* Correo */}
                  <div className="text-left text-sm text-slate-100">
                    <label className="block mb-1 font-semibold">
                      Correo autorizado
                    </label>
                    <input
                      type="email"
                      className="
                        w-full rounded-xl px-3 py-2
                        bg-slate-900/50 border border-slate-500/70
                        text-sm text-slate-100
                        focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300
                      "
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {/* Contraseña + ojito */}
                  <div className="text-left text-sm text-slate-100">
                    <label className="block mb-1 font-semibold">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="
                          w-full rounded-xl px-3 py-2
                          bg-slate-900/50 border border-slate-500/70
                          text-sm text-slate-100
                          pr-10
                          focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300
                        "
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="
                          absolute inset-y-0 right-2 flex items-center
                          text-xs text-slate-300 hover:text-white
                        "
                        aria-label={
                          showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      w-full
                      rounded-full
                      bg-white text-slate-900
                      font-semibold
                      py-2.5
                      text-sm md:text-base
                      shadow-[0_0_25px_rgba(255,255,255,0.35)]
                      hover:bg-emerald-100
                      active:scale-[0.98]
                      transition
                      disabled:opacity-60
                    "
                  >
                    {loading ? "Ingresando..." : "Iniciar sesión"}
                  </button>
                </form>

                <p className="mt-2 text-xs text-white/70">
                  Usa tu correo autorizado. Si no puedes ingresar, solicita al
                  administrador que te agregue a la <span className="font-semibold">allowlist</span>.
                </p>
              </>
            )}

            {/* === ESTADO 2: Docente === */}
            {status === "DOCENTE" && (
              <div className="space-y-4">
                <p className="text-lg font-semibold text-emerald-200">
                  Acceso concedido como <span className="text-emerald-300">Docente</span>.
                </p>
                <p className="text-sm text-slate-100">
                  Haz clic para ir al generador de sesiones.
                </p>
                <button
                  onClick={() => router.push("/app")}
                  className="
                    w-full md:w-64 mx-auto
                    rounded-full
                    bg-emerald-500 hover:bg-emerald-400
                    text-slate-900 font-semibold
                    py-2.5 text-sm
                    shadow-[0_0_30px_rgba(0,0,0,0.4)]
                    transition
                  "
                >
                  Ir a la app →
                </button>
              </div>
            )}

            {/* === ESTADO 3: Admin === */}
            {status === "ADMIN" && (
              <div className="space-y-4">
                <p className="text-lg font-semibold text-emerald-200">
                  Acceso concedido como <span className="text-emerald-300">Administrador</span>.
                </p>
                <p className="text-sm text-slate-100">
                  Elige a dónde ir:
                </p>

                <div className="flex flex-col md:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push("/app")}
                    className="
                      flex-1
                      rounded-full
                      bg-emerald-500 hover:bg-emerald-400
                      text-slate-900 font-semibold
                      py-2.5 text-sm
                      shadow-[0_0_30px_rgba(0,0,0,0.4)]
                      transition
                    "
                  >
                    Ir a la app →
                  </button>
                  <button
                    onClick={() => router.push("/admin")}
                    className="
                      flex-1
                      rounded-full
                      bg-sky-500 hover:bg-sky-400
                      text-slate-900 font-semibold
                      py-2.5 text-sm
                      shadow-[0_0_30px_rgba(0,0,0,0.4)]
                      transition
                    "
                  >
                    Ir al panel administrador →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer flotante con contacto, más claro */}
      <div
        className="
          fixed
          bottom-4 right-4
          rounded-2xl
          bg-white/85
          text-slate-900
          shadow-xl
          px-4 py-3
          text-xs md:text-sm
          border border-emerald-300/70
          backdrop-blur
        "
      >
        <div className="flex items-center gap-2 mb-1">
          <span>📧</span>
          <a
            href="mailto:e.r.e.s.enterprise@gmail.com"
            className="font-semibold hover:underline"
          >
            Escríbenos: e.r.e.s.enterprise@gmail.com
          </a>
        </div>
        <div className="text-[11px]">
          Desarrollado por <span className="font-bold text-emerald-700">ERES</span>
        </div>
      </div>
    </main>
  );
}
