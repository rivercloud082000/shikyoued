// app/api/exportarWord/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";              // <-- minúsculas (ok)
import Docxtemplater from "docxtemplater";

/** Une arrays a texto; si ya es string, lo devuelve tal cual. */
function listarPlano(v: any): string {
  if (!v) return "";
  if (Array.isArray(v)) {
    return v
      .map((x) => (x == null ? "" : String(x).trim()))
      .filter(Boolean)
      .map((x) => `• ${x}`)
      .join("\n");
  }
  return String(v);
}

/** Tu función original, intacta (solo usa listarPlano). */
function transformarAPlano(json: any): Record<string, string> {
  const fila = json.filas?.[0] || {};
  const datos = json.datos || {};

  return {
    tituloSesion: fila.tituloSesion || "",
    nivel: datos.nivel || "",
    ciclo: datos.ciclo || "",
    grado: datos.grado || "",
    bimestre: datos.bimestre || "",
    unidad: datos.unidad || "",
    fecha: datos.fecha || "",
    docente: datos.docente || "",
    area: fila.area || datos.area || "",
    competencia: datos.competencia || "",
    capacidades: listarPlano(datos.capacidades),
    propositoAprendizaje: fila.propositoAprendizaje || "",
    desempenosPrecisados: fila.desempenosPrecisados || "",
    secuenciaDidactica: listarPlano(fila.secuenciaDidactica),
    recursosDidacticos: listarPlano(fila.recursosDidacticos),
    criteriosEvaluacion: listarPlano(fila.criteriosEvaluacion),
    instrumento: listarPlano(fila.instrumento),
    evidenciaAprendizaje: listarPlano(fila.evidenciaAprendizaje),
  };
}

/** Buffer (Node) -> ArrayBuffer (DOM) seguro */
function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buf.length);
  new Uint8Array(ab).set(buf);
  return ab;
}

/** Acepta body como { success, data }, { data } o data directo. */
function extractData(body: any): any {
  if (!body) return null;
  if (body.data) return body.data;
  if (body.success && body.data) return body.data;
  return body;
}

/** Construye objeto de datos para la plantilla, con alias MAYÚSCULAS. */
function buildTemplateData(dataPlano: Record<string, string>) {
  const d = dataPlano;
  // Aliases: mantengo tus claves en minúscula y agrego MAYÚSCULAS para {NIVEL}, etc.
  return {
    // minúsculas (compat con tu versión)
    tituloSesion: d.tituloSesion,
    nivel: d.nivel,
    ciclo: d.ciclo,
    grado: d.grado,
    bimestre: d.bimestre,
    unidad: d.unidad,
    fecha: d.fecha,
    docente: d.docente,
    area: d.area,
    competencia: d.competencia,
    capacidades: d.capacidades,
    propositoAprendizaje: d.propositoAprendizaje,
    desempenosPrecisados: d.desempenosPrecisados,
    secuenciaDidactica: d.secuenciaDidactica,
    recursosDidacticos: d.recursosDidacticos,
    criteriosEvaluacion: d.criteriosEvaluacion,
    instrumento: d.instrumento,
    evidenciaAprendizaje: d.evidenciaAprendizaje,

    // MAYÚSCULAS (para tu doc con {TOKEN})
    NIVEL: d.nivel,
    CICLO: d.ciclo,
    GRADO: d.grado,
    BIMESTRE: d.bimestre,
    UNIDAD: d.unidad,
    FECHA: d.fecha,
    DOCENTE: d.docente,
    AREA: d.area,
    COMPETENCIA: d.competencia,
    CAPACIDADES: d.capacidades,

    TITULO_SESION: d.tituloSesion,
    PROPOSITO: d.propositoAprendizaje,
    DESEMPENOS: d.desempenosPrecisados,
    SECUENCIA: d.secuenciaDidactica,
    RECURSOS: d.recursosDidacticos,
    CRITERIOS: d.criteriosEvaluacion,
    INSTRUMENTO: d.instrumento,
    EVIDENCIA: d.evidenciaAprendizaje,

     PIE_SESTIA: "Documento generado automáticamente mediante SestIA – ERES",
     pie_sestia: "Documento generado automáticamente mediante SestIA – ERES",



  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
    }

    // Soporta { success, data } | { data } | data directo
    const json = extractData(body);
    if (!json) {
      return NextResponse.json({ error: "Estructura JSON vacía" }, { status: 400 });
    }

    // Tu pipeline original → plano
    const dataPlano = transformarAPlano(json);
    const templateData = buildTemplateData(dataPlano);

    // Leer la plantilla desde /public
    const templatePath = path.resolve("public", "plantilla-sesion.docx");
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: "No se encontró la plantilla en /public/plantilla-sesion.docx" },
        { status: 500 }
      );
    }
    const templateBinary = fs.readFileSync(templatePath, "binary");

    const zip = new PizZip(templateBinary);

    // Importante: delimitadores de **llave simple** {TOKEN}
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{", end: "}" },
    });

    doc.setData(templateData);

    try {
      doc.render();
    } catch (error: any) {
      // Docxtemplater suele traer info útil en error.properties
      return NextResponse.json(
        {
          error: error?.message ?? "Error al renderizar DOCX",
          detalle: error?.properties ?? error,
        },
        { status: 500 }
      );
    }

    // Generar DOCX como Buffer y convertir a ArrayBuffer (mantengo tu salida)
    const buffer: Buffer = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
    const arrayBuffer = bufferToArrayBuffer(buffer);

    const MIME =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": MIME,
        "Content-Disposition": "attachment; filename=sesion-generada.docx",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error desconocido en exportarWord" },
      { status: 500 }
    );
  }
}
