"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { COMPETENCIAS_CAPACIDADES } from "../../lib/competencias-capacidades";
import LoadingOverlay from "../../components/LoadingOverlay";

type Escala = "Sí" | "No" | "En proceso";

type Enfoque =
  | "MINEDU"
  | "COOPERATIVO"
  | "ABP"
  | "PROYECTOS"
  | "SOCIOEMOCIONAL"
  | "STEAM";

type Instrumentos = {
  listaCotejo: { criterio: string; escala: Escala[] }[];

  rubrica: {
    criterio: string;
    niveles: {
      inicio: string;
      enProceso: string;
      logroEsperado: string;
      destacado: string;
    };
  }[];
};

function getDataFromPayload(payload: any) {
  // Soporta: {success:true,data:{...}} o data directo
  if (!payload) return null;
  if (payload.data) return payload.data;
  if (payload.success && payload.data) return payload.data;
  return payload;
}

function getFila0(payload: any) {
  const data = getDataFromPayload(payload);
  const filas = data?.filas ?? [];
  return filas?.[0] ?? null;
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.map((s) => (s || "").trim()).filter(Boolean)));
}

function construirNivelesRubrica(criterio: string) {
  const c = (criterio || "").trim();
  const low = c.toLowerCase();
  return {
    inicio: `Presenta dificultades para ${low} y requiere acompañamiento constante.`,
    enProceso: `Logra parcialmente ${low}, con algunos errores o apoyos puntuales.`,
    logroEsperado: `Logra ${low} de manera adecuada y explica su procedimiento.`,
    destacado: `Supera lo esperado en ${low}, justifica con claridad y aplica en nuevos casos.`,
  };
}

function inferirCriteriosFallback(payload: any) {
  const fila0 = getFila0(payload) ?? {};
  const proposito = (fila0?.propositoAprendizaje ?? "").trim();
  const evidencias = uniq((fila0?.evidenciaAprendizaje ?? []) as string[]);
  const base = [
    proposito ? `Logra el propósito de aprendizaje planteado.` : "",
    evidencias[0] ? `Evidencia: ${evidencias[0]}` : "",
    evidencias[1] ? `Evidencia: ${evidencias[1]}` : "",
    "Participa activamente, respeta consignas y comunica sus ideas.",
  ];
  return uniq(base).slice(0, 4);
}

function generarInstrumentosDesdeSesion(payload: any): Instrumentos {
  const fila0 = getFila0(payload) ?? {};
  const criterios = uniq((fila0?.criteriosEvaluacion ?? []) as string[]);
  const base = criterios.length ? criterios : inferirCriteriosFallback(payload);

  const listaCotejo = base.slice(0, 6).map((c) => ({
    criterio: c,
    escala: ["Sí", "No", "En proceso"] as Escala[],


  }));

  const rubrica = base.slice(0, 6).map((c) => ({
    criterio: c,
    niveles: construirNivelesRubrica(c),
  }));

  return { listaCotejo, rubrica };
}

function normalizarKey(s: string) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .trim()
    .toLowerCase();
}








const ui = {
  shell: "min-h-screen bg-cover bg-center px-3 py-4 md:px-6 md:py-6",

  card:
    "mx-auto w-full max-w-4xl rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.35)]",

  cardInner: "p-4 md:p-5",

  title:
    "text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]",

  form: "mt-5 space-y-3",

  grid2: "grid grid-cols-1 md:grid-cols-2 gap-3",

  field:
    "w-full rounded-xl bg-white/95 text-gray-900 placeholder:text-gray-500 " +
    "border border-black/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.15),0_10px_25px_rgba(0,0,0,0.25)] " +
    "px-4 py-2.5 outline-none transition " +
    "focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500",

  select:
    "w-full rounded-xl bg-white/95 text-gray-900 " +
    "border border-black/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.15),0_10px_25px_rgba(0,0,0,0.25)] " +
    "px-4 py-2.5 outline-none transition " +
    "focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500",

  label:
    "text-white/90 font-semibold drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]",

  checkboxWrap:
    "mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-3",

  checkboxItem: "flex items-start gap-2 text-gray-800 text-sm font-medium",


  checkbox: "mt-0.5 h-4 w-4 rounded border-white/30 bg-white/80",

  btnRow: "mt-2 flex flex-wrap gap-3 items-center",

  btnBase:
    "rounded-xl px-5 py-2.5 font-semibold text-white shadow-[0_12px_25px_rgba(0,0,0,0.25)] " +
    "transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",

  btnBlue:
    "bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-700",

  btnPurple:
    "bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-700",

  btnGreen:
    "bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-700",

  section:
    "mt-5 rounded-2xl border border-white/15 bg-black/20 backdrop-blur p-4 shadow-[0_18px_40px_rgba(0,0,0,0.25)]",

  sectionTitle: "text-white font-bold text-lg",

  sectionText: "text-white/90 text-sm",

  pre:
    "mt-3 max-h-[380px] overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/90",
};





