"use client";

import { useState, useEffect, useRef } from "react";
import { COMPETENCIAS_CAPACIDADES } from "../../lib/competencias-capacidades";
import LoadingOverlay from "../../components/LoadingOverlay";

export default function AppPage() {
  const [formulario, setFormulario] = useState({
    tituloSesion: "",
    unidad: "",
    grado: "",
    nivel: "",
    bimestre: "",
    fecha: "",
    docente: "",
    area: "",
    competencia: "",
    capacidades: [] as string[],
    provider: "cohere",
  });

  const [competenciasDisponibles, setCompetenciasDisponibles] = useState<string[]>([]);
  const [capacidadesDisponibles, setCapacidadesDisponibles] = useState<string[]>([]);
  const [jsonGenerado, setJsonGenerado] = useState<any>(null);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Evitar doble envío (React 18 StrictMode duplica algunos efectos en dev)
  const isSubmitting = useRef(false);

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
  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 60_000) => {
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

  // ==== SUBMIT ====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return; // evita doble submit
    isSubmitting.current = true;

    setError("");
    setJsonGenerado(null);
    setLoading(true);

    try {
      const res = await fetchWithTimeout(
        "/api/generar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ datos: formulario, provider: formulario.provider }),
        },
        90_000 // ajusta si tu backend tarda más
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

  // ==== DESCARGA WORD ====
  const descargarWord = async () => {
    if (!jsonGenerado) return;
    setDescargando(true);
    try {
      const res = await fetch("/api/exportarWord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonGenerado),
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

  return (
    <>
      <LoadingOverlay show={loading} />

      <div
        className="min-h-screen bg-cover bg-center p-6"
        style={{ backgroundImage: "url('/giffy5.gif')" }}
      >
        <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md p-6 rounded">
          <h1 className="text-2xl font-bold mb-4">Generador de Sesiones de Aprendizaje</h1>

          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 shadow rounded">
            <input
              className="border p-2 w-full"
              placeholder="Título de la sesión"
              required
              value={formulario.tituloSesion}
              onChange={(e) => setFormulario({ ...formulario, tituloSesion: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                className="border p-2"
                placeholder="Unidad (ej: Unidad 1)"
                required
                value={formulario.unidad}
                onChange={(e) => setFormulario({ ...formulario, unidad: e.target.value })}
              />
              <input
                className="border p-2"
                placeholder="Grado (ej: 5to)"
                required
                value={formulario.grado}
                onChange={(e) => setFormulario({ ...formulario, grado: e.target.value })}
              />
              <select
                className="border p-2"
                required
                value={formulario.nivel}
                onChange={(e) => setFormulario({ ...formulario, nivel: e.target.value })}
              >
                <option value="">Selecciona un nivel</option>
                <option value="Inicial">Inicial</option>
                <option value="Primaria">Primaria</option>
                <option value="Secundaria">Secundaria</option>
              </select>
              <input
                className="border p-2"
                placeholder="Bimestre (ej: I)"
                required
                value={formulario.bimestre}
                onChange={(e) => setFormulario({ ...formulario, bimestre: e.target.value })}
              />
              <input
                className="border p-2"
                placeholder="Fecha (ej: 07/08/2025)"
                required
                value={formulario.fecha}
                onChange={(e) => setFormulario({ ...formulario, fecha: e.target.value })}
              />
              <input
                className="border p-2"
                placeholder="Docente (ej: José Valverde)"
                required
                value={formulario.docente}
                onChange={(e) => setFormulario({ ...formulario, docente: e.target.value })}
              />
            </div>

            <select
              className="border p-2 w-full"
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
              className="border p-2 w-full"
              required
              value={formulario.competencia}
              onChange={(e) => setFormulario({ ...formulario, competencia: e.target.value })}
            >
              <option value="">Selecciona una competencia</option>
              {competenciasDisponibles.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div>
              <label className="font-semibold">Capacidades (opcional):</label>
              <div className="grid grid-cols-1 md:grid-cols-2">
                {capacidadesDisponibles.map((cap) => (
                  <label key={cap} className="text-sm">
                    <input
                      type="checkbox"
                      checked={formulario.capacidades.includes(cap)}
                      onChange={(e) => {
                        setFormulario((prev) => ({
                          ...prev,
                          capacidades: e.target.checked
                            ? [...prev.capacidades, cap]
                            : prev.capacidades.filter((c) => c !== cap),
                        }));
                      }}
                    />{" "}
                    {cap}
                  </label>
                ))}
              </div>
            </div>

            <select
              className="border p-2 w-full"
              value={formulario.provider}
              onChange={(e) => setFormulario({ ...formulario, provider: e.target.value })}
            >
              <option value="cohere">Cohere</option>
              <option value="ollama-mistral">Mistral</option>
            </select>

            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              type="submit"
              disabled={loading || isSubmitting.current}
            >
              {loading ? "Generando…" : "Generar sesión"}
            </button>
          </form>

          {error && <p className="text-red-600 mt-4">{error}</p>}

          {jsonGenerado && (
            <div className="mt-6 bg-gray-100 p-4 rounded shadow space-y-2">
              <h3 className="text-lg font-bold">JSON generado</h3>
              <pre className="text-xs overflow-auto max-h-96 bg-white p-2 border">
                {JSON.stringify(jsonGenerado, null, 2)}
              </pre>

              <p className="text-sm text-gray-600">Nivel inferido: {jsonGenerado.datos?.nivel}</p>
              <p className="text-sm text-gray-600">Ciclo inferido: {jsonGenerado.datos?.ciclo}</p>

              <button
                onClick={descargarWord}
                disabled={descargando}
                className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {descargando ? "Descargando..." : "Descargar Word"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
