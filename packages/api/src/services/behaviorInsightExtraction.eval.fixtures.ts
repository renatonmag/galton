// Discovery-pass eval dataset (v1: comments-only).
//
// Each case is a trade-entry comments plus the behaviors that SHOULD
// surface. `expectedBehaviors` is the recall denominator — keep it exhaustive.
//
// v1 keeps `activePatterns` / `emergentCandidates` empty so a recall miss
// unambiguously means "failed to extract" (not "correctly suppressed an active
// pattern"). Data stays in Portuguese, since the extractor and judge run in PT.
//
// To bootstrap the remaining ~15-25 cases: paste a real comments, run
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
    id: "sg45g4",
    comments: [
      "Era payroll, então eu fiquei de fora até que o payroll já tivesse acontecido. Deu uma grande barra e aí eu entrei nessa grande barra, uma enorme barra, bem climática, e saiu no break even. Foi um movimento exaustivo.",
    ],
    activePatterns: [],
    emergentCandidates: [],
    expectedBehaviors: [
      {
        text: "Respeita o plano de evitar operar durante eventos de alto impacto, aguardando o fim do payroll.",
        type: "do",
        evidenceQuotes: [
          "Era payroll, então eu fiquei de fora até que o payroll já tivesse acontecido.",
        ],
      },
      {
        text: "Entra no trade após um movimento forte já ter começado, perseguindo o preço.",
        type: "dont",
        evidenceQuotes: [
          "Deu uma grande barra e aí eu entrei nessa grande barra.",
        ],
      },
      {
        text: "Demonstra FOMO ao entrar motivado por um movimento explosivo já em andamento.",
        type: "dont",
        evidenceQuotes: [
          "Deu uma grande barra e aí eu entrei nessa grande barra, uma enorme barra, bem climática.",
        ],
      },
      {
        text: "Reconhece que entrou em um movimento exaustivo, indicando identificação tardia do contexto.",
        type: "do",
        evidenceQuotes: [
          "Foi um movimento exaustivo.",
        ],
      },
      {
        text: "Protege o capital ajustando a operação para break even quando o cenário perde força.",
        type: "do",
        evidenceQuotes: [
          "Saiu no break even.",
        ],
      },
    ],
  },
  {
    id: "8fufud8",
    comments: [
      "Entrei no trade porque havia espaço ainda, mas este trade deveria ter acontecido ou poderia ter acontecido três barras antes, no alto da lateralidade, que já havia mostrado reversão e uma boa barra de baixo, uma boa barra de sinal, uma boa barra especial."
    ],
    activePatterns: [],
    emergentCandidates: [],
    expectedBehaviors: [
      {
        text: "Não entrar em um trade apenas porque ainda existe espaço para o preço andar quando o ponto ideal de entrada já passou.",
        type: "dont",
        evidenceQuotes: [
          "Entrei no trade porque havia espaço ainda",
          "este trade deveria ter acontecido três barras antes"
        ]
      },
      {
        text: "Executar a entrada assim que houver confluência de sinais de reversão, sem adiar a decisão.",
        type: "do",
        evidenceQuotes: [
          "deveria ter acontecido três barras antes",
          "já havia mostrado reversão",
          "uma boa barra de sinal"
        ]
      },
      {
        text: "Dar prioridade a entradas no extremo da lateralidade quando houver confirmação de reversão por uma barra de sinal de qualidade.",
        type: "do",
        evidenceQuotes: [
          "no alto da lateralidade",
          "já havia mostrado reversão",
          "uma boa barra de baixo",
          "uma boa barra de sinal",
          "uma boa barra especial"
        ]
      }
    ],
  },
  {
    id: "9s8df98fsd",
    comments: [
      "Este trade foi... eu vi que o mercado estava forte e que podia ir mais pra cima. O pullback estava pequeno. Havia um gap com o último ponto de rompimento e estava na máxima do dia, mas havia pressão compradora. Eu hesitei em entrar e o mercado andou bastante pra cima ainda. Eu poderia ter comprado que o stop seria curtíssimo, não pegaria no stop e eu poderia ter comprado na quarta barra depois do sinal. O stop não teria me preocupado ao longo da operação."
    ],
    activePatterns: [],
    emergentCandidates: [],
    "expectedBehaviors": [
    {
      "text": "Não hesitar em executar uma entrada quando o contexto continua favorável, pois a indecisão pode fazer perder um movimento de alta com boa relação risco-retorno.",
      "type": "do",
      "evidenceQuotes": [
        "Eu hesitei em entrar e o mercado andou bastante pra cima ainda."
      ]
    },
    {
      "text": "Entrar mesmo alguns candles após o sinal quando a estrutura permanece válida, pois a oportunidade ainda pode oferecer um stop curto e uma operação de qualidade.",
      "type": "do",
      "evidenceQuotes": [
        "eu poderia ter comprado na quarta barra depois do sinal.",
        "O stop seria curtíssimo, não pegaria no stop."
      ]
    },
    {
      "text": "Confiar na gestão de risco quando o stop é tecnicamente curto, evitando deixar o medo do stop impedir uma operação que permanece válida.",
      "type": "do",
      "evidenceQuotes": [
        "O stop seria curtíssimo.",
        "O stop não teria me preocupado ao longo da operação."
      ]
    }
  ],
  },
  {
    id: "sg5353gd",
    comments: [
      "Eu vi a reversão do movimento climático anterior. Foi até a média e deixou uma sombra grande. Dos barras ruins de alta. Porém, a reversão foi mais forte. Eu achei que ia dar um trade. Mas no meio da operação eu vi que o movimento de sinal estava fraco. As barras de alta estavam fracas, então eu saí. E realmente teria pegado o stop. Mas a próxima entrada foi uma barra boa de alta que eu não entrei. Mas foi um sinal positivo que daria um trade."
    ],
    activePatterns: [],
    emergentCandidates: [],
    "expectedBehaviors": [
    {
      "text": "Abandone a operação quando a qualidade do movimento de confirmação se deteriorar, mesmo após uma entrada inicialmente válida, para evitar stops desnecessários.",
      "type": "do",
      "evidenceQuotes": [
        "no meio da operação eu vi que o movimento de sinal estava fraco",
        "As barras de alta estavam fracas, então eu saí",
        "E realmente teria pegado o stop"
      ]
    },
    {
      "text": "Não deixe uma oportunidade anterior influenciar a execução da próxima; reavalie cada novo sinal de forma independente.",
      "type": "dont",
      "evidenceQuotes": [
        "A próxima entrada foi uma barra boa de alta que eu não entrei",
        "foi um sinal positivo que daria um trade"
      ]
    },
    {
      "text": "Considere reversões mais fortes acompanhadas por um bom sinal de confirmação como oportunidades de trade.",
      "type": "do",
      "evidenceQuotes": [
        "a reversão foi mais forte",
        "Eu achei que ia dar um trade",
        "A próxima entrada foi uma barra boa de alta"
      ]
    }
  ]
  },
  {
    id: "44tgr5t",
    comments: [
      "Foi uma boa entrada, no ponto correto, e foi uma boa saída, porque o mercado começou a ficar muito lento e fazer repetidas tentativas de alta, formando uma cunha, que foi confirmada logo depois com uma barra de reversão de alta Boa!"
    ],
    activePatterns: [],
    emergentCandidates: [],
    "expectedBehaviors": [
    {
      "text": "Encerre a operação quando o mercado perder momentum e começar a apresentar movimentos lentos com repetidas tentativas na mesma direção, pois isso pode anteceder uma reversão.",
      "type": "do",
      "evidenceQuotes": [
        "foi uma boa saída, porque o mercado começou a ficar muito lento e fazer repetidas tentativas de alta"
      ]
    },
    {
      "text": "Utilize padrões gráficos confirmados, como uma cunha seguida de uma barra de reversão, para validar a decisão de saída, aumentando a probabilidade de proteger os ganhos.",
      "type": "do",
      "evidenceQuotes": [
        "formando uma cunha, que foi confirmada logo depois com uma barra de reversão de alta"
      ]
    }
  ]
  },
  {
    id: "8a97yf87ayd",
    comments: [
      "Boa barra de sinal, uma barra de tendência forte, diria que uma barra especial, porque foi a melhor barra de baixa, foi a melhor barra de alta, aliás, das últimas 12 barras, região da média, e já havia sido um repique anterior, e novamente foi a média, e na segunda barra, que passou, fechou abaixo da média, já voltou a fechar acima da média de novo. Boa barra de sinal."
    ],
    activePatterns: [],
    emergentCandidates: [],
   "expectedBehaviors": [
    {
      "text": "Dar mais peso a barras de sinal excepcionalmente fortes quando elas se destacam em relação às barras recentes, pois isso aumenta a qualidade do contexto para uma entrada.",
      "type": "do",
      "evidenceQuotes": [
        "Boa barra de sinal",
        "foi a melhor barra de alta das últimas 12 barras"
      ]
    },
    {
      "text": "Valorizar barras de sinal que surgem na região da média após um repique, pois a reação da média reforça a probabilidade de continuação do movimento.",
      "type": "do",
      "evidenceQuotes": [
        "região da média",
        "já havia sido um repique anterior",
        "novamente foi a média"
      ]
    },
    {
      "text": "Considerar como confirmação quando uma barra fecha abaixo da média, mas a barra seguinte recupera rapidamente e fecha novamente acima da média, indicando rejeição do rompimento.",
      "type": "do",
      "evidenceQuotes": [
        "na segunda barra... fechou abaixo da média",
        "já voltou a fechar acima da média de novo"
      ]
    }
  ]
  },
  {
    id: "t7fg7g7",
    comments: [
      "Esse trade foi interessante porque foi a segunda tentativa de reversão e eu identifiquei perfeitamente porque deu um fundo, um topo de reversão. Três barras bem fortes de reversão. Tinha que continuar caindo ou pelo menos poderia continuar caindo. Porém, eu coloquei o stop abaixo do stop técnico e foi justamente por isso que eu saí. Saiu do stop e eu não entrei de novo e ele caiu mais um tanto. Se o stop tivesse 50 pontos acima não teria pegado e eu teria surfado uma operação boa."
    ],
    activePatterns: [],
    emergentCandidates: [],
    "expectedBehaviors": [
    {
      "text": "Respeitar o stop técnico em vez de afastá-lo por decisão subjetiva, pois alterar o posicionamento do stop pode levar a uma saída prematura de uma operação que ainda mantém a tese válida.",
      "type": "do",
      "evidenceQuotes": [
        "eu coloquei o stop abaixo do stop técnico",
        "foi justamente por isso que eu saí",
        "Se o stop tivesse 50 pontos acima não teria pegado e eu teria surfado uma operação boa"
      ]
    },
    {
      "text": "Quando a tese operacional continuar válida após um stop, reavaliar a possibilidade de reentrada, pois deixar de reentrar pode fazer perder o movimento esperado.",
      "type": "do",
      "evidenceQuotes": [
        "Saiu do stop e eu não entrei de novo",
        "ele caiu mais um tanto"
      ]
    },
    {
      "text": "Confiar na leitura de preço quando houver sinais claros de reversão, pois uma identificação correta da estrutura aumenta a probabilidade de capturar o movimento esperado.",
      "type": "do",
      "evidenceQuotes": [
        "identifiquei perfeitamente porque deu um fundo, um topo de reversão",
        "Três barras bem fortes de reversão",
        "Tinha que continuar caindo ou pelo menos poderia continuar caindo"
      ]
    }
  ]
  },
  {
    id: "4t3hrr8i",
    comments: [
      "Por um breve momento eu achei que ia reverter, mas eu percebi que pela formação do contexto a pressão de baixo estava mais forte, então eu saí rapidamente da operação e eu estava correto."
    ],
    activePatterns: [],
    emergentCandidates: [],
    "expectedBehaviors": [
    {
      "text": "Ao identificar que o contexto favorece a pressão contrária à sua posição, encerre a operação rapidamente para evitar perdas maiores.",
      "type": "do",
      "evidenceQuotes": [
        "eu percebi que pela formação do contexto a pressão de baixo estava mais forte",
        "então eu saí rapidamente da operação",
        "eu estava correto"
      ]
    },
    {
      "text": "Não mantenha a operação apenas porque houve um breve sinal de possível reversão; confirme que o contexto realmente mudou antes de continuar posicionado.",
      "type": "dont",
      "evidenceQuotes": [
        "Por um breve momento eu achei que ia reverter",
        "mas eu percebi que pela formação do contexto a pressão de baixo estava mais forte"
      ]
    }
  ]
  },
  {
    id: "day-reentry-pricereading",
    comments: [
      "Entrei no trade porque havia espaço ainda, mas este trade deveria ter acontecido ou poderia ter acontecido três barras antes, no alto da lateralidade, que já havia mostrado reversão e uma boa barra de baixo, uma boa barra de sinal, uma boa barra especial."
    ],
    activePatterns: [],
    emergentCandidates: [],
    expectedBehaviors: [
      {
        text: "Não entrar em um trade apenas porque ainda existe espaço para o preço andar quando o ponto ideal de entrada já passou.",
        type: "dont",
        evidenceQuotes: [
          "Entrei no trade porque havia espaço ainda",
          "este trade deveria ter acontecido três barras antes"
        ]
      },
      {
        text: "Executar a entrada assim que houver confluência de sinais de reversão, sem adiar a decisão.",
        type: "do",
        evidenceQuotes: [
          "deveria ter acontecido três barras antes",
          "já havia mostrado reversão",
          "uma boa barra de sinal"
        ]
      },
      {
        text: "Dar prioridade a entradas no extremo da lateralidade quando houver confirmação de reversão por uma barra de sinal de qualidade.",
        type: "do",
        evidenceQuotes: [
          "no alto da lateralidade",
          "já havia mostrado reversão",
          "uma boa barra de baixo",
          "uma boa barra de sinal",
          "uma boa barra especial"
        ]
      }
    ],
  },

];
