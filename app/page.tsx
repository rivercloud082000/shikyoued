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
          className="mx-auto drop-shadow-lg animate-pulse"
/>

      </div>

      {/* 🔹 Caja central con el acceso directo */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="bg-black bg-opacity-60 p-8 rounded-xl shadow-xl text-center max-w-xl">
          <p className="mb-6 text-lg text-white">
            Tu generador de sesiones de aprendizaje.
          </p>

          {/* Botón para ir directamente a la app */}
          <Link
            href="/app" /* <-- ajusta si es otra ruta */
            className="inline-block px-8 py-3 font-bold text-lg rounded-full transition-transform duration-300 hover:scale-105
                       bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            Ir a la app
          </Link>

          {/* Nota pequeña bajo el botón */}
          <p className="mt-4 text-xs text-white/70">
            Acceso libre sin autenticación.
          </p>
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
      className="underline text-blue-300"
    >
      huampuque2000@gmail.com
    </a>
  </div>

  {/* Autor */}

  <div className="text-xs text-white/80">
    Desarrolado por {" "}
    <strong className="text-blue-300">ERES</strong>
  </div>
</div>
    </main>
  );
}
