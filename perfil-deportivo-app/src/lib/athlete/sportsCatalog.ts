// GENERADO desde Deportes_Potrero_1.xlsx (columna Deporte / Posicion / Estadistica).
// Catalogo unico: deportes -> posiciones -> estadisticas. Lo consumen el form
// de Mi Perfil (deporte + posicion), el form de Partidos (posicion + stats
// segun el deporte del perfil) y las Estadisticas (tiles segun el deporte).
//
// Para editar el catalogo, cambiar el Excel y volver a correr el generador,
// o editar este archivo a mano respetando la forma.

export type StatType = "number" | "boolean" | "percent";

// Formula de una estadistica calculada: no se carga a mano ni se guarda en
// Match.stats, se deriva de otras stats de la misma posicion.
//  - sum: suma de las stats indicadas.
//  - percent: (suma de `part` / suma de `whole`) * 100.
export type StatFormula =
  | { kind: "sum"; of: string[] }
  | { kind: "percent"; part: string[]; whole: string[] }
  // true si esa stat vale 0 en el partido (ej. valla invicta = 0 goles
  // recibidos). null si esa stat no se cargo en el partido.
  | { kind: "zero"; of: string };

export type StatDef = {
  key: string;
  label: string;
  type: StatType;
  formula?: StatFormula;
  // Key de otra stat de la misma posicion que este valor no puede superar
  // (ej. "ganados" <= "disputados").
  atMost?: string;
};
export type PositionDef = { key: string; label: string; stats: StatDef[] };
export type SportDef = { key: string; label: string; positions: PositionDef[] };

// Estadisticas de jugador de campo (Futbol): mismo set para Defensor
// Central, Lateral, Mediocampista, Enganche y Delantero (antes tenian
// estadisticas distintas por posicion; se unifico a pedido para que el
// registro en vivo y el form manual se comporten igual en cualquier
// posicion de campo).
const FUTBOL_JUGADOR_DE_CAMPO_STATS: StatDef[] = [
  {
    "key": "pases_intentados",
    "label": "Pases intentados",
    "type": "number"
  },
  {
    "key": "pases_correctos",
    "label": "Pases correctos",
    "type": "number",
    "atMost": "pases_intentados"
  },
  {
    "key": "de_pases_correctos",
    "label": "% de pases correctos",
    "type": "percent",
    "formula": {
      "kind": "percent",
      "part": ["pases_correctos"],
      "whole": ["pases_intentados"]
    }
  },
  {
    "key": "duelos_terrestres_disputados",
    "label": "Duelos terrestres disputados",
    "type": "number"
  },
  {
    "key": "duelos_terrestres_ganados",
    "label": "Duelos terrestres ganados",
    "type": "number",
    "atMost": "duelos_terrestres_disputados"
  },
  {
    "key": "duelos_aereos_disputados",
    "label": "Duelos aéreos disputados",
    "type": "number"
  },
  {
    "key": "duelos_aereos_ganados",
    "label": "Duelos aéreos ganados",
    "type": "number",
    "atMost": "duelos_aereos_disputados"
  },
  {
    "key": "duelos_totales_ganados_calc",
    "label": "Duelos totales ganados",
    "type": "number",
    "formula": {
      "kind": "sum",
      "of": ["duelos_terrestres_ganados", "duelos_aereos_ganados"]
    }
  },
  {
    "key": "de_duelos_ganados",
    "label": "% de duelos ganados",
    "type": "percent",
    "formula": {
      "kind": "percent",
      "part": ["duelos_terrestres_ganados", "duelos_aereos_ganados"],
      "whole": ["duelos_terrestres_disputados", "duelos_aereos_disputados"]
    }
  },
  {
    "key": "intercepciones",
    "label": "Intercepciones",
    "type": "number"
  },
  {
    "key": "despejes",
    "label": "Despejes",
    "type": "number"
  },
  {
    "key": "goles",
    "label": "Goles",
    "type": "number"
  },
  {
    "key": "asistencias",
    "label": "Asistencias",
    "type": "number"
  },
  {
    "key": "gambetas",
    "label": "Gambetas",
    "type": "number"
  },
  {
    "key": "tarjetas_amarillas",
    "label": "Tarjetas amarillas",
    "type": "number"
  },
  {
    "key": "tarjetas_rojas",
    "label": "Tarjetas rojas",
    "type": "number"
  }
];

