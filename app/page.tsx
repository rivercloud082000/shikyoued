"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col justify-between items-center text-white relative"
      style={{
        backgroundImage: "url('/fondo-animado.gif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Logo posicionado manualmente */}
      <div className="logo-pos absolute top-4 right-4">
        <Image
          src="/logo-shikyu.png"
          alt="Logo ShikyuEd"
          width={110}
          height={100}
        />
      </div>

      {/* 🔹 Título en la parte superior, centrado */}
      <div className="pt-6 text-center">
        <Image
         src="/sestia.jpeg"
         alt="SestIA Blossom – Generador Educativo"
          width={430} // ajusta el tamaño según quieras
          height={130}
          className="mx-auto drop-shadow-[0_12px_35px_rgba(0,0,0,0.35)] animate-pulse rounded-2xl"
style={{
  mixBlendMode: "multiply",
  filter: "drop-shadow(0 18px 28px rgba(0,0,0,.25))",
}}

/>

      </div>

      {/* 🔹 Caja central con el acceso directo */}
<div className="flex-1 flex items-center justify-center w-full px-4">
  <div
    className="
      relative
      w-full
      max-w-lg
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
    <div className="rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 px-6 py-6">
      <p className="mb-6 text-lg md:text-xl text-white/90 drop-shadow">
        Crea sesiones en segundos, listas para exportar y usar en clase.
      </p>

      <Link
        href="/app"
        className="inline-flex items-center justify-center px-9 py-3 font-extrabold text-base md:text-lg
                   rounded-full transition-all duration-300 hover:scale-[1.03]
                   bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.18)]"
      >
        Ir a la app →
      </Link>

      <p className="mt-4 text-xs text-white/70">
        Diseño futurista · Rápido · Profesional
      </p>
    </div>
  </div>
</div>


      {/* 🔹 Bloque de contacto y autor: lo más abajo y a la derecha */}
      {/* Footer fijo en la esquina inferior derecha */}
<div className="footer-pos text-sm absolute bottom-4 text-white">
  {/* Íconos */}
  <div className="flex justify-end gap-3 mb-2">
    {/* WhatsApp */}
    <a
      href="https://wa.me/51913840883"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:opacity-80 transition"
      aria-label="WhatsApp"
      title="WhatsApp"
    >
      <Image src="/whatsapp.png" alt="WhatsApp" width={28} height={28} />
    </a>

    {/* Instagram */}
    <a
      href="https://www.instagram.com/adri.anperez5043?igsh=ZGk3Mm5obHNhMzFI"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:opacity-80 transition"
      aria-label="Instagram"
      title="Instagram"
    >
      <Image src="/instagram.png" alt="Instagram" width={40} height={28} />
    </a>
  </div>

  {/* Gmail */}

  <div className="mb-1">
    📧{" "}
    <a
      href="mailto:huampuque2000@gmail.com"
      className="underline text-slate-500 hover:text-slate-300 transition"


    >
      huampuque2000@gmail.com
    </a>
  </div>

  {/* Autor */}

  <div className="text-xs text-slate-500">
  Desarrollado por{" "}
  <strong className="text-black font-semibold">ERES</strong>
</div>

  </div>
    </main>
  );
}


