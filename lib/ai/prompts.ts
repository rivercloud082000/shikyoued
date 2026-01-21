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
      "instrumento": ["..."],
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
- Devuelve un JSON válido, sin errores de sintaxis.
- La propiedad "secuenciaDidactica" debe ser un array de strings cerrado con ] antes de iniciar cualquier otro campo.

- El propósito debe tener esta estructura: 
  VERBO EN INFINITIVO (destreza específica) + CONTENIDO PRECISADO + TÉCNICA METODOLÓGICA + ACTITUD.
  Ej: "Analizar los factores climáticos mediante el uso de organizadores visuales con responsabilidad ambiental."
  - El propósito no debe variar de esa lógica y debe seguir siempre la estructura indicada.

- El campo "desempenosPrecisados" debe ser un SOLO TEXTO (no lista) que:
  • Esté alineado con el tema, la competencia y las capacidades según MINEDU.  
  • Sea observable, medible, técnico, coherente y suficientemente extenso.  
  • Incluya explícitamente:
    1) La ACCIÓN principal del estudiante en infinitivo + objeto (qué hace exactamente).  
    2) El CONTEXTO o situación concreta donde actúa (vida diaria, aula, comunidad, etc.).  
    3) Las CAPACIDADES involucradas (mención explícita de las capacidades que moviliza).  
    4) Un EJEMPLO APLICADO corto que muestre la acción en una situación real.
  • Debe redactarse como un párrafo de 4 a 6 oraciones, no como una lista de viñetas.

  Ejemplo tipo (Matemática – problemas de cantidad, solo como modelo de estilo, NO copiar literalmente):
  "Traduce situaciones de la vida diaria relacionadas con compras, descuentos y repartos a expresiones numéricas que involucran números naturales y decimales, seleccionando operaciones adecuadas y verificando sus resultados. Para ello, moviliza capacidades como traducir situaciones a expresiones numéricas, usar estrategias de cálculo y comunicar sus procedimientos. Por ejemplo, al comprar en la tienda del barrio, calcula el costo total de varios productos, aplica un descuento simple y determina el vuelto que debe recibir, explicando cómo llegó a su resultado."

  Ejemplo tipo (Comunicación – oralidad, solo como modelo de estilo):
  "Recupera hechos, ideas principales y detalles relevantes de diálogos sobre tradiciones de su comunidad, identificando expresiones con sentido figurado y sinónimos claves que usan sus interlocutores. Moviliza capacidades como recuperar información, inferir significados y organizar sus ideas para comunicar lo comprendido. Por ejemplo, luego de escuchar un diálogo familiar sobre una festividad local, resume lo esencial de lo escuchado y explica con sus propias palabras el significado de expresiones propias de su cultura."

- La secuencia didáctica debe tener esta estructura obligatoria:
  ▪ Saludo y motivación con una pregunta concreta o situación real vinculada al tema.
  ▪ Recojo de saberes previos con una pregunta específica.
  ▪ Mención del título de la sesión.
  ▪ Explicación del propósito (como se mencionó antes).
  ▪ Explicación del contenido o tema central utilizando estrategias de enseñanza acordes al enfoque seleccionado (por ejemplo: modelamiento, resolución guiada de ejemplos, uso de analogías, organizadores visuales, experimentos demostrativos, estudio de casos, etc.), antes de que los estudiantes realicen las actividades grupales e individuales.
  ▪ Explicar criterios de evaluación (mínimo 4).
  ▪ Conflicto cognitivo claro con una pregunta detonante contextualizada.
  ▪ Actividades grupales: describir la actividad específica que harán los estudiantes.
  ▪ Actividades individuales: describir claramente lo que resolverán o harán.
  ▪ Retroalimentación colectiva + corrección de errores comunes indicando cómo se corregirán.
  ▪ Preguntas de metacognición, incluir al menos dos preguntas de metacognición.
  ▪ Reflexión final, incluir al menos una pregunta de reflexión final. 

- La explicación del contenido debe describir cómo el docente desarrolla las ideas clave del tema en el aula (estrategias, ejemplos, andamiajes, organizadores, demostraciones, etc.) de manera coherente con el enfoque pedagógico seleccionado.

- Las actividades deben estar descritas como si se dictara en el aula real, nada de actividades fuera del aula, con lenguaje natural pero técnico.
- Los criterios de evaluación deben reflejar lo que el docente espera que el estudiante aprenda (mínimo 4, claros, técnicos y relacionados al tema).
- Las evidencias deben ser coherentes con el tema. Siempre incluir:
  "Socialización oral", "Resolución de ejercicios del libro", "Cuestionario " + al menos una o dos más contextualizadas.
- No incluir recursos irrelevantes ni con el nombre del tema (Ej: "plumones de la guerra fría" ❌).
- Los recursos deben incluir: "Pizarra", "Plumón", "Fichas de aplicación", "Libro de actividades", "Material concreto".
- El campo "instrumento" debe ser un ARREGLO con un solo string que indique SOLO el tipo de instrumento elegido por el docente.
  Ejemplos válidos:
  ["Lista de cotejo"]
  ["Rúbrica analítica"]
  ["Guía de observación"]
  ["Escala de valoración"]
  No agregues textos como "Evaluación cualitativa-Cuantitativa" en este campo.

- El instrumento de evaluación y los criterios formulados deben estar directamente alineados con las actividades trabajadas en el desarrollo de la sesión (actividades grupales e individuales) y con las evidencias planteadas. No diseñes instrumentos que evalúen algo que no se haya trabajado en la secuencia didáctica.