export const SPORTS: SportDef[] = [
  {
    "key": "futbol",
    "label": "Fútbol",
    "positions": [
      {
        "key": "arquero",
        "label": "Arquero",
        "stats": [
          {
            "key": "llegadas",
            "label": "Llegadas",
            "type": "number"
          },
          {
            "key": "atajadas",
            "label": "Atajadas",
            "type": "number",
            "atMost": "llegadas"
          },
          {
            "key": "de_atajadas",
            "label": "% de atajadas",
            "type": "percent",
            "formula": {
              "kind": "percent",
              "part": ["atajadas"],
              "whole": ["llegadas"]
            }
          },
          {
            "key": "mano_a_mano",
            "label": "Mano a mano",
            "type": "number"
          },
          {
            "key": "goles_recibidos",
            "label": "Goles recibidos",
            "type": "number"
          },
          {
            "key": "penales_recibidos",
            "label": "Penales recibidos",
            "type": "number"
          },
          {
            "key": "penales_atajados",
            "label": "Penales atajados",
            "type": "number",
            "atMost": "penales_recibidos"
          },
          {
            "key": "de_penales",
            "label": "% de penales atajados",
            "type": "percent",
            "formula": {
              "kind": "percent",
              "part": ["penales_atajados"],
              "whole": ["penales_recibidos"]
            }
          },
          {
            "key": "salidas_aereas",
            "label": "Despejes aéreos",
            "type": "number"
          },
          {
            "key": "pases_completados",
            "label": "Pases completados",
            "type": "number"
          },
          {
            "key": "valla_invicta",
            "label": "Valla invicta",
            "type": "boolean",
            "formula": {
              "kind": "zero",
              "of": "goles_recibidos"
            }
          }
        ]
      },
      {
        "key": "defensor_central",
        "label": "Defensor Central",
        "stats": FUTBOL_JUGADOR_DE_CAMPO_STATS
      },
      {
        "key": "lateral",
        "label": "Lateral",
        "stats": FUTBOL_JUGADOR_DE_CAMPO_STATS
      },
      {
        "key": "mediocampista",
        "label": "Mediocampista",
        "stats": FUTBOL_JUGADOR_DE_CAMPO_STATS
      },
      {
        "key": "enganche",
        "label": "Enganche",
        "stats": FUTBOL_JUGADOR_DE_CAMPO_STATS
      },
      {
        "key": "delantero",
        "label": "Delantero",
        "stats": FUTBOL_JUGADOR_DE_CAMPO_STATS
      }
    ]
  },
  {
    "key": "rugby",
    "label": "Rugby",
    "positions": [
      {
        "key": "pilar",
        "label": "Pilar",
        "stats": [
          {
            "key": "tackles",
            "label": "Tackles",
            "type": "number"
          },
          {
            "key": "metros_ganados",
            "label": "Metros ganados",
            "type": "number"
          },
          {
            "key": "scrums_ganados",
            "label": "Scrums ganados",
            "type": "number"
          },
          {
            "key": "penales_ocacionados",
            "label": "Penales ocacionados",
            "type": "number"
          }
        ]
      },
      {
        "key": "hooker",
        "label": "Hooker",
        "stats": [
          {
            "key": "tackles",
            "label": "Tackles",
            "type": "number"
          },
          {
            "key": "line_outs_exitosos",
            "label": "Line-outs exitosos",
            "type": "number"
          },
          {
            "key": "try_s",
            "label": "Try's",
            "type": "number"
          },
          {
            "key": "metros_ganados",
            "label": "Metros ganados",
            "type": "number"
          },
          {
            "key": "scrums_ganados",
            "label": "Scrums ganados",
            "type": "number"
          },
          {
            "key": "penales_ocacionados",
            "label": "Penales ocacionados",
            "type": "number"
          }
        ]
      },
      {
        "key": "segunda_linea",
        "label": "Segunda línea",
        "stats": [
          {
            "key": "tackles",
            "label": "Tackles",
            "type": "number"
          },
          {
            "key": "saltos_en_line_out_ganados",
            "label": "Saltos en line-out ganados",
            "type": "number"
          },
          {
            "key": "metros_ganados",
            "label": "Metros ganados",
            "type": "number"
          },
          {
            "key": "try_s",
            "label": "Try's",
            "type": "number"
          },
          {
            "key": "scrums_ganados",
            "label": "Scrums ganados",
            "type": "number"
          },
          {
            "key": "penales_ocacionados",
            "label": "Penales ocacionados",
            "type": "number"
          }
        ]
      },
      {
        "key": "ala",
        "label": "Ala",
        "stats": [
          {
            "key": "tackles",
            "label": "Tackles",
            "type": "number"
          },
          {
            "key": "turnovers_robos",
            "label": "Turnovers/robos",
            "type": "number"
          },
          {
            "key": "try_s",
            "label": "Try's",
            "type": "number"
          },
          {
            "key": "metros_ganados",
            "label": "Metros ganados",
            "type": "number"
          },
          {
            "key": "scrums_ganados",
            "label": "Scrums ganados",
            "type": "number"
          },
          {
            "key": "penales_ocacionados",
            "label": "Penales ocacionados",
            "type": "number"
          }
        ]
      },
      {
        "key": "octavo",
        "label": "Octavo",
        "stats": [
          {
            "key": "try_s",
            "label": "Try's",
            "type": "number"
          },
          {
            "key": "metros_ganados",
            "label": "Metros ganados",
            "type": "number"
          },
          {
            "key": "tackles",
            "label": "Tackles",
            "type": "number"
          },
          {
            "key": "turnovers",
            "label": "Turnovers",
            "type": "number"
          }
        ]
      },
      {
        "key": "medio_scrum",
        "label": "Medio Scrum",
        "stats": [
          {
            "key": "pases",
            "label": "Pases",
            "type": "number"
          },
          {
            "key": "try_s",
            "label": "Try's",
            "type": "number"
          },
          {
            "key": "kicks",
            "label": "Kicks",
            "type": "number"
          },
          {
            "key": "asistencias",
            "label": "Asistencias",
            "type": "number"
          },
          {
            "key": "tackles",
            "label": "Tackles",
            "type": "number"
          }
        ]
      },
      {
        "key": "apertua",
        "label": "Apertura",
        "stats": [
          {
            "key": "puntos_conversiones_penales_drops",
            "label": "Puntos (conversiones/penales/drops)",
            "type": "number"
          },
          {
            "key": "kicks",
            "label": "Kicks",
            "type": "number"
          },
          {
            "key": "try_s",
            "label": "Try's",
            "type": "number"
          },
          {
            "key": "metros_ganados",
            "label": "Metros ganados",
            "type": "number"
          },
          {
            "key": "pases",
            "label": "Pases",
            "type": "number"
          },
          {
            "key": "asistencias",
            "label": "Asistencias",
            "type": "number"
          }
        ]
      },
      {
        "key": "centro",
        "label": "Centro",
        "stats": [
          {
            "key": "try_s",
            "label": "Try's",
            "type": "number"
          },
          {
            "key": "metros_ganados",
            "label": "Metros ganados",
            "type": "number"
          },
          {
            "key": "tackles",
            "label": "Tackles",
            "type": "number"
          },
          {
            "key": "quiebres",
            "label": "Quiebres",
            "type": "number"
          }
        ]
      },
      {
        "key": "wing",
        "label": "Wing",
        "stats": [
          {
            "key": "try_s",
            "label": "Try's",
            "type": "number"
          },
          {
            "key": "metros_ganados",
            "label": "Metros ganados",
            "type": "number"
          },
          {
            "key": "quiebres",
            "label": "Quiebres",
            "type": "number"
          }
        ]
      },
      {
        "key": "fullback",
        "label": "Fullback",
        "stats": [
          {
            "key": "try_s",
            "label": "Try's",
            "type": "number"
          },
          {
            "key": "metros_ganados",
            "label": "Metros ganados",
            "type": "number"
          },
          {
            "key": "recepcion_de_patadas",
            "label": "Recepción de patadas",
            "type": "number"
          },
          {
            "key": "tackles",
            "label": "Tackles",
            "type": "number"
          },
          {
            "key": "despejes",
            "label": "Despejes",
            "type": "number"
          }
        ]
      }
    ]
  },
  {
    "key": "tenis",
    "label": "Tenis",
    "positions": [
      {
        "key": "single",
        "label": "Single",
        "stats": [
          {
            "key": "aces",
            "label": "Aces",
            "type": "number"
          },
          {
            "key": "dobles_faltas",
            "label": "Dobles faltas",
            "type": "number"
          },
          {
            "key": "de_primer_servicio",
            "label": "% de primer servicio",
            "type": "percent"
          },
          {
            "key": "puntos_ganados_con_1er_2do_servicio",
            "label": "Puntos ganados con 1er/2do servicio",
            "type": "number"
          },
          {
            "key": "winners",
            "label": "Winners",
            "type": "number"
          },
          {
            "key": "errores_no_forzados",
            "label": "Errores no forzados",
            "type": "number"
          },
          {
            "key": "break_points_ganados",
            "label": "Break points ganados",
            "type": "number"
          },
          {
            "key": "games_y_sets_ganados",
            "label": "Games y sets ganados",
            "type": "number"
          }
        ]
      },
      {
        "key": "double",
        "label": "Double",
        "stats": [
          {
            "key": "aces",
            "label": "Aces",
            "type": "number"
          },
          {
            "key": "dobles_faltas",
            "label": "Dobles faltas",
            "type": "number"
          },
          {
            "key": "de_primer_servicio",
            "label": "% de primer servicio",
            "type": "percent"
          },
          {
            "key": "puntos_ganados_con_1er_2do_servicio",
            "label": "Puntos ganados con 1er/2do servicio",
            "type": "number"
          },
          {
            "key": "winners",
            "label": "Winners",
            "type": "number"
          },
          {
            "key": "errores_no_forzados",
            "label": "Errores no forzados",
            "type": "number"
          },
          {
            "key": "break_points_ganados",
            "label": "Break points ganados",
            "type": "number"
          },
          {
            "key": "games_y_sets_ganados",
            "label": "Games y sets ganados",
            "type": "number"
          }
        ]
      }
    ]
  },
  {
    "key": "hockey",
    "label": "Hockey",
    "positions": [
      {
        "key": "arquero",
        "label": "Arquero",
        "stats": [
          {
            "key": "arco_en_cero",
            "label": "Arco en cero",
            "type": "boolean"
          },
          {
            "key": "atajadas",
            "label": "Atajadas",
            "type": "number"
          },
          {
            "key": "mano_a_mano",
            "label": "Mano a mano",
            "type": "number"
          },
          {
            "key": "goles_recibidos",
            "label": "Goles recibidos",
            "type": "number"
          },
          {
            "key": "penales_recibidos",
            "label": "Penales recibidos",
            "type": "number"
          },
          {
            "key": "penales_atajados",
            "label": "Penales atajados",
            "type": "number"
          },
          {
            "key": "corner_corto_atajado",
            "label": "Corner corto atajado",
            "type": "number"
          },
          {
            "key": "vallas_invictas",
            "label": "Vallas invictas",
            "type": "number"
          },
          {
            "key": "de_atajadas",
            "label": "% de atajadas",
            "type": "percent"
          },
          {
            "key": "salidas_aereas",
            "label": "Salidas aéreas",
            "type": "number"
          },
          {
            "key": "pases_completados",
            "label": "Pases completados",
            "type": "number"
          }
        ]
      },
      {
        "key": "defensor",
        "label": "Defensor",
        "stats": [
          {
            "key": "intercepciones",
            "label": "Intercepciones",
            "type": "number"
          },
          {
            "key": "despejes",
            "label": "Despejes",
            "type": "number"
          },
          {
            "key": "duelos_totales_ganados",
            "label": "Duelos totales ganados",
            "type": "number"
          },
          {
            "key": "goles",
            "label": "Goles",
            "type": "number"
          },
          {
            "key": "asistencias",
            "label": "Asistencias",
            "type": "number"
          },
          {
            "key": "corner_corto",
            "label": "Corner corto",
            "type": "number"
          }
        ]
      },
      {
        "key": "lateral",
        "label": "Lateral",
        "stats": [
          {
            "key": "centros",
            "label": "Centros",
            "type": "number"
          },
          {
            "key": "asistencias",
            "label": "Asistencias",
            "type": "number"
          },
          {
            "key": "recuperaciones",
            "label": "Recuperaciones",
            "type": "number"
          },
          {
            "key": "duelos_ganados",
            "label": "Duelos ganados",
            "type": "number"
          },
          {
            "key": "pases_completados",
            "label": "Pases completados",
            "type": "number"
          },
          {
            "key": "goles",
            "label": "Goles",
            "type": "number"
          },
          {
            "key": "corner_corto",
            "label": "Corner corto",
            "type": "number"
          }
        ]
      },
      {
        "key": "mediocampista",
        "label": "Mediocampista",
        "stats": [
          {
            "key": "pases_completados",
            "label": "Pases completados",
            "type": "number"
          },
          {
            "key": "recuperaciones",
            "label": "Recuperaciones",
            "type": "number"
          },
          {
            "key": "asistencias",
            "label": "Asistencias",
            "type": "number"
          },
          {
            "key": "goles",
            "label": "Goles",
            "type": "number"
          },
          {
            "key": "faltas_cometidas",
            "label": "Faltas cometidas",
            "type": "number"
          },
          {
            "key": "faltas_recibidas",
            "label": "Faltas recibidas",
            "type": "number"
          },
          {
            "key": "corner_corto",
            "label": "Corner corto",
            "type": "number"
          }
        ]
      },
      {
        "key": "delantero",
        "label": "Delantero",
        "stats": [
          {
            "key": "goles",
            "label": "Goles",
            "type": "number"
          },
          {
            "key": "asistencias",
            "label": "Asistencias",
            "type": "number"
          },
          {
            "key": "tiros_al_arco",
            "label": "Tiros al arco",
            "type": "number"
          },
          {
            "key": "de_conversion",
            "label": "% de conversión",
            "type": "percent"
          },
          {
            "key": "gambetas_exitosas",
            "label": "Gambetas exitosas",
            "type": "number"
          },
          {
            "key": "offsides",
            "label": "Offsides",
            "type": "number"
          },
          {
            "key": "corner_corto",
            "label": "Corner corto",
            "type": "number"
          }
        ]
      }
    ]
  },
  {
    "key": "basquet",
    "label": "Básquet",
    "positions": [
      {
        "key": "base",
        "label": "Base",
        "stats": [
          {
            "key": "asistencias",
            "label": "Asistencias",
            "type": "number"
          },
          {
            "key": "robos",
            "label": "Robos",
            "type": "number"
          },
          {
            "key": "turnovers",
            "label": "Turnovers",
            "type": "number"
          },
          {
            "key": "puntos",
            "label": "Puntos",
            "type": "number"
          },
          {
            "key": "de_tiro",
            "label": "% de tiro",
            "type": "percent"
          }
        ]
      },
      {
        "key": "escolta",
        "label": "Escolta",
        "stats": [
          {
            "key": "puntos",
            "label": "Puntos",
            "type": "number"
          },
          {
            "key": "de_triples",
            "label": "% de triples",
            "type": "percent"
          },
          {
            "key": "robos",
            "label": "Robos",
            "type": "number"
          },
          {
            "key": "asistencias",
            "label": "Asistencias",
            "type": "number"
          }
        ]
      },
      {
        "key": "alero",
        "label": "Alero",
        "stats": [
          {
            "key": "puntos",
            "label": "Puntos",
            "type": "number"
          },
          {
            "key": "rebotes",
            "label": "Rebotes",
            "type": "number"
          },
          {
            "key": "asistencias",
            "label": "Asistencias",
            "type": "number"
          },
          {
            "key": "robos",
            "label": "Robos",
            "type": "number"
          }
        ]
      },
      {
        "key": "ala_pivot",
        "label": "Ala Pivot",
        "stats": [
          {
            "key": "rebotes",
            "label": "Rebotes",
            "type": "number"
          },
          {
            "key": "puntos",
            "label": "Puntos",
            "type": "number"
          },
          {
            "key": "tapones",
            "label": "Tapones",
            "type": "number"
          },
          {
            "key": "dobles_dobles",
            "label": "Dobles-dobles",
            "type": "number"
          }
        ]
      },
      {
        "key": "pivot",
        "label": "Pivot",
        "stats": [
          {
            "key": "rebotes",
            "label": "Rebotes",
            "type": "number"
          },
          {
            "key": "tapones",
            "label": "Tapones",
            "type": "number"
          },
          {
            "key": "puntos",
            "label": "Puntos",
            "type": "number"
          },
          {
            "key": "de_tiro_de_campo",
            "label": "% de tiro de campo",
            "type": "percent"
          },
          {
            "key": "faltas",
            "label": "Faltas",
            "type": "number"
          }
        ]
      }
    ]
  },
  {
    "key": "paddle",
    "label": "Pádel",
    "positions": [
      {
        "key": "single",
        "label": "Single",
        "stats": [
          {
            "key": "puntos_ganados",
            "label": "Puntos ganados",
            "type": "number"
          },
          {
            "key": "winners",
            "label": "Winners",
            "type": "number"
          },
          {
            "key": "errores_no_forzados",
            "label": "Errores no forzados",
            "type": "number"
          },
          {
            "key": "de_primer_servicio",
            "label": "% de primer servicio",
            "type": "percent"
          },
          {
            "key": "voleas_ganadas",
            "label": "Voleas ganadas",
            "type": "number"
          },
          {
            "key": "bandejas_viboras_exitosas",
            "label": "Bandejas/víboras exitosas",
            "type": "number"
          },
          {
            "key": "games_ganados",
            "label": "Games ganados",
            "type": "number"
          },
          {
            "key": "sets_ganados",
            "label": "Sets ganados",
            "type": "number"
          }
        ]
      },
      {
        "key": "double",
        "label": "Double",
        "stats": [
          {
            "key": "puntos_ganados",
            "label": "Puntos ganados",
            "type": "number"
          },
          {
            "key": "winners",
            "label": "Winners",
            "type": "number"
          },
          {
            "key": "errores_no_forzados",
            "label": "Errores no forzados",
            "type": "number"
          },
          {
            "key": "de_primer_servicio",
            "label": "% de primer servicio",
            "type": "percent"
          },
          {
            "key": "voleas_ganadas",
            "label": "Voleas ganadas",
            "type": "number"
          },
          {
            "key": "bandejas_viboras_exitosas",
            "label": "Bandejas/víboras exitosas",
            "type": "number"
          },
          {
            "key": "games_y_sets_ganados",
            "label": "Games y sets ganados",
            "type": "number"
          }
        ]
      }
    ]
  },
  {
    "key": "voley",
    "label": "Vóley",
    "positions": [
      {
        "key": "armador",
        "label": "Armador",
        "stats": [
          {
            "key": "colocaciones",
            "label": "Colocaciones",
            "type": "number"
          },
          {
            "key": "errores_de_colocacion",
            "label": "Errores de colocación",
            "type": "number"
          },
          {
            "key": "puntos",
            "label": "Puntos",
            "type": "number"
          },
          {
            "key": "bloqueos",
            "label": "Bloqueos",
            "type": "number"
          }
        ]
      },
      {
        "key": "punta",
        "label": "Punta",
        "stats": [
          {
            "key": "puntos_de_ataque",
            "label": "Puntos de ataque",
            "type": "number"
          },
          {
            "key": "de_eficiencia_de_ataque",
            "label": "% de eficiencia de ataque",
            "type": "percent"
          },
          {
            "key": "recepcion",
            "label": "Recepción",
            "type": "number"
          },
          {
            "key": "saques",
            "label": "Saques",
            "type": "number"
          }
        ]
      },
      {
        "key": "opuesto",
        "label": "Opuesto",
        "stats": [
          {
            "key": "puntos_de_ataque",
            "label": "Puntos de ataque",
            "type": "number"
          },
          {
            "key": "bloqueos",
            "label": "Bloqueos",
            "type": "number"
          }
        ]
      },
      {
        "key": "central",
        "label": "Central",
        "stats": [
          {
            "key": "bloqueos",
            "label": "Bloqueos",
            "type": "number"
          },
          {
            "key": "puntos_de_bloqueo",
            "label": "Puntos de bloqueo",
            "type": "number"
          },
          {
            "key": "ataques_rapidos",
            "label": "Ataques rápidos",
            "type": "number"
          }
        ]
      },
      {
        "key": "libero",
        "label": "Líbero",
        "stats": [
          {
            "key": "recepciones",
            "label": "Recepciones",
            "type": "number"
          },
          {
            "key": "defensas_digs",
            "label": "Defensas (digs)",
            "type": "number"
          },
          {
            "key": "de_recepcion_positiva",
            "label": "% de recepción positiva",
            "type": "percent"
          }
        ]
      }
    ]
  },
  {
    "key": "golf",
    "label": "Golf",
    "positions": [
      {
        "key": "single",
        "label": "Single",
        "stats": [
          {
            "key": "golpes_totales_score",
            "label": "Golpes totales (score)",
            "type": "number"
          },
          {
            "key": "handicap",
            "label": "Handicap",
            "type": "number"
          },
          {
            "key": "greens_en_regulacion_gir",
            "label": "Greens en regulación (GIR)",
            "type": "number"
          },
          {
            "key": "putts_por_hoyo",
            "label": "Putts por hoyo",
            "type": "number"
          },
          {
            "key": "fairways_en_golpe",
            "label": "Fairways en golpe",
            "type": "number"
          },
          {
            "key": "distancia_de_drive_promedio",
            "label": "Distancia de drive promedio",
            "type": "number"
          },
          {
            "key": "scrambling",
            "label": "Scrambling %",
            "type": "percent"
          },
          {
            "key": "birdies_eagles_bogeys",
            "label": "Birdies/eagles/bogeys",
            "type": "number"
          }
        ]
      }
    ]
  }
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function getSport(sport: string | null | undefined): SportDef | null {
  if (!sport) return null;
  const n = normalize(sport);
  return (
    SPORTS.find((s) => s.key === n || normalize(s.label) === n) ?? null
  );
}

export function getPositions(sport: string | null | undefined): PositionDef[] {
  return getSport(sport)?.positions ?? [];
}

export function getPosition(
  sport: string | null | undefined,
  position: string | null | undefined
): PositionDef | null {
  if (!position) return null;
  const n = normalize(position);
  return (
    getPositions(sport).find((p) => p.key === n || normalize(p.label) === n) ??
    null
  );
}

export function positionLabel(
  sport: string | null | undefined,
  position: string | null | undefined
): string | null {
  return getPosition(sport, position)?.label ?? position ?? null;
}

// Nombre para mostrar del deporte (ej. key "futbol" -> "Fútbol"). Si el
// valor guardado no esta en el catalogo (deportes viejos escritos a mano),
// se devuelve tal cual.
export function sportLabel(sport: string | null | undefined): string {
  return getSport(sport)?.label ?? sport ?? "";
}

// Estadisticas para una posicion concreta (las que se piden en el form de
// partidos cuando se elige esa posicion).
export function getStatsForPosition(
  sport: string | null | undefined,
  position: string | null | undefined
): StatDef[] {
  return getPosition(sport, position)?.stats ?? [];
}

// Union de todas las estadisticas de todas las posiciones de un deporte,
// deduplicada por key -- se usa en la pantalla de Estadisticas, donde se
// acumulan los partidos sin importar en que posicion se jugo cada uno.
export function getAllStatsForSport(
  sport: string | null | undefined
): StatDef[] {
  const seen = new Set<string>();
  const all: StatDef[] = [];
  for (const pos of getPositions(sport)) {
    for (const stat of pos.stats) {
      if (seen.has(stat.key)) continue;
      seen.add(stat.key);
      all.push(stat);
    }
  }
  return all;
}

const STAT_LABELS: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const sport of SPORTS) {
    for (const pos of sport.positions) {
      for (const stat of pos.stats) map[stat.key] = stat.label;
    }
  }
  return map;
})();

