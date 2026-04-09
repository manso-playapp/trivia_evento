import type { AnswerOptionId, Question } from "@/types";

const createOptions = (
  options: [string, string, string, string]
): Question["options"] => {
  const labels: AnswerOptionId[] = ["A", "B", "C", "D"];

  return options.map((text, index) => ({
    id: labels[index],
    label: labels[index],
    text,
  }));
};

const questionSeeds = [
  {
    category: "Cultura",
    prompt: "Que valor representa mejor una cultura corporativa de alto rendimiento?",
    options: [
      "Claridad en objetivos y colaboracion",
      "Improvisacion constante",
      "Jerarquias sin feedback",
      "Reuniones sin decision",
    ] as [string, string, string, string],
    correctOptionId: "A" as AnswerOptionId,
  },
  {
    category: "Innovacion",
    prompt: "Que practica ayuda mas a validar una idea rapido?",
    options: [
      "Esperar seis meses",
      "Construir un MVP",
      "Sumar mas aprobaciones",
      "Ocultar datos del usuario",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Clientes",
    prompt: "Cual es el foco central de una buena experiencia de cliente?",
    options: [
      "Reducir todo contacto",
      "Cobrar mas canales",
      "Resolver fricciones reales",
      "Hablar solo de marca",
    ] as [string, string, string, string],
    correctOptionId: "C" as AnswerOptionId,
  },
  {
    category: "Datos",
    prompt: "Que indicador sirve para entender conversion de un funnel?",
    options: [
      "Tasa de avance por etapa",
      "Color del dashboard",
      "Cantidad de mails leidos",
      "Horas de reunion",
    ] as [string, string, string, string],
    correctOptionId: "A" as AnswerOptionId,
  },
  {
    category: "Producto",
    prompt: "Que prioriza una roadmap saludable?",
    options: [
      "Ideas sin impacto",
      "Lo urgente del ultimo mail",
      "Impacto, esfuerzo y estrategia",
      "Mas features por si acaso",
    ] as [string, string, string, string],
    correctOptionId: "C" as AnswerOptionId,
  },
  {
    category: "Marca",
    prompt: "Que hace memorable a una marca en un evento en vivo?",
    options: [
      "Una promesa clara y consistente",
      "Usar mas texto pequeno",
      "Cambiar de mensaje siempre",
      "Evitar contraste visual",
    ] as [string, string, string, string],
    correctOptionId: "A" as AnswerOptionId,
  },
  {
    category: "Seguridad",
    prompt: "Desde esta ronda ya se habilitan los comodines. Que hace X2?",
    options: [
      "Duplica puntos si responde bien",
      "Elimina una opcion",
      "Congela al lider",
      "Suma 50 puntos fijos",
    ] as [string, string, string, string],
    correctOptionId: "A" as AnswerOptionId,
  },
  {
    category: "Estrategia",
    prompt: "Que efecto tiene BOMBA en este MVP?",
    options: [
      "Reinicia el juego",
      "Congela otra mesa en la proxima ronda",
      "Roba puntos al rival",
      "Extiende el timer",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Colaboracion",
    prompt: "Que comportamiento fortalece equipos de alto trust?",
    options: [
      "Feedback claro y frecuente",
      "Silencio ante errores",
      "Objetivos ocultos",
      "Cambios sin contexto",
    ] as [string, string, string, string],
    correctOptionId: "A" as AnswerOptionId,
  },
  {
    category: "Marketing",
    prompt: "Que busca una accion de awareness bien hecha?",
    options: [
      "Maximizar recordacion de marca",
      "Cerrar siempre venta inmediata",
      "Reducir alcance",
      "Evitar consistencia visual",
    ] as [string, string, string, string],
    correctOptionId: "A" as AnswerOptionId,
  },
  {
    category: "Finanzas",
    prompt: "Que indica mejor la salud de un negocio recurrente?",
    options: [
      "Solo el trafico web",
      "Ingresos predecibles y retencion",
      "Likes de una publicacion",
      "Numero de slogans",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Tecnologia",
    prompt: "Que ventaja tiene una arquitectura modular?",
    options: [
      "Bloquea cambios",
      "Escala y mantiene mejor",
      "Obliga a duplicar codigo",
      "Evita testing",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Eventos",
    prompt: "Que vuelve legible una pantalla para auditorio grande?",
    options: [
      "Tipografia pequena",
      "Mas texto por bloque",
      "Alto contraste y jerarquia",
      "Bordes invisibles",
    ] as [string, string, string, string],
    correctOptionId: "C" as AnswerOptionId,
  },
  {
    category: "Cierre",
    prompt: "Que define un MVP bien recortado?",
    options: [
      "Todo lo posible",
      "Lo minimo para probar valor real",
      "Solo decoracion",
      "Backend total desde el dia uno",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
];

export const mockQuestions: Question[] = questionSeeds.map((question, index) => ({
  id: `question-${index + 1}`,
  order: index + 1,
  category: question.category,
  prompt: question.prompt,
  options: createOptions(question.options),
  correctOptionId: question.correctOptionId,
  timeLimitSeconds: 30,
}));
