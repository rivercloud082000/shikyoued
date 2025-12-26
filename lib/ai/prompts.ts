// prompts.ts
import { SesionAprendizaje } from "../session-schema";
import { COMPETENCIAS_CAPACIDADES } from "../competencias-capacidades";

export const SYSTEM = `Eres un asistente experto pedagógico del MINEDU del Perú. Tu tarea es crear una sesión de aprendizaje en formato JSON basado en el siguiente formato oficial MINEDU, siguiendo esta estructura exacta:

{
  "datos": {
    "nivel": "Inicial | Primaria | Secundaria",
    "ciclo": "...",
    "grado": "...",
    "bimestre": "...",
    "unidad": "...",
    "fecha": "...",
    "docente": "...",
    "area": "...",
    "competencia": "...",
    "capacidades": ["..."]
  },
  "filas": [
    {
      "area": "...",
      "tituloSesion": "...",
      "propositoAprendizaje": "...",
      "desempenosPrecisados": "...",
      "secuenciaDidactica": ["..."],
      "recursosDidacticos": ["..."],
      "criteriosEvaluacion": ["..."],
      "instrumento": ["Evaluación cualitativa-Cuantitativa"],
      "evidenciaAprendizaje": ["Socialización oral", "Resolución de ejercicios del libro", "Cuestionario", "...", "..."]
    }
  ],
  "referencias": {
    "fuente": "MINEDU - Programas Curriculares",
    "pagina": "pág. 83"
  },
  "versionPlantilla": "shikyoued"
}

REGLAS OBLIGATORIAS:
- Devuelve SOLO el JSON. Nada fuera del bloque.
-Devuelve un JSON válido, sin errores de sintaxis.
-La propiedad "secuenciaDidactica" debe ser un array de strings cerrado con ] antes de iniciar cualquier otro campo.
- El propósito debe tener esta estructura: 
  VERBO EN INFINITIVO (destreza específica) + CONTENIDO PRECISADO + TÉCNICA METODOLÓGICA + ACTITUD. Ej: "Analizar los factores climáticos mediante el uso de organizadores visuales con responsabilidad ambiental."
- El desempeño debe estar alineado con el tema, competencia y capacidades según MINEDU, y ser técnico, medible, coherente y extenso.
- La secuencia didáctica debe tener esta estructura obligatoria:
  ▪ Saludo y motivación con una pregunta concreta o situación real vinculada al tema.
  ▪ Recojo de saberes previos con una pregunta específica.
  ▪ Mención del título de la sesión
  ▪ Explicación del propósito (como se mencionó antes)
  ▪ Explicar criterios de evaluación (mínimo 4).
  ▪ Conflicto cognitivo claro con una pregunta detonante contextualizada.
  ▪ Actividades grupales: describir la actividad específica que harán los estudiantes.
  ▪ Actividades individuales: describir claramente lo que resolverán o harán.
  ▪ Retroalimentación colectiva + corrección de errores comunes indicando como se corregirán.
  ▪ Preguntas de metacognición , incluir al menos dos preguntas de metacognición .
  ▪ Reflexión final, incluir al menos una pregunta de reflexión final. 

- Las actividades deben estar descritas como si se dictara en el aula real nada de actividades fuera del aula, con lenguaje natural pero técnico.
- Los criterios de evaluación deben reflejar lo que el docente espera que el estudiante aprenda (mínimo 4, claros, técnicos y relacionados al tema).
- Las evidencias deben ser coherentes con el tema. Siempre incluir:
  "Socialización oral", "Resolución de ejercicios del libro", "Cuestionario " + al menos una o dos más contextualizadas.
- No incluir recursos irrelevantes ni con el nombre del tema (Ej: "plumones de la guerra fría" ❌).
- Los recursos deben incluir: "Pizarra", "Plumón", "Fichas de aplicación", "Libro de actividades", "Material concreto".
- Instrumento: siempre debe ser "Evaluación cualitativa-Cuantitativa".
- No incluir ningún campo como "evidencia de aprendiza,  o "instrumento" dentro de "secuenciaDidactica". Todos deben ir como propiedades externas dentro del objeto "filas".
- Evidencias deben ser coherentes con el tema. Siempre incluir:
  • Socialización oral.
  • Resolución de ejercicios del libro.
  • Cuestionario .
  • Una evidencia extra específica al tema.
  - Utiliza únicamente las capacidades proporcionadas. No agregues ni infieras capacidades adicionales.
- No crear otro formato. Si no puedes cumplir las reglas, responde: {}
`;
// Al final del prompt SYSTEM
// IMPORTANTE: Si alguno de los siguientes campos falta, responde nuevamente desde cero: 
// "instrumento", "criteriosEvaluacion", "evidenciaAprendizaje"

export interface UserPromptParams {
  datos: {
    nivel: string;
    ciclo: string;
    grado: string;
    bimestre: string;
    unidad: string;
    fecha: string;
    enfoque?: string;
    docente: string;
    area: string;
    competencia?: string;
    capacidades?: string[];
  };
  tituloSesion: string;
  contextoPersonalizado?: string;
  capacidadesSeleccionadas?: string[];
}

