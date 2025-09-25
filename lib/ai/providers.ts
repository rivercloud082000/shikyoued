// lib/ai/providers.ts

const COHERE_API_KEY = process.env.COHERE_API_KEY!;
const OLLAMA_API_URL =
  (process.env.OLLAMA_HOST || "http://localhost:11434") + "/api/chat";

/**
 * Selecciona el modelo de Cohere desde .env y aplica fallbacks si el alias está retirado.
 * Default recomendado: `command-a-03-2025`.
 * Snapshots válidos para compatibilidad: `command-r-08-2024`, `command-r-plus-08-2024`.
 */
const COHERE_MODEL: string = (() => {
  const raw = (process.env.COHERE_MODEL || "").trim();
  if (!raw) return "command-a-03-2025";
  if (/^command-r-plus$/i.test(raw)) return "command-r-plus-08-2024";
  if (/^command-r$/i.test(raw)) return "command-r-08-2024";
  return raw;
})();

interface GenerateOptions {
  provider: "cohere" | "ollama-mistral";
  system: string;
  prompt: string;
  temperature?: number;
}

/** Llama a Cohere (endpoint chat) pidiendo JSON puro */
async function callCohere({
  model,
  system,
  prompt,
  temperature,
}: {
  model: string;
  system: string;
  prompt: string;
  temperature: number;
}) {
  const resp = await fetch("https://api.cohere.ai/v1/chat", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${COHERE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      // prompt del usuario
      message: prompt,
      // “system prompt” (Cohere usa `preamble`)
      preamble: system,
      // opciones livianas
      chat_history: [],
      prompt_truncation: "auto",
      connectors: [],
      // Forzamos JSON válido
      response_format: { type: "json_object" },
      max_tokens: 1200,
    }),
  });

  // Intenta parsear JSON; si falla, lanza
  let json: any;
  try {
    json = await resp.json();
  } catch {
    throw new Error("Cohere respondió con un payload no-JSON.");
  }

  if (!resp.ok) {
    const msg = json?.message || json?.error || JSON.stringify(json);
    throw new Error(msg);
  }

  // Cohere puede devolver `text` o `output_text` según el modelo/snapshot
  const text: string = json?.text || json?.output_text || "";
  if (!text) throw new Error("Cohere respondió vacío.");
  return text.trim();
}

/**
 * Genera la sesión con el proveedor elegido.
 * Devuelve string (JSON en texto). Si necesitas el objeto, haz JSON.parse en la capa que llama.
 */
export async function generateSessionJSON({
  provider,
  system,
  prompt,
  temperature = 0.3,
}: GenerateOptions): Promise<string> {
  if (provider === "cohere") {
    try {
      // Intento con el modelo configurado/ajustado
      return await callCohere({
        model: COHERE_MODEL,
        system,
        prompt,
        temperature,
      });
    } catch (e: any) {
      const msg = String(e?.message || e);

      // Si el modelo fue retirado o desconocido, probamos con una lista de fallbacks vigentes
      if (/was removed|unknown model|not found/i.test(msg)) {
        const fallbacks = [
          "command-a-03-2025",
          "command-r-08-2024",
          "command-r-plus-08-2024",
        ];
        for (const m of fallbacks) {
          if (m !== COHERE_MODEL) {
            try {
              return await callCohere({ model: m, system, prompt, temperature });
            } catch {
              // probamos el siguiente
            }
          }
        }
      }

      console.error("❌ Error en Cohere:", msg);
      throw new Error("Error en la respuesta de Cohere.");
    }
  }

  if (provider === "ollama-mistral") {
    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature,
        stream: false,
      }),
    });

    let json: any;
    try {
      json = await response.json();
    } catch {
      console.error("❌ Error en Ollama: payload no-JSON");
      throw new Error("Error en la respuesta de Ollama.");
    }

    if (!response.ok || !json.message?.content) {
      console.error("❌ Error en Ollama:", json);
      throw new Error("Error en la respuesta de Ollama.");
    }

    return (json.message.content as string).trim();
  }

  throw new Error("Proveedor no soportado");
}