- No incluir ningún campo como "evidencia de aprendiza" o "instrumento" dentro de "secuenciaDidactica". Todos deben ir como propiedades externas dentro del objeto "filas".
- Evidencias deben ser coherentes con el tema. Siempre incluir:
  • Socialización oral.
  • Resolución de ejercicios del libro.
  • Cuestionario.
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

function getInstrumentoConfig(tipo: string | undefined) {
  const t = (tipo || "").toLowerCase();

  if (t === "rubrica_analitica") {
    return {
      nombre: "Rúbrica analítica",
      instruccion: `En el campo "instrumento" del JSON escribe exactamente: ["Rúbrica analítica"].
Los criterios de evaluación deben poder descomponerse en niveles de logro (inicio, en proceso, esperado, destacado).`,
    };
  }

  if (t === "guia_observacion") {
    return {
      nombre: "Guía de observación",
      instruccion: `En el campo "instrumento" del JSON escribe exactamente: ["Guía de observación"].
Los criterios de evaluación deben centrarse en conductas observables durante la actividad.`,
    };
  }

  if (t === "escala_valoracion") {
    return {
      nombre: "Escala de valoración",
      instruccion: `En el campo "instrumento" del JSON escribe exactamente: ["Escala de valoración"].
Los criterios deben estar pensados para una escala (por ejemplo: Nunca / A veces / Casi siempre / Siempre).`,
    };
  }

  if (t === "registro_anecdotico") {
    return {
      nombre: "Registro anecdótico",
      instruccion: `En el campo "instrumento" del JSON escribe exactamente: ["Registro anecdótico"].
Los criterios deben describir qué situaciones se registrarán como anécdotas significativas del aprendizaje.`,
    };
  }

  if (t === "diario_campo") {
    return {
      nombre: "Diario de campo",
      instruccion: `En el campo "instrumento" del JSON escribe exactamente: ["Diario de campo"].`,
    };
  }

  if (t === "lista_verificacion") {
    return {
      nombre: "Lista de verificación",
      instruccion: `En el campo "instrumento" del JSON escribe exactamente: ["Lista de verificación"].`,
    };
  }

  if (t === "ficha_seguimiento") {
    return {
      nombre: "Ficha de seguimiento",
      instruccion: `En el campo "instrumento" del JSON escribe exactamente: ["Ficha de seguimiento"].`,
    };
  }

  // DEFAULT: lista de cotejo
  return {
    nombre: "Lista de cotejo",
    instruccion: `En el campo "instrumento" del JSON escribe exactamente: ["Lista de cotejo"].
Los criterios de evaluación deben formularse como indicadores que se cumplen o no se cumplen.`,
  };
}

export function buildUserPrompt({
  datos,
  tituloSesion,
  contextoPersonalizado,
  capacidadesSeleccionadas,
}: UserPromptParams): string {
  const { area, competencia } = datos;

  const tipoInstrumento = (datos as any).tipoInstrumento as string | undefined;
  const instrumentoConfig = getInstrumentoConfig(tipoInstrumento);

  const capacidadesGeneradas =
    competencia && COMPETENCIAS_CAPACIDADES[area]?.[competencia]
      ? COMPETENCIAS_CAPACIDADES[area][competencia]
      : ["Capacidades no especificadas."];

  const capacidadesFinal: string[] =
    capacidadesSeleccionadas?.length ? capacidadesSeleccionadas : capacidadesGeneradas;

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

PARA EL CAMPO "desempenosPrecisados":
- Redáctalo como un solo párrafo de 4 a 6 oraciones, NO como lista.
- Debe incluir:
  • La acción principal del estudiante en infinitivo (qué hace) + el contenido específico.  
  • El contexto o situación donde aplica lo aprendido (vida diaria, aula, comunidad, problema real, etc.).  
  • Mención explícita de las capacidades que moviliza (relacionadas con la competencia seleccionada).  
  • Un ejemplo breve de aplicación concreta (por ejemplo, en compras, diálogo familiar, experimento, etc.).  
- Debe ser observable, medible, técnico, concreto y alineado al área, competencia, capacidades y grado.

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
  ▪ Explicación del contenido o tema central utilizando estrategias de enseñanza coherentes con el enfoque seleccionado (modelamiento, resolución guiada de ejemplos, uso de analogías, organizadores visuales, experimentos demostrativos, etc.), antes de las actividades grupales e individuales.
  ▪ Criterios de evaluación (mínimo 4)
  ▪ Conflicto cognitivo contextualizado
  ▪ Actividades grupales (descripción clara)
  ▪ Actividades individuales (pasos detallados)
  ▪ Retroalimentación
  ▪ Preguntas de metacognición / reflexión final
- La explicación del contenido debe describir cómo el docente presenta y desarrolla el tema en el aula (ideas clave, ejemplos, andamiajes y recursos) antes de que los estudiantes pasen a resolver las actividades.
- Las actividades deben estar redactadas para aplicarse en aula real, con lenguaje natural pero técnico.
- Criterios y evidencias deben estar claramente separados.
- Las evidencias deben incluir:
  "Socialización oral", "Resolución de ejercicios del libro", "Cuestionario " + una o dos más específicas al tema.
- Evidencias mínimas obligatorias:
  "Socialización oral", "Resolución de ejercicios del libro", "Cuestionario ", + 1 o 2 más según tema.
- Recursos generales (Ej: fichas, pizarra, material concreto).

- Instrumento de evaluación seleccionado por el docente:
  • Tipo: ${instrumentoConfig.nombre}.
  • ${instrumentoConfig.instruccion}
- Asegúrate de que el campo "instrumento" del JSON refleje exactamente este tipo
  y que los "criteriosEvaluacion" sean coherentes con el instrumento, el tema trabajado y las actividades centrales descritas en la secuencia didáctica (especialmente en el desarrollo de la sesión).

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