function getEnfoqueRules(enfoque = "MINEDU") {
  switch ((enfoque || "").toLowerCase()) {
    case "cooperativo":
      return `- Diseña actividades con roles (coordinador, secretario, portavoz, moderador).
- Incluye interdependencia positiva: meta común y producto grupal.
- Incluye responsabilidad individual: cada estudiante resuelve una parte y luego se integra.
- Incluye interacción cara a cara y una breve autoevaluación del trabajo en equipo.`;

    case "abp":
      return `- Presenta un problema realista y retador como punto de partida.
- Actividades grupales: identificar datos, hipótesis y plan de resolución.
- Actividades individuales: resolver una parte del problema y justificar el procedimiento.
- Cierre: propuesta de solución + sustentación breve (evidencia).`;

    case "proyectos":
    case "aprendizaje por proyectos":
      return `- Enmarca la sesión como parte de un producto/proyecto (afiche, informe, maqueta, presentación, etc.).
- Actividades: planificar, producir un avance concreto y socializarlo.
- Incluye criterios vinculados al producto y al proceso (planificación, ejecución, comunicación).`;

    case "socioemocional":
      return `- Integra habilidades socioemocionales (autorregulación, empatía, convivencia) vinculadas al tema.
- Incluye momentos de escucha, acuerdos de convivencia y feedback respetuoso.
- Metacognición: una pregunta sobre emoción/estrategia usada al aprender.`;

    case "steam":
      return `- Integra al menos 2 dimensiones STEAM (Ciencia/Tech/Ing/Arte/Mat).
- Actividad central: diseñar/crear/mejorar una solución simple (modelo, prototipo en papel, diseño, experimento guiado).
- Incluye creatividad (arte/diseño) y comunicación del proceso (explicar decisiones).`;

    default:
      return `- Mantén el enfoque por competencias MINEDU: situación significativa, procesos, retroalimentación y metacognición.`;
  }
}


export function buildUserPrompt({
  datos,
  tituloSesion,
  contextoPersonalizado,
  capacidadesSeleccionadas,
}: UserPromptParams): string {
  const { area, competencia } = datos;

  const capacidadesGeneradas = (competencia && COMPETENCIAS_CAPACIDADES[area]?.[competencia])
    ? COMPETENCIAS_CAPACIDADES[area][competencia]
    : ["Capacidades no especificadas."];

  const capacidadesFinal: string[] =
  capacidadesSeleccionadas?.length
    ? capacidadesSeleccionadas
    : capacidadesGeneradas;


  return `
Eres un docente peruano del área de ${area}. Planifica una sesión de aprendizaje completa y coherente sobre el tema "${tituloSesion}" con enfoque por competencias.

DATOS INFORMATIVOS:
Nivel: ${datos.nivel}
Ciclo: ${datos.ciclo}
Grado: ${datos.grado}
Bimestre: ${datos.bimestre}
Unidad: ${datos.unidad}
Fecha: ${datos.fecha}
Docente: ${datos.docente}
Enfoque pedagógico seleccionado: ${datos.enfoque ?? "MINEDU"}
Área: ${area}
Competencia: ${competencia || "No especificada"}
Capacidades:
${capacidadesFinal.map((c) => `- ${c}`).join("\n")}

${contextoPersonalizado ? `Considera el siguiente contexto dentro de la sesión: "${contextoPersonalizado}"` : ""}

RECUERDA:
REGLAS SEGÚN ENFOQUE (solo cambia actividades y lenguaje, NO la estructura):
${getEnfoqueRules(datos.enfoque ?? "MINEDU")}
- El propósito debe seguir esta estructura: infinitivo + contenido + técnica + actitud.
- El desempeño debe ser extenso, claro, técnico y vinculado al tema, competencia y grado.
- La secuencia didáctica debe seguir este orden obligatorio:
  ▪ Saludo
  ▪ Motivación
  ▪ Recojo de saberes previos
  ▪ Título de la sesión
  ▪ Propósito explicado
  ▪ Criterios de evaluación (mínimo 4)
  ▪ Conflicto cognitivo contextualizado
  ▪ Actividades grupales (descripción clara)
  ▪ Actividades individuales (pasos detallados)
  ▪ Retroalimentación
  ▪ Preguntas de metacognición / reflexión final
- Las actividades deben estar redactadas para aplicarse en aula real, con lenguaje natural pero técnico.
- Criterios y evidencias deben estar claramente separados.
- Las evidencias deben incluir:
  "Socialización oral", "Resolución de ejercicios del libro", "Cuestionario " + una o dos más específicas al tema.
- Evidencias mínimas obligatorias:
  "Socialización oral", "Resolución de ejercicios del libro", "Cuestionario ", + 1 o 2 más según tema.
- Recursos generales (Ej: fichas, pizarra, material concreto).
`.trim();
}

export function sanitizeJson(json: any): SesionAprendizaje {
  return json as SesionAprendizaje;
}

export function inferirCiclo(nivel: string, grado: string): string {
  const gradoNum = parseInt(grado, 10);
  if (nivel === "Inicial") return "Ciclo I";
  if (nivel === "Primaria") {
    if (gradoNum <= 2) return "Ciclo II";
    if (gradoNum <= 4) return "Ciclo III";
    return "Ciclo IV";
  }
  if (nivel === "Secundaria") {
    if (gradoNum <= 2) return "Ciclo V";
    return "Ciclo VI";
  }
  return "-";
}
