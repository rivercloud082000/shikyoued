import { NextRequest, NextResponse } from "next/server";
import { jsonrepair } from "jsonrepair";
import { buildUserPrompt, SYSTEM } from "@/lib/ai/prompts";
import { generateSessionJSON } from "@/lib/ai/providers";

// === Utilidades auxiliares ===

// Normaliza nivel para inferir ciclo
function normalizeNivel(nivel: string = ""): "primaria" | "secundaria" | "" {
  const n = (nivel || "").toLowerCase().trim();
  if (n.startsWith("pri")) return "primaria";
  if (n.startsWith("sec")) return "secundaria";
  return "";
}

function parseGrado(grado: string = ""): number {
  const m = (grado || "").toLowerCase().match(/\d+/);
  return m ? parseInt(m[0], 10) : NaN;
}

function inferirCiclo(nivel: string = "", grado: string = ""): string {
  const n = normalizeNivel(nivel);
  const g = parseGrado(grado);
  if (!n || !Number.isFinite(g)) return "";

  if (n === "primaria") {
    if (g <= 2) return "III";
    if (g <= 4) return "IV";
    return "V"; // 5°–6°
  }
  if (n === "secundaria") {
    if (g <= 2) return "VI";
    return "VII"; // 3°–5°
  }
  return "";
}

// Convierte strings/arrays en array limpio
function convertirAArray(input: string | string[]): string[] {
  if (Array.isArray(input)) return input;
  if (typeof input === "string") {
    return input
      .split(/[\n,;\u2022\u25AA\u00B7\u25CF|]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

// Timeout de promesas (si el provider se demora demasiado)
async function withTimeout<T>(p: Promise<T>, ms: number, label = "operación"): Promise<T> {
  let t: NodeJS.Timeout;
  const timeout = new Promise<never>((_, rej) =>
    (t = setTimeout(() => rej(new Error(`${label} superó ${ms} ms`)), ms))
  );
  try {
    // @ts-ignore
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t!);
  }
}

// Limpieza fuerte de texto antes del parseo
function cleanRaw(raw: any): string {
  return String(raw)
    .replace(/^\uFEFF/, "")                // BOM
    .replace(/```(?:json)?/gi, "")         // fences
    .replace(/```/g, "")
    .replace(/[“”‘’]/g, '"')
    .replace(/\u0000/g, "")
    .replace(/\\u[\da-f]{0,3}[^a-f0-9]/gi, "")
    .trim();
}

// Extrae el primer objeto {…} balanceado
function extractBalancedJson(s: string): string | null {
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === "{") { if (depth === 0) start = i; depth++; }
    else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) return s.slice(start, i + 1);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // --- Validación de body ---
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
    }

    // Evitar payloads gigantes que saturen el provider
    const rawLen = JSON.stringify(body).length;
    if (rawLen > 2_000_000) {
      return NextResponse.json(
        { success: false, error: "Payload demasiado grande" },
        { status: 413 }
      );
    }

    // Provider permitido
    const provider = (body.provider ?? "ollama-mistral") as "ollama-mistral" | "cohere";
    const allowed = new Set<"ollama-mistral" | "cohere">(["ollama-mistral", "cohere"]);
    const safeProvider = allowed.has(provider) ? provider : "ollama-mistral";

    // --- Datos base (server como fuente de verdad para ciclo) ---
    const datos = body.datos ?? {};
    const nivel = String(datos.nivel ?? "");
    const grado = String(datos.grado ?? "");
    const ciclo = inferirCiclo(nivel, grado);

    const datosServer = { ...datos, nivel, grado, ciclo };

    const tituloSesion = datosServer.tituloSesion ?? "Sesión sin título";
    const enfoque = String(datosServer.enfoque ?? "MINEDU");
    const contextoPersonalizado =
   (body.contextoSecuencia ? String(body.contextoSecuencia) : "") +
   `\n\nENFOQUE_PEDAGOGICO: ${enfoque}. Mantén la estructura MINEDU; ajusta SOLO actividades y lenguaje según el enfoque.\n`;

    const capacidadesManuales = convertirAArray(datosServer.capacidades ?? []);

    // --- Prompt final (usa SIEMPRE datosServer) ---
    const prompt = buildUserPrompt({
      datos: datosServer,
      tituloSesion,
      contextoPersonalizado,
      capacidadesSeleccionadas: capacidadesManuales,
    });

    // --- Llamada a IA con timeout de servidor ---
    const raw = await withTimeout(
      generateSessionJSON({
        provider: safeProvider,
        system: SYSTEM,
        prompt,
        temperature: 0.2,
      }),
      180_000, // ajusta si lo necesitas
      "generación de sesión"
    );

    // --- Limpieza y parseo robusto ---
    let cleaned = cleanRaw(raw);

    // 1) JSON.parse directo
    let data: any = null;
    try { data = JSON.parse(cleaned); } catch {}

    // 2) Extraer objeto balanceado
    if (!data) {
      const balanced = extractBalancedJson(cleaned);
      if (balanced) {
        try { data = JSON.parse(balanced); } catch {}
      }
    }

    // 3) Reparar con jsonrepair
    if (!data) {
      try {
        const repaired = jsonrepair(cleaned);
        data = JSON.parse(repaired);
      } catch {
        // noop
      }
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "La IA no devolvió JSON válido", sample: cleaned.slice(0, 800) },
        { status: 502 }
      );
    }

    // --- Refuerzo post-IA: ciclo correcto y saneado ---
    data.datos = data.datos || {};
    data.datos.nivel = String(data.datos.nivel ?? nivel ?? "");
    data.datos.grado = String(data.datos.grado ?? grado ?? "");
    data.datos.ciclo = inferirCiclo(data.datos.nivel, data.datos.grado);

    // ✅ FIX FINAL: respetar SOLO las capacidades seleccionadas por el docente
    data.datos.capacidades = convertirAArray(capacidadesManuales);



    // Saneado de la primera fila (si existe)
    const fila = data.filas?.[0];
    if (fila) {
      fila.recursosDidacticos = convertirAArray(fila.recursosDidacticos);
      fila.instrumento = convertirAArray(fila.instrumento);
      fila.criteriosEvaluacion = convertirAArray(fila.criteriosEvaluacion);
      fila.evidenciaAprendizaje = convertirAArray(fila.evidenciaAprendizaje);

      if (!fila.tituloSesion && tituloSesion) {
        fila.tituloSesion = tituloSesion;
      }
    }

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ Error en /api/generar:", error);
    const status =
      /superó \d+ ms/.test(error?.message || "") ? 504 : 500;

    return NextResponse.json(
      { success: false, error: error?.message || "Error desconocido" },
      { status }
    );
  }
}
