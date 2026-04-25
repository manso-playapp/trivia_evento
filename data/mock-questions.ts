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
    category: "Comercio Exterior",
    prompt: "¿Qué documento se necesita para iniciar una importación o exportación?",
    options: [
      "Declaración jurada",
      "Factura proforma",
      "Packing list",
      "Remito",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "DMF",
    prompt: "¿Cuántas personas formamos parte de DMF?",
    options: ["5", "20", "11", "18"] as [string, string, string, string],
    correctOptionId: "C" as AnswerOptionId,
  },
  {
    category: "Incoterms",
    prompt: "¿Qué significa la condición FOB?",
    options: [
      "Entrega en destino",
      "Libre a bordo",
      "Pago anticipado",
      "Seguro incluido",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Aduana",
    prompt: "¿A qué organismo pertenece la DGA - Aduana?",
    options: [
      "ARCA",
      "ANMAT",
      "BCRA",
      "GARCA",
    ] as [string, string, string, string],
    correctOptionId: "A" as AnswerOptionId,
  },
  {
    category: "DMF",
    prompt: "¿En qué año se conocieron Diego y Andrés?",
    options: ["1983", "1990", "1991", "2000"] as [
      string,
      string,
      string,
      string,
    ],
    correctOptionId: "A" as AnswerOptionId,
  },
  {
    category: "Documentación",
    prompt: "¿Qué información se puede ver en el packing list?",
    options: [
      "Precio",
      "Cantidades, pesos y tipo de bultos",
      "Impuestos",
      "Origen",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Mercosur",
    prompt: "¿Qué país no forma parte del Mercosur?",
    options: [
      "Brasil",
      "Perú",
      "Paraguay",
      "Uruguay",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "DMF",
    prompt:
      "¿Quién en la oficina de DMF arma una torre de tazas de café vacías en su escritorio?",
    options: [
      "Cami",
      "Lucas",
      "Juan",
      "Guille",
    ] as [string, string, string, string],
    correctOptionId: "C" as AnswerOptionId,
  },
  {
    category: "Argentina",
    prompt: "¿Cómo se llama el actual Ministro de Desregulación del gobierno Nacional?",
    options: [
      "Federico Sturzenegger",
      "Pablo Quirno",
      "Toto Caputo",
      "Bicho Fuertes",
    ] as [string, string, string, string],
    correctOptionId: "A" as AnswerOptionId,
  },
  {
    category: "Transporte",
    prompt: "¿Qué medio de transporte usa como contrato el BL?",
    options: [
      "Aéreo",
      "Marítimo",
      "Terrestre",
      "Multimodal",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "DMF",
    prompt: "¿Quién es el encargado del área exportaciones en DMF?",
    options: [
      "Flor",
      "Nico",
      "Diego",
      "Andrés",
    ] as [string, string, string, string],
    correctOptionId: "D" as AnswerOptionId,
  },
  {
    category: "Argentina",
    prompt: "¿Cuál es el principal destino de las exportaciones argentinas?",
    options: [
      "Brasil",
      "Alemania",
      "Estados Unidos",
      "Uruguay",
    ] as [string, string, string, string],
    correctOptionId: "A" as AnswerOptionId,
  },
  {
    category: "Aduana",
    prompt: "¿Qué es un despachante?",
    options: [
      "Transportista",
      "Intermediario aduanero",
      "Un charlatán",
      "Proveedor",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Monedas",
    prompt: "¿Qué país usa la moneda yuan?",
    options: [
      "Japón",
      "India",
      "Corea",
      "China",
    ] as [string, string, string, string],
    correctOptionId: "D" as AnswerOptionId,
  },
  {
    category: "Puertos",
    prompt: "¿Qué puerto europeo mueve más de 14 millones de contenedores al año?",
    options: [
      "Hamburgo",
      "Amberes-Brujas",
      "Rotterdam",
      "Barcelona",
    ] as [string, string, string, string],
    correctOptionId: "C" as AnswerOptionId,
  },
  {
    category: "DMF",
    prompt: "¿Cómo le decimos en la oficina a la camioneta ploteada de DMF?",
    options: [
      "Demefeta",
      "Aduaneta",
      "Chata",
      "Tutú",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Mercosur",
    prompt: "¿Cuándo entra en vigencia el Acuerdo Mercosur-Unión Europea?",
    options: [
      "1 de mayo de 2026",
      "1 de mayo de 2027",
      "1 de junio de 2026",
      "Hoy",
    ] as [string, string, string, string],
    correctOptionId: "A" as AnswerOptionId,
  },
  {
    category: "DMF",
    prompt: "En DMF, ¿hinchas de qué club predominan?",
    options: [
      "Boca",
      "Unión",
      "Colón",
      "Boca",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Deportes",
    prompt: "¿Cuál de los siguientes equipos NO está en las semifinales de la Champions League 2026?",
    options: [
      "PSG",
      "Bayern Múnich",
      "Real Madrid",
      "Real Madrid",
    ] as [string, string, string, string],
    correctOptionId: "D" as AnswerOptionId,
  },
  {
    category: "DMF",
    prompt:
      "¿Cuál es la frase que siempre repite Diego al hablar de lo que es el comercio exterior en Argentina?",
    options: [
      "Fumar en la garrafa",
      "Meter los dedos en el enchufe",
      "Bailar la tarantela",
      "Todas las anteriores son correctas",
    ] as [string, string, string, string],
    correctOptionId: "D" as AnswerOptionId,
  },
  {
    category: "Desempate",
    prompt: "¿Quién canta la canción Pa' la selección, que se hizo famosa en Qatar 2022?",
    options: [
      "Los Palmeras",
      "La T y la M",
      "Tini",
      "Wos",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Desempate",
    prompt: "Desde la mesa de ayuda de AFIP, ¿cómo le decían al estudio DMF en 2005?",
    options: [
      "El estudio de los dinosaurios",
      "El estudio de los sabaleros",
      "El estudio de los gatos",
      "El estudio de los murciélagos",
    ] as [string, string, string, string],
    correctOptionId: "D" as AnswerOptionId,
  },
  {
    category: "Desempate",
    prompt: "El Estrecho de Ormuz es clave para el comercio mundial porque:",
    options: [
      "Es la principal ruta del vodka de Rusia hacia Europa",
      "Conecta el Mar Rojo con el Mediterráneo",
      "Por allí transita cerca de un quinto del petróleo mundial",
      "Es la única salida marítima de China",
    ] as [string, string, string, string],
    correctOptionId: "C" as AnswerOptionId,
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
