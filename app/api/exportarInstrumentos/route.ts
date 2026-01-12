import { NextResponse } from "next/server";
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

export const runtime = "nodejs";

/* =======================
 * Tipos según tu frontend
 * ======================= */

type Escala = "Sí" | "No" | "En proceso";

type ListaCotejoItem = {
  criterio: string;
  escala: Escala[];
};

type RubricaNiveles = {
  inicio: string;
  enProceso: string;
  logroEsperado: string;
  destacado: string;
};

type RubricaItem = {
  criterio: string;
  niveles: RubricaNiveles;
};

type InstrumentosPayload = {
  listaCotejo: ListaCotejoItem[];
  rubrica: RubricaItem[];
};

type Meta = {
  tituloSesion?: string;
  area?: string;
  competencia?: string;
  nivel?: string;
  grado?: string;
  docente?: string;
  tipoInstrumento?: string;
};

type RequestBody = {
  meta?: Meta;
  instrumentos?: InstrumentosPayload | null;
  tipoInstrumento?: string; // "lista_cotejo", "rubrica_analitica", etc.
};

/* =======================
 * Helpers comunes DOCX
 * ======================= */

function safeText(value: unknown): string {
  return String(value ?? "").trim();
}

function titleCenter(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 250 },
    children: [new TextRun({ text, bold: true })],
  });
}

function metaLine(label: string, value: string, after = 0) {
  return new Paragraph({
    spacing: { after },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun(value || "-"),
    ],
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    spacing: { before: 200, after: 150 },
    children: [new TextRun({ text, bold: true })],
  });
}

function cell(text: string, bold = false) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold })],
      }),
    ],
  });
}

function firma() {
  return new Paragraph({
    spacing: { before: 300 },
    children: [
      new TextRun({ text: "Firma del docente: " }),
      new TextRun({ text: "____________________________" }),
    ],
  });
}

/* =======================
 * Etiquetas por tipo
 * ======================= */

const LABELS: Record<string, string> = {
  lista_cotejo: "Lista de cotejo",
  rubrica_analitica: "Rúbrica analítica",
  guia_observacion: "Guía de observación",
  escala_valoracion: "Escala de valoración",
  registro_anecdotico: "Registro anecdótico",
  diario_campo: "Diario de campo",
  lista_verificacion: "Lista de verificación",
  ficha_seguimiento: "Ficha de seguimiento",
};

type ChecklistMode =
  | "cotejo"
  | "verificacion"
  | "guia"
  | "ficha"
  | "registro"
  | "escala";

function pickMode(key: string): ChecklistMode {
  switch (key) {
    case "lista_cotejo":
      return "cotejo";
    case "lista_verificacion":
      return "verificacion";
    case "escala_valoracion":
      return "escala";
    case "registro_anecdotico":
      return "registro";
    case "ficha_seguimiento":
      return "ficha";
    case "guia_observacion":
    case "diario_campo":
    default:
      return "guia";
  }
}

/* =======================
 * Plantillas
 * ======================= */

// A) Checklist (lista de cotejo / verificación / guía / escala / etc.)
function buildChecklistDoc(params: {
  titulo: string;
  tipo: string;
  instrucciones: string;
  fecha: string;
  items: { indicador: string; evidencia?: string }[];
  mode: ChecklistMode;
}) {
  const { titulo, tipo, instrucciones, fecha, items, mode } = params;

  const rows: TableRow[] = [];

  if (mode === "cotejo" || mode === "verificacion") {
    rows.push(
      new TableRow({
        children: [
          cell("N°", true),
          cell("Indicador", true),
          cell("Sí", true),
          cell("No", true),
          cell("Observaciones", true),
        ],
      })
    );

    items.forEach((it, idx) => {
      rows.push(
        new TableRow({
          children: [
            cell(String(idx + 1)),
            cell(safeText(it.indicador) || "-"),
            cell(""),
            cell(""),
            cell(""),
          ],
        })
      );
    });
  } else if (mode === "escala") {
    rows.push(
      new TableRow({
        children: [
          cell("N°", true),
          cell("Indicador", true),
          cell("Siempre", true),
          cell("A veces", true),
          cell("Nunca", true),
          cell("Observaciones", true),
        ],
      })
    );

    items.forEach((it, idx) => {
      rows.push(
        new TableRow({
          children: [
            cell(String(idx + 1)),
            cell(safeText(it.indicador) || "-"),
            cell(""),
            cell(""),
            cell(""),
            cell(""),
          ],
        })
      );
    });
  } else if (mode === "registro") {
    rows.push(
      new TableRow({
        children: [
          cell("N°", true),
          cell("Hecho / situación", true),
          cell("Descripción", true),
          cell("Interpretación", true),
          cell("Acuerdo / acción", true),
        ],
      })
    );

    items.forEach((it, idx) => {
      rows.push(
        new TableRow({
          children: [
            cell(String(idx + 1)),
            cell(safeText(it.indicador) || "-"),
            cell(safeText(it.evidencia) || "-"),
            cell(""),
            cell(""),
          ],
        })
      );
    });
  } else {
    // guía / ficha / diario genérico
    rows.push(
      new TableRow({
        children: [
          cell("N°", true),
          cell("Indicador (acción observable)", true),
          cell("Evidencia / cómo se recogerá", true),
          cell("Observaciones", true),
        ],
      })
    );

    items.forEach((it, idx) => {
      rows.push(
        new TableRow({
          children: [
            cell(String(idx + 1)),
            cell(safeText(it.indicador) || "-"),
            cell(safeText(it.evidencia) || "-"),
            cell(""),
          ],
        })
      );
    });
  }

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });

  return new Document({
    sections: [
      {
        children: [
          titleCenter("INSTRUMENTO DE EVALUACIÓN"),
          metaLine("Título del instrumento", titulo),
          metaLine("Tipo de instrumento", tipo),
          metaLine("Instrucciones", instrucciones || "-"),
          metaLine("Fecha", fecha || "-", 200),
          sectionHeading("Registro / Ítems:"),
          table,
          firma(),
        ],
      },
    ],
  });
}