export default function AppPage() {
  const [formulario, setFormulario] = useState({
    tituloSesion: "",
    unidad: "",
    grado: "",
    nivel: "", // Primaria/Secundaria
    bimestre: "",
    fecha: "",
    docente: "",
    area: "",
    competencia: "",
    capacidades: [] as string[],
    provider: "cohere",
    enfoque: "MINEDU" as Enfoque,
  });

  const [competenciasDisponibles, setCompetenciasDisponibles] = useState<string[]>([]);
  const [capacidadesDisponibles, setCapacidadesDisponibles] = useState<string[]>([]);

  // payload que retorna /api/generar
  const [jsonGenerado, setJsonGenerado] = useState<any>(null);

  // instrumentos derivados por reglas
  const [instrumentos, setInstrumentos] = useState<Instrumentos | null>(null);

  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingInstr, setLoadingInstr] = useState(false);

  // JSON toggle
  const [showJSON, setShowJSON] = useState(false);

  // evitar doble submit
  const isSubmitting = useRef(false);

  const [descargandoInstrWord, setDescargandoInstrWord] = useState(false);


  

  useEffect(() => {
    if (formulario.area) {
      const comps = Object.keys(COMPETENCIAS_CAPACIDADES[formulario.area] || {});
      setCompetenciasDisponibles(comps);
      setFormulario((prev) => ({ ...prev, competencia: comps[0] || "", capacidades: [] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formulario.area]);

  useEffect(() => {
    if (formulario.area && formulario.competencia) {
      const caps = COMPETENCIAS_CAPACIDADES[formulario.area]?.[formulario.competencia] || [];
      setCapacidadesDisponibles(caps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formulario.competencia]);



  // ==== UTIL: combinar señales de aborto de forma segura ====
  function combineSignals(signalA?: AbortSignal, signalB?: AbortSignal) {
    if (!signalA) return signalB;
    if (!signalB) return signalA;

    const anyFn = (AbortSignal as any).any;
    if (typeof anyFn === "function") {
      return anyFn([signalA, signalB]);
    }

    const combo = new AbortController();
    const onAbortA = () => combo.abort((signalA as any).reason ?? "upstream-abort-A");
    const onAbortB = () => combo.abort((signalB as any).reason ?? "upstream-abort-B");

    if (signalA.aborted) combo.abort((signalA as any).reason ?? "upstream-abort-A");
    if (signalB.aborted) combo.abort((signalB as any).reason ?? "upstream-abort-B");

    signalA.addEventListener("abort", onAbortA);
    signalB.addEventListener("abort", onAbortB);

    (combo as any)._cleanup = () => {
      signalA.removeEventListener("abort", onAbortA);
      signalB.removeEventListener("abort", onAbortB);
    };

    return combo.signal;
  }

  // ==== UTIL: fetch con timeout robusto y motivo claro ====
  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 180_000) => {
    const localController = new AbortController();
    const localSignal = localController.signal;
    const combinedSignal = combineSignals(options.signal as AbortSignal | undefined, localSignal);

    const timeoutId = setTimeout(() => {
      try {
        (localController as any).abort?.("timeout");
        if (!localController.signal.aborted) localController.abort();
      } catch {}
    }, timeout);

    try {
      const res = await fetch(url, { ...options, signal: combinedSignal });
      return res;
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.message?.includes("aborted")) {
        throw new Error(`La solicitud se canceló por timeout (${timeout} ms).`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      const cleanup = (localController as any)._cleanup;
      if (typeof cleanup === "function") cleanup();
    }
  };

  // ==== UTIL: parseo seguro (JSON o texto) ====
  async function safeParse(res: Response) {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  // ==== SUBMIT: Generar sesión (IA) ====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    setError("");
    setJsonGenerado(null);
    setInstrumentos(null); // clave: no mezclar
    setShowJSON(false);
    setLoading(true);

    try {
      const res = await fetchWithTimeout(
        "/api/generar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ datos: formulario, provider: formulario.provider }),
        },
        190_000
      );

      const payload = await safeParse(res);

      if (!res.ok) {
        const msg = typeof payload === "string" ? payload : JSON.stringify(payload);
        throw new Error(`Error ${res.status}: ${msg || "Falla en /api/generar"}`);
      }

      setJsonGenerado(payload);
    } catch (err: any) {
      setError(err?.message || "Error desconocido al generar la sesión");
      console.error("❌ handleSubmit error:", err);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  // ==== Generar instrumentos (REGLAS, LOCAL) ====
  const generarInstrumentos = async () => {
    if (!jsonGenerado) return;
    setError("");
    setLoadingInstr(true);
    try {
      const inst = generarInstrumentosDesdeSesion(jsonGenerado);
      setInstrumentos(inst);
    } catch (err: any) {
      setError(err?.message || "Error al generar instrumentos");
      console.error("❌ generarInstrumentos error:", err);
    } finally {
      setLoadingInstr(false);
    }
  };

  // ==== DESCARGA WORD (envía sesión + instrumentos) ====
  const descargarWord = async () => {
    if (!jsonGenerado) return;
    setDescargando(true);
    try {
      const res = await fetch("/api/exportarWord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...jsonGenerado,
          instrumentos: instrumentos ?? null,
        }),
      });
      if (!res.ok) throw new Error("Error al generar el Word");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sesion.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar Word", err);
    } finally {
      setDescargando(false);
    }
  };

  const descargarWordInstrumentos = async () => {
  if (!jsonGenerado || !instrumentos) return;

  const data = getDataFromPayload(jsonGenerado);
  const fila0 = data?.filas?.[0] ?? {};
  const datos = data?.datos ?? {};

  setDescargandoInstrWord(true);
  try {
    const res = await fetch("/api/exportarInstrumentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meta: {
          tituloSesion: fila0?.tituloSesion ?? datos?.tituloSesion ?? "",
          area: fila0?.area ?? datos?.area ?? "",
          competencia: datos?.competencia ?? "",
          nivel: datos?.nivel ?? "",
          grado: datos?.grado ?? "",
          docente: datos?.docente ?? "",
        },
        instrumentos,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Error al generar el Word de instrumentos");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "instrumentos.docx";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error al descargar instrumentos", err);
  } finally {
    setDescargandoInstrWord(false);
  }
};


  const dataOnly = useMemo(() => getDataFromPayload(jsonGenerado), [jsonGenerado]);

  return (
    <>
      {/* Overlay solo para generación IA (sesión). Instrumentos es instantáneo */}
      <LoadingOverlay show={loading} />

      <div
  className={ui.shell}
  style={{ backgroundImage: "url('/giffy5.gif')" }}
>
  <div className={ui.card}>
    <div className={ui.cardInner}>
      <h1 className={ui.title}>Generador de Sesiones de Aprendizaje</h1>
      




          <form onSubmit={handleSubmit} className={ui.form}>


            <input
              className={ui.field}

              placeholder="Título de la sesión"
              required
              value={formulario.tituloSesion}
              onChange={(e) => setFormulario({ ...formulario, tituloSesion: e.target.value })}
            />

            <div className={ui.grid2}>

              <input
                className={ui.field}


                placeholder="Unidad (ej: Unidad 1)"
                required
                value={formulario.unidad}
                onChange={(e) => setFormulario({ ...formulario, unidad: e.target.value })}
              />
              <input
                className={ui.field}


                placeholder="Grado (ej: 5to)"
                required
                value={formulario.grado}
                onChange={(e) => setFormulario({ ...formulario, grado: e.target.value })}
              />

              {/* ✅ Quitamos Inicial aquí */}
              <select
                className={ui.select}


                required
                value={formulario.nivel}
                onChange={(e) => setFormulario({ ...formulario, nivel: e.target.value })}
              >
                <option value="">Selecciona un nivel</option>
                <option value="Primaria">Primaria</option>
                <option value="Secundaria">Secundaria</option>
              </select>

              <input
                className={ui.field}


                placeholder="Bimestre (ej: I)"
                required
                value={formulario.bimestre}
                onChange={(e) => setFormulario({ ...formulario, bimestre: e.target.value })}
              />
              <input
                className={ui.field}


                placeholder="Fecha (ej: 07/08/2025)"
                required
                value={formulario.fecha}
                onChange={(e) => setFormulario({ ...formulario, fecha: e.target.value })}
              />
              <input
                className={ui.field}


                placeholder="Docente (ej: José Valverde)"
                required
                value={formulario.docente}
                onChange={(e) => setFormulario({ ...formulario, docente: e.target.value })}
              />
            </div>

            {/* ✅ NUEVO: Enfoque */}
            <select
              className={ui.select}


              value={formulario.enfoque}
              onChange={(e) => setFormulario({ ...formulario, enfoque: e.target.value as Enfoque })}
            >
              <option value="MINEDU">MINEDU (default)</option>
              <option value="COOPERATIVO">Cooperativo</option>
              <option value="ABP">ABP</option>
              <option value="PROYECTOS">Proyectos</option>
              <option value="SOCIOEMOCIONAL">Socioemocional</option>
              <option value="STEAM">STEAM</option>
            </select>

            <select
              className={ui.select}


              required
              value={formulario.area}
              onChange={(e) => setFormulario({ ...formulario, area: e.target.value })}
            >
              <option value="">Selecciona un área</option>
              {Object.keys(COMPETENCIAS_CAPACIDADES).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
  className={ui.select}
  value={formulario.competencia}
  onChange={(e) =>
    setFormulario((prev) => ({
      ...prev,
      competencia: e.target.value,
      capacidades: [],
    }))
  }
  disabled={!formulario.area || competenciasDisponibles.length === 0}
  required
>


              <option value="">Selecciona una competencia</option>
              {competenciasDisponibles.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className={ui.checkboxWrap}>
  <label className={ui.label}>Capacidades (opcional):</label>

  {capacidadesDisponibles.map((cap) => (
    <label key={cap} className={ui.checkboxItem}>
      <input
        type="checkbox"
        className={ui.checkbox}
        checked={formulario.capacidades.includes(cap)}
        onChange={(e) => {
          setFormulario((prev) => ({
            ...prev,
            capacidades: e.target.checked
              ? [...prev.capacidades, cap]
              : prev.capacidades.filter((c) => c !== cap),
          }));
        }}
      />
      <span>{cap}</span>
    </label>
  ))}
</div>


            <select
              className={ui.select}


              value={formulario.provider}
              onChange={(e) => setFormulario({ ...formulario, provider: e.target.value })}
            >
              <option value="cohere">Cohere</option>
              <option value="ollama-mistral">Mistral</option>
            </select>

            {/* ✅ Botones separados */}
            <div className={ui.btnRow}>
  <button
    className={`${ui.btnBase} ${ui.btnBlue}`}
    type="submit"
    disabled={loading || isSubmitting.current}
  >
    {loading ? "Generando…" : "Generar sesión"}
  </button>

  <button
    type="button"
    onClick={generarInstrumentos}
    disabled={!jsonGenerado || loadingInstr}
    className={`${ui.btnBase} ${ui.btnPurple}`}
  >
    {loadingInstr ? "Creando instrumentos…" : "Generar instrumentos"}
  </button>

  <button
    type="button"
    onClick={descargarWordInstrumentos}
    disabled={!instrumentos || descargandoInstrWord}
    className={`${ui.btnBase} ${ui.btnGreen}`}
  >
    {descargandoInstrWord ? "Descargando..." : "Descargar Instrumentos (Word)"}
  </button>

  <button
    type="button"
    onClick={descargarWord}
    disabled={!jsonGenerado || descargando}
    className={`${ui.btnBase} ${ui.btnGreen}`}
  >
    {descargando ? "Descargando..." : "Descargar Word"}
  </button>
</div>

          </form>

          {error && <p className="text-red-600 mt-4">{error}</p>}

          {jsonGenerado && (
  <div className={ui.section}>
    <div className="flex items-center justify-between">
      <h3 className={ui.sectionTitle}>Sesión generada</h3>

      <button
        type="button"
        onClick={() => setShowJSON((v) => !v)}
        className="text-sm text-white/90 underline hover:text-white"
      >
        {showJSON ? "Ocultar JSON" : "Ver detalles (JSON)"}
      </button>
    </div>

    <p className={ui.sectionText}>
      <b>Nivel inferido:</b> {dataOnly?.datos?.nivel ?? ""}
    </p>
    <p className={ui.sectionText}>
      <b>Ciclo inferido:</b> {dataOnly?.datos?.ciclo ?? ""}
    </p>

    {instrumentos && (
      <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
        <h4 className="text-white font-semibold">Instrumentos (por reglas)</h4>
        <p className="text-white/80 text-sm">
          Lista de cotejo: {instrumentos.listaCotejo.length} criterios · Rúbrica:{" "}
          {instrumentos.rubrica.length} criterios
        </p>
      </div>
    )}

    {showJSON && (
      <pre className={ui.pre}>
        {JSON.stringify(jsonGenerado, null, 2)}
      </pre>
    )}
  </div>
)}

              </div>
    </div>
  </div>
</>
  );
}

