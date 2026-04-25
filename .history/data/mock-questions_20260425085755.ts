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
    prompt: "Que documento se necesita para iniciar una importacion o exportacion?",
    options: [
      "Declaracion jurada",
      "Factura proforma",
      "Packing list",
      "Remito",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Incoterms",
    prompt: "Que significa la condicion FOB?",
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
    prompt: "A que organismo pertenece la DGA - Aduana?",
    options: [
      "ARCA",
      "ANMAT",
      "BCRA",
      "GARCA",
    ] as [string, string, string, string],
    correctOptionId: "A" as AnswerOptionId,
  },
  {
    category: "Transporte",
    prompt: "Que transporte es mas rapido?",
    options: [
      "Maritimo",
      "Terrestre",
      "Aereo",
      "Ferroviario",
    ] as [string, string, string, string],
    correctOptionId: "C" as AnswerOptionId,
  },
  {
    category: "Documentacion",
    prompt: "Que informacion se puede ver en el packing list?",
    options: [
      "Precio",
      "Cantidades, pesos y tipo de bultos",
      "Impuestos",
      "Origen",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Incoterms",
    prompt: "Cual de estos Incoterms incluye seguro internacional?",
    options: [
      "EXW",
      "FOB",
      "CIF",
      "FCA",
    ] as [string, string, string, string],
    correctOptionId: "C" as AnswerOptionId,
  },
  {
    category: "Mercosur",
    prompt: "Que pais no forma parte del Mercosur?",
    options: [
      "Brasil",
      "Peru",
      "Paraguay",
      "Uruguay",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Origen",
    prompt: "Que documento prueba el origen de la mercaderia?",
    options: [
      "BL",
      "AWB",
      "CRT",
      "Certificado de origen",
    ] as [string, string, string, string],
    correctOptionId: "D" as AnswerOptionId,
  },
  {
    category: "Incoterms",
    prompt: "Que significa EXW?",
    options: [
      "Entrega en fabrica",
      "Entrega en puerto",
      "Entrega con seguro",
      "Entrega urgente",
    ] as [string, string, string, string],
    correctOptionId: "A" as AnswerOptionId,
  },
  {
    category: "Transporte",
    prompt: "Que medio de transporte usa como contrato el BL?",
    options: [
      "Aereo",
      "Maritimo",
      "Terrestre",
      "Multimodal",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "DMF",
    prompt: "Quien es el encargado del area exportaciones en DMF?",
    options: [
      "Flor",
      "Nico",
      "Diego",
      "Andres",
    ] as [string, string, string, string],
    correctOptionId: "D" as AnswerOptionId,
  },
  {
    category: "Argentina",
    prompt: "Cual es el principal destino de las exportaciones argentinas?",
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
    prompt: "Que es un despachante?",
    options: [
      "Transportista",
      "Intermediario aduanero",
      "Un charlatan",
      "Proveedor",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Monedas",
    prompt: "Que pais usa la moneda yuan?",
    options: [
      "Japon",
      "India",
      "Corea",
      "China",
    ] as [string, string, string, string],
    correctOptionId: "D" as AnswerOptionId,
  },
  {
    category: "Puertos",
    prompt: "Que puerto europeo mueve mas de 14 millones de contenedores al ano?",
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
    prompt: "Como le decimos en la oficina a la camioneta ploteada de DMF?",
    options: [
      "Demefeta",
      "Aduaneta",
      "Chata",
      "Tutu",
    ] as [string, string, string, string],
    correctOptionId: "B" as AnswerOptionId,
  },
  {
    category: "Mercosur",
    prompt: "Cuando entra en vigencia el Acuerdo Mercosur-Union Europea?",
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
    prompt: "Cuantas personas formamos parte de DMF?",
    options: [
      "5",
      "20",
      "11",
      "18",
    ] as [string, string, string, string],
    correctOptionId: "C" as AnswerOptionId,
  },
  {
    category: "Incoterms",
    prompt: "Cual de estos Incoterms incluye flete y seguro?",
    options: [
      "FCA",
      "FOB",
      "CIF",
      "EXW",
    ] as [string, string, string, string],
    correctOptionId: "C" as AnswerOptionId,
  },
  {
    category: "DMF",
    prompt:
      "Cual es la frase que siempre repite Diego al hablar de lo que es el comercio exterior en Argentina?",
    options: [
      "Fumar en la garrafa",
      "Meter los dedos en el enchufe",
      "Bailar la tarantela",
      "Todas las anteriores son correctas",
    ] as [string, string, string, string],
    correctOptionId: "D" as AnswerOptionId,
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