// B) Rúbrica analítica
function buildRubricDoc(params: {
  titulo: string;
  tipo: string;
  instrucciones: string;
  fecha: string;
  criterios: {
    criterio: string;
    inicio: string;
    proceso: string;
    logro: string;
    destacado: string;
  }[];
}) {
  const { titulo, tipo, instrucciones, fecha, criterios } = params;

  const rows: TableRow[] = [
    new TableRow({
      children: [
        cell("Criterio", true),
        cell("Inicio", true),
        cell("Proceso", true),
        cell("Logro", true),
        cell("Destacado", true),
      ],
    }),
  ];

  criterios.forEach((c) => {
    rows.push(
      new TableRow({
        children: [
          cell(safeText(c.criterio) || "-"),
          cell(safeText(c.inicio) || "-"),
          cell(safeText(c.proceso) || "-"),
          cell(safeText(c.logro) || "-"),
          cell(safeText(c.destacado) || "-"),
        ],
      })
    );
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });

  return new Document({
    sections: [
      {
        children: [
          titleCenter("INSTRUMENTO DE EVALUACIÓN"),
          metaLine("Título del instrumento", titulo),
          metaLine("Tipo de instrumento", tipo),
          metaLine("Instrucciones", instrucciones || "-"),
          metaLine("Fecha", fecha || "-", 200),
          sectionHeading("Rúbrica (niveles de logro):"),
          table,
          firma(),
        ],
      },
    ],
  });
}

/* =======================
 * Route principal
 * ======================= */

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

    const meta = body.meta ?? {};
    const instrumentos = body.instrumentos;
    const tipoKey = body.tipoInstrumento ?? meta.tipoInstrumento ?? "lista_cotejo";

    if (!instrumentos) {
      return NextResponse.json(
        { success: false, error: "Faltan instrumentos para exportar." },
        { status: 400 }
      );
    }

    const tipoLabel = LABELS[tipoKey] ?? "Lista de cotejo";

    const tituloSesion = safeText(meta.tituloSesion) || "Sesión de aprendizaje";
    const fecha = "";

    let doc: Document;

    if (tipoKey === "rubrica_analitica") {
      // Usamos tu rubrica local
      const criterios = (instrumentos.rubrica ?? []).map((r) => ({
        criterio: safeText(r.criterio),
        inicio: safeText(r.niveles.inicio),
        proceso: safeText(r.niveles.enProceso),
        logro: safeText(r.niveles.logroEsperado),
        destacado: safeText(r.niveles.destacado),
      }));

      doc = buildRubricDoc({
        titulo: `${tipoLabel} – ${tituloSesion}`,
        tipo: tipoLabel,
        instrucciones:
          "Complete la rúbrica según el nivel de logro observado en cada criterio.",
        fecha,
        criterios,
      });
    } else {
      // Para todo lo demás usamos la lista de cotejo como base
      const lista = instrumentos.listaCotejo ?? [];

      const items = lista.map((it) => ({
        indicador: safeText(it.criterio),
        evidencia: "",
      }));

      const mode = pickMode(tipoKey);

      doc = buildChecklistDoc({
        titulo: `${tipoLabel} – ${tituloSesion}`,
        tipo: tipoLabel,
        instrucciones:
          "Complete según lo observado en las actividades de la sesión.",
        fecha,
        items,
        mode,
      });
    }

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    const filename = `Instrumento_${tipoKey || "sesion"}.docx`;

    return new Response(uint8, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Error exportando instrumentos.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