export function statLabel(key: string): string {
  return STAT_LABELS[key] ?? key;
}

// Deja solo las stats validas para ese deporte + posicion, con el tipo
// correcto (bool true/omitido, number >=0, percent 0..100). Se corre
// server-side antes de guardar, para no confiar en lo que manda el cliente.
export function cleanStatsForPosition(
  sport: string | null | undefined,
  position: string | null | undefined,
  raw: Record<string, unknown> | null | undefined
): Record<string, number | boolean> {
  const out: Record<string, number | boolean> = {};
  if (!raw) return out;
  for (const def of getStatsForPosition(sport, position)) {
    // Las calculadas nunca se guardan: se derivan al mostrarlas.
    if (def.formula) continue;
    const v = raw[def.key];
    if (def.type === "boolean") {
      if (v === true) out[def.key] = true;
    } else if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
      out[def.key] = def.type === "percent" ? Math.min(v, 100) : v;
    }
  }
  return out;
}

type StatsRecord = Record<string, number | boolean | null | undefined>;

function numberOf(stats: StatsRecord | null | undefined, key: string): number | undefined {
  const v = stats?.[key];
  return typeof v === "number" ? v : undefined;
}

// Valor de una estadistica calculada para UN partido. Devuelve null si no
// hay datos suficientes (ej. no se cargaron los intentos, o son 0).
export function computedStatValue(
  def: StatDef,
  stats: StatsRecord | null | undefined
): number | boolean | null {
  const f = def.formula;
  if (!f) return null;

  if (f.kind === "sum") {
    const parts = f.of.map((k) => numberOf(stats, k)).filter((v): v is number => v !== undefined);
    return parts.length > 0 ? parts.reduce((a, b) => a + b, 0) : null;
  }

  if (f.kind === "zero") {
    const v = numberOf(stats, f.of);
    return v === undefined ? null : v === 0;
  }

  const wholeParts = f.whole.map((k) => numberOf(stats, k)).filter((v): v is number => v !== undefined);
  if (wholeParts.length === 0) return null;
  const whole = wholeParts.reduce((a, b) => a + b, 0);
  if (whole <= 0) return null;
  const part = f.part.reduce((sum, k) => sum + (numberOf(stats, k) ?? 0), 0);
  return Math.round(Math.min((part / whole) * 100, 100) * 10) / 10;
}

// Valida que ninguna stat supere a la que la limita (atMost), ej. pases
// correctos <= pases intentados. Devuelve el mensaje de error, o null si
// esta todo bien. Se usa en el form (feedback inmediato) y en la API.
export function validateStatConsistency(
  sport: string | null | undefined,
  position: string | null | undefined,
  stats: Record<string, unknown> | null | undefined
): string | null {
  if (!stats) return null;
  const defs = getStatsForPosition(sport, position);
  for (const def of defs) {
    if (!def.atMost) continue;
    const value = stats[def.key];
    const limit = stats[def.atMost];
    if (typeof value === "number" && typeof limit === "number" && value > limit) {
      const limitLabel = defs.find((d) => d.key === def.atMost)?.label ?? def.atMost;
      return `${def.label} no puede ser mayor que ${limitLabel.toLowerCase()}.`;
    }
  }
  return null;
}
