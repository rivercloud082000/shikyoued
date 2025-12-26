export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

// =======================
// helpers
// =======================
function listarCotejo(inst: any): string {
  const items = inst?.listaCotejo ?? [];
  if (!Array.isArray(items)) return "";

  return items
    .map((x: any, i: number) => {
      const c = String(x?.criterio ?? "").trim();
      if (!c) return "";
      return `${i + 1}. ${c}   [ ] Sí   [ ] No   [ ] En proceso`;
    })
    .filter(Boolean)
    .join("\n");
}

function listarRubrica(inst: any): string {
  const items = inst?.rubrica ?? [];
  if (!Array.isArray(items)) return "";

  return items
    .map((r: any, i: number) => {
      const c = String(r?.criterio ?? "").trim();
      const n = r?.niveles ?? {};
      if (!c) return "";

      return [
        `${i + 1}. ${c}`,
        `  • Inicio: ${n.inicio ?? ""}`,
        `  • En proceso: ${n.enProceso ?? ""}`,
        `  • Logro esperado: ${n.logroEsperado ?? ""}`,
        `  • Destacado: ${n.destacado ?? ""}`,
      ].join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buf.length);
  new Uint8Array(ab).set(buf);
  return ab;
}

// =======================
// POST
// =======================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response("Body inválido", { status: 400 });
    }

    const { meta, instrumentos } = body;
    if (!instrumentos) {
      return new Response("No hay instrumentos", { status: 400 });
    }

    const templatePath = path.resolve("public", "plantilla-instrumentos.docx");
    if (!fs.existsSync(templatePath)) {
      return new Response("No existe plantilla-instrumentos.docx", { status: 500 });
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{", end: "}" },
    });

    const lista = Array.isArray(instrumentos?.listaCotejo) ? instrumentos.listaCotejo : [];
const rub = Array.isArray(instrumentos?.rubrica) ? instrumentos.rubrica : [];

doc.setData({
  TITULO_SESION: meta?.tituloSesion ?? "",
  AREA: meta?.area ?? "",
  COMPETENCIA: meta?.competencia ?? "",
  NIVEL: meta?.nivel ?? "",
  GRADO: meta?.grado ?? "",
  DOCENTE: meta?.docente ?? "",

  // ✅ para loops en tablas
  LISTA: lista.map((x: any, i: number) => ({
    n: i + 1,
    criterio: String(x?.criterio ?? "").trim(),
  })),

  RUB: rub.map((r: any, i: number) => ({
    n: i + 1,
    criterio: String(r?.criterio ?? "").trim(),
    inicio: String(r?.niveles?.inicio ?? "").trim(),
    enProceso: String(r?.niveles?.enProceso ?? "").trim(),
    logro: String(r?.niveles?.logroEsperado ?? "").trim(),
    destacado: String(r?.niveles?.destacado ?? "").trim(),

    // ✅ puntaje numérico (colegio)
    pInicio: "1",
    pEnProceso: "2",
    pLogro: "3",
    pDestacado: "4",
  })),

  PIE_SESTIA: "Documento generado automáticamente mediante SestIA – ERES",
});


    doc.render();

    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    return new Response(bufferToArrayBuffer(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=instrumentos.docx",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
}
