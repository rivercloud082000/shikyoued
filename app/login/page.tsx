"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("huampuque2000@gmail.com"); // para probar rápido
  const [password, setPassword] = useState("Huampuque8");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // 👇 CAMBIA ESTA RUTA si tu generador está en otra (ej: "/app/app")
      router.push("/app");
    } catch (err) {
      console.error(err);
      setError("Error de conexión");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur p-6 shadow-xl border border-white/20"
      >
        <h1 className="text-2xl font-semibold text-white mb-4 text-center">
          Iniciar sesión
        </h1>

        {error && (
          <div className="mb-3 text-sm text-red-300 bg-red-900/40 rounded px-3 py-2">
            {error}
          </div>
        )}

        <label className="block mb-3 text-sm text-slate-200">
          Correo
          <input
            type="email"
            className="mt-1 w-full rounded-md bg-slate-900/60 border border-slate-600 px-3 py-2 text-slate-100 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block mb-4 text-sm text-slate-200">
          Contraseña
          <input
            type="password"
            className="mt-1 w-full rounded-md bg-slate-900/60 border border-slate-600 px-3 py-2 text-slate-100 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold py-2 text-sm disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
