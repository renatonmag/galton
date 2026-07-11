// Discovery-pass eval dataset (v1: comments-only).
//
// Each case is a day of trade-entry comments plus the behaviors that SHOULD
// surface. `expectedBehaviors` is the recall denominator — keep it exhaustive.
//
// v1 keeps `activePatterns` / `emergentCandidates` empty so a recall miss
// unambiguously means "failed to extract" (not "correctly suppressed an active
// pattern"). Data stays in Portuguese, since the extractor and judge run in PT.
//
// To bootstrap the remaining ~15-25 cases: paste a real day of comments, run
// `pnpm eval`, then audit the surfaced items — ADD any genuine behavior the
// model found that you'd missed, REMOVE the junk. That reaches an exhaustive
// gold faster than labeling cold.

export type DiscoveryEvalCase = {
  id: string;
  comments: string[];
  activePatterns: { id: string; text: string }[]; // [] in v1
  emergentCandidates: { id: string; text: string }[]; // [] in v1
  expectedBehaviors: {
    text: string; // canonical label; the recall judge matches on meaning (rubric A)
    type: "do" | "dont";
    evidenceQuotes?: string[]; // auditing aid only; NOT shown to the judge
  }[];
};

export const discoveryEvalCases: DiscoveryEvalCase[] = [
  {
    id: "day-hesitation-earlyexit",
    comments: [
      "Entrei num trade que eu já deveria ter entrado duas barras antes e muitos pontos abaixo.",
      "Coloquei o stop abaixo do stop técnico e foi justamente por isso que eu saí. Saiu do stop e eu não entrei de novo e ele caiu mais um tanto.",
      "Eu saí 400 pontos antes do alvo e foi no alvo certinho. Não precisava ter saído antecipado.",
      "Esperei uma pressão compradora acontecer e a barra romper a máxima da barra anterior, aí sim entrei.",
    ],
    activePatterns: [],
    emergentCandidates: [],
    expectedBehaviors: [
      {
        text: "Entra em trades atrasado por hesitação, resultando em piores stops e risco-retorno",
        type: "dont",
        evidenceQuotes: [
          "Entrei num trade que eu já deveria ter entrado duas barras antes e muitos pontos abaixo.",
        ],
      },
      {
        text: "Coloca stops muito apertados (no ou abaixo do stop técnico), sendo tirado de trades que depois funcionaram",
        type: "dont",
        evidenceQuotes: [
          "Coloquei o stop abaixo do stop técnico e foi justamente por isso que eu saí. Saiu do stop e eu não entrei de novo e ele caiu mais um tanto.",
        ],
      },
      {
        text: "Sai da operação cedo demais, antes do alvo",
        type: "dont",
        evidenceQuotes: ["Eu saí 400 pontos antes do alvo e foi no alvo certinho."],
      },
      {
        text: "Aguarda confirmação de força compradora antes de entrar",
        type: "do",
        evidenceQuotes: [
          "Esperei uma pressão compradora acontecer e a barra romper a máxima da barra anterior, aí sim entrei.",
        ],
      },
    ],
  },
  {
    id: "day-reentry-pricereading",
    comments: [
      "Fui stopado mas não reentrei, e logo depois veio o sinal válido que eu já esperava e perdi o movimento.",
      "Percebi pela formação do contexto que a pressão de baixo estava mais forte, então saí rapidamente da operação e estava correto.",
      "O pullback fez um topo duplo numa região de resistência, e aí sim foi a operação que eu estava esperando.",
    ],
    activePatterns: [],
    emergentCandidates: [],
    expectedBehaviors: [
      {
        text: "Não reentra após ser stopado, perdendo o sinal válido subsequente",
        type: "dont",
        evidenceQuotes: [
          "Fui stopado mas não reentrei, e logo depois veio o sinal válido que eu já esperava e perdi o movimento.",
        ],
      },
      {
        text: "Reconhece rapidamente quando a pressão contrária está mais forte e sai da operação",
        type: "do",
        evidenceQuotes: [
          "Percebi pela formação do contexto que a pressão de baixo estava mais forte, então saí rapidamente da operação e estava correto.",
        ],
      },
      {
        text: "Leitura precisa da ação do preço e da estrutura de barras (topo duplo, regiões de resistência)",
        type: "do",
        evidenceQuotes: [
          "O pullback fez um topo duplo numa região de resistência, e aí sim foi a operação que eu estava esperando.",
        ],
      },
    ],
  },
];
