// Datos del Kit del Desguazador (Shipbreakers Toolkit) para Mothership.
// Genera _data/*.json a partir de las tablas del manual en español.
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { EXTRA, DIARIOS_NUEVOS, PAGINAS_EXTRA } from "./textos.mjs";

/* ------------------------------------------------------------------ */
/* Identificadores deterministas                                       */
/* ------------------------------------------------------------------ */
const usados = new Set();
const cache = new Map();
function id(semilla) {
  const clave = String(semilla);
  if (cache.has(clave)) return cache.get(clave);
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  const s = clave;
  for (let i = 0; i < s.length; i++) {
    h1 ^= s.charCodeAt(i); h1 = Math.imul(h1, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ s.charCodeAt(i), 2654435761) >>> 0;
  }
  const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  let a = h1, b = h2;
  for (let i = 0; i < 16; i++) {
    const v = i < 8 ? a : b;
    out += abc[(v >>> ((i % 8) * 4)) % 62];
    if (i === 3) a = (a ^ (b >>> 7)) >>> 0;
    if (i === 7) b = (b ^ (h1 >>> 11)) >>> 0;
  }
  let final = out;
  let n = 0;
  while (usados.has(final)) final = out.slice(0, 14) + abc[(n++) % 62] + abc[(n * 7) % 62];
  usados.add(final);
  cache.set(clave, final);
  return final;
}

const p = (t) => `<p>${t}</p>`;

/* ------------------------------------------------------------------ */
/* Naves                                                               */
/* ------------------------------------------------------------------ */
export const NAVES = [
  {
    clave: "asaltante",
    nombre: "Asaltante",
    modelo: "Aava Industrial S5 J1C-I",
    tipo: "Nave industrial",
    salto: 1, clase: 1,
    coste: "75MCR", casco: 0,
    pro: 20, bat: 5, sis: 5,
    trip: 8, cryo: 8, escape: 1, escapeTexto: "1 módulo ataúd",
    fuel: 12,
    anclajes: [0, 2], mejoras: [0, 4],
    mdmgBase: "1", mdmgTotal: "0*",
    eslora: "82 m (+17 m con módulo de mando)",
    armas: [],
    modulos: [],
    notas: [
      "Añadir una nave de desembarco a la Asaltante no aumenta su capacidad de tripulación.",
      "*Esta nave necesita un arma instalada para infligir 1 MDMG.",
      "Una nave de desembarco —u otra nave pequeña— acoplada a la proa puede servir de módulo de mando y permitir hacer escala en planetas mientras el resto de la nave sigue en órbita.",
    ],
    descripcion:
      "Una nave barata, poco más que un módulo habitacional orbital, la Asaltante es ideal para empresas sin fondos y quienes buscan pasar desapercibidos. Su diseño modular la hace muy popular entre criminales, piratas y cazarrecompensas.",
    cubiertas: [
      "Esclusa. Entrada principal con umbilical de atraque.",
      "Soporte vital/Mecánica. O2, control térmico, gravedad artificial.",
      "Cubiertas habitables y mando. 4 pequeñas cubiertas circulares unidas por una escalera.",
      "Puerto de proa. Permite acoplar cualquier nave de Clase 0, otros módulos o incluso contenedores de carga.",
      "Criocámara con 8 criocápsulas.",
      "Depósitos de combustible. Solo acceso exterior.",
      "Reactor externo sin blindaje. Radiación de nivel 2 (aguda). El reactor carece de cabina interior: solo se accede mediante actividad extravehicular (EVA).",
    ],
  },
  {
    clave: "transporte-ejecutivo",
    nombre: "Transporte ejecutivo",
    modelo: "Sato GS Grail VI J2C-I",
    tipo: "Transporte de pasajeros",
    salto: 2, clase: 1,
    coste: "350MCR", casco: 0,
    pro: 35, bat: 5, sis: 35,
    trip: 16, cryo: 16, escape: 4, escapeTexto: "4 cápsulas de escape",
    fuel: 14,
    anclajes: [0, 1], mejoras: [3, 3],
    mdmgBase: "1", mdmgTotal: "0*",
    eslora: "90 m",
    armas: [],
    modulos: [
      { nombre: "Acolchado de agar", coste: "600kcr", rasgo: "Criosueño reducido" },
      { nombre: "Reforma estética", coste: "100kcr+", rasgo: "Interiores de lujo" },
      { nombre: "Enfermería", coste: "250kcr", rasgo: "Descanso [+] a bordo" },
    ],
    notas: [
      "Las Salvaciones de descanso reducen +1 Estrés a bordo.",
      "*Esta nave necesita un arma instalada para infligir 1 MDMG.",
    ],
    descripcion:
      "Con motor de Salto-2, enfermería de última generación y camarotes espaciosos, el transporte ejecutivo es la envidia de la galaxia. Diseñado para llevar a altos directivos al núcleo y de vuelta, también suele servir de casino, complejo vacacional en miniatura o guarida de piratas hedonistas. Su gran inconveniente es que puede convertirse en un imán para piratas si no estás vinculado a una megacorporación.",
    cubiertas: [
      "Esclusa. Entrada principal con umbilical de atraque.",
      "Soporte vital/Mecánica. O2, control térmico, gravedad artificial.",
      "Alojamientos de la tripulación. Dos cubiertas para trabajo, enfermería, etc.",
      "Puerto de proa/Mando. Acoplable a naves de desembarco, Clase 0, módulos o contenedores de carga.",
      "Criocámara con 16 criocápsulas y módulo de ordenador.",
      "Cubiertas habitables. Dos cubiertas, cada una con seis camarotes de pasajeros y un camarote VIP con suite VIP.",
      "Reactor. Radiación de nivel 1 (trazas).",
    ],
  },
  {
    clave: "carguero",
    nombre: "Carguero",
    modelo: "Valecore T9LC Platypus J1C-II",
    tipo: "Carguero",
    salto: 1, clase: 2,
    coste: "250MCR", casco: 0,
    pro: 25, bat: 20, sis: 20,
    trip: 12, cryo: 12, escape: 1, escapeTexto: "1 cápsula de escape",
    fuel: 12,
    anclajes: [0, 1], mejoras: [1, 4],
    mdmgBase: "1d5", mdmgTotal: "0*",
    eslora: "119 m",
    armas: [],
    modulos: [{ nombre: "Bodega de contrabando", coste: "40kcr", rasgo: "Carga oculta" }],
    notas: [
      "La cubierta de carga principal es lo bastante amplia para usarse como hangar improvisado.",
      "*Esta nave debe tener un arma instalada para infligir 1d5 MDMG.",
    ],
    descripcion:
      "Con cincuenta contenedores de carga de 20 pies (6 metros), de unas 20 toneladas cada uno, el carguero es la columna vertebral de la galaxia. Admite tres cubiertas de carga separadas: una refrigerada, otra para materiales peligrosos y otra para mercancía seca.",
    cubiertas: [
      "Esclusa. Entrada con umbilical de atraque.",
      "Cubiertas habitables/Soporte vital. 7 cubiertas pequeñas con soporte vital, vivienda, trabajo, cocina y baños comunes.",
      "Módulo de mando. Pilotaje, comunicaciones, etc.",
      "Cubiertas de carga. Espacio para hasta cincuenta contenedores de carga de 20 pies.",
      "Criocámara con 12 criocápsulas.",
      "Reactor. Radiación de nivel 1 (trazas).",
    ],
  },
  {
    clave: "patrullera",
    nombre: "Patrullera",
    modelo: "Arma Type-19 J0C-II",
    tipo: "Patrullera",
    salto: 0, clase: 2,
    coste: "600MCR", casco: 0,
    pro: 30, bat: 32, sis: 15,
    trip: 12, cryo: 24, escape: 3, escapeTexto: "3 cápsulas de escape",
    fuel: 18,
    anclajes: [1, 2], mejoras: [0, 3],
    mdmgBase: "1d5", mdmgTotal: "1d5",
    eslora: "130 m",
    batBase: 30,
    armas: [{ nombre: "Cañón automático", bonus: 2, coste: "2.5mcr" }],
    modulos: [],
    clase0: [{ nombre: "Lancha de abordaje", cant: 1 }],
    notas: [
      "La mayoría de las patrulleras no salen de su sistema, por lo que carecen de motor de Salto.",
      "Las patrulleras que realizan tareas policiales rutinarias tienen [-] en las tiradas de Moral.",
      "Grupo de abordaje: 1d10+1 marines (soldado raso): C:30 Subfusil 2d10 DAÑO, I:25, H:2.",
    ],
    descripcion:
      "Según tu situación, la patrullera es tu peor enemigo o tu ansiado salvador. El espacio es vasto y se resiste al orden. La patrullera está hecha para mantener a todos a raya: acciones policiales, controles aduaneros, embargos comerciales y respuesta a señales de socorro.",
    cubiertas: [
      "Esclusa. Entrada principal con umbilical de atraque.",
      "Cubiertas de mando y control. Operaciones, soporte vital, módulo informático, armería, hangar y enfermería.",
      "Sistemas de armas. Acceso de mantenimiento.",
      "Cubiertas habitables. Oficiales, tropa, cocina y baños comunes.",
      "Criocámara con 12 criocápsulas y calabozo criogénico con 12 criocápsulas para prisioneros.",
      "Carga exterior. Hasta 8 contenedores de 20 pies (o 200 toneladas).",
      "Reactor. Radiación de nivel 1 (trazas).",
    ],
  },
  {
    clave: "cutter-salvamento",
    nombre: "Cúter de salvamento",
    modelo: "Sebaco RAS-62 J0C-III",
    tipo: "Cúter de salvamento",
    salto: 0, clase: 3,
    coste: "200MCR", casco: 0,
    pro: 15, bat: 21, sis: 20,
    trip: 8, cryo: 12, escape: 1, escapeTexto: "1 cápsula de escape",
    fuel: 6,
    anclajes: [1, 1], mejoras: [3, 4],
    mdmgBase: "1d5", mdmgTotal: "1d5",
    eslora: "140 m",
    batBase: 20,
    armas: [{ nombre: "Cañón láser", bonus: 1, coste: "2mcr" }],
    modulos: [
      { nombre: "Hangar", coste: "1mcr", rasgo: "2 módulos utilitarios" },
      { nombre: "Enfermería", coste: "250kcr", rasgo: "Descanso [+] a bordo" },
      { nombre: "Taller", coste: "750kcr", rasgo: "Reparaciones en vuelo" },
    ],
    clase0: [{ nombre: "Módulo utilitario", cant: 2 }],
    notas: [
      "Gran celosía del chatarrero: muy modificable.",
      "La ley de salvamento otorga derecho a una recompensa proporcional a lo recuperado. No devolver el material se considera pillaje.",
    ],
    descripcion:
      "El cúter de salvamento rebusca por la vasta inmensidad del espacio, pecio a pecio. Es la nave ideal para quienes disfrutan de la calma del vacío salpicada de momentos de puro terror. Lleva una tripulación reducida, que a menudo debe adentrarse en grandes pecios sin saber qué causó su fin ni si aún acecha dentro.",
    cubiertas: [
      "Esclusa. Entrada principal con umbilical de atraque.",
      "Criocámara con 12 criocápsulas.",
      "Cubiertas habitables. 5 cubiertas con vivienda, trabajo, cocina y baños comunes.",
      "Puerto de atraque. Remolca naves de hasta Clase V.",
      "Taller y Enfermería.",
      "Módulo de mando. Pilotaje, comunicaciones, etc.",
      "Soporte vital. O2, control térmico, gravedad artificial.",
      "Hangar exterior. 2 módulos utilitarios.",
      "Carga exterior. Hasta ocho contenedores de 20 pies.",
      "Reactor externo sin blindaje. Radiación de nivel 2 (aguda).",
    ],
  },
  {
    clave: "corbeta",
    nombre: "Corbeta",
    modelo: "Gauss FAC-Grendel J1C-IV",
    tipo: "Nave de guerra",
    salto: 1, clase: 4,
    coste: "800MCR", casco: 1,
    pro: 25, bat: 37, sis: 20,
    trip: 60, cryo: 60, escape: 15, escapeTexto: "15 cápsulas de escape",
    fuel: 6,
    anclajes: [2, 3], mejoras: [2, 4],
    mdmgBase: "1d10", mdmgTotal: "1d10",
    eslora: "135 m",
    armas: [
      { nombre: "Lanzamisiles (ligero)", bonus: 3, coste: "3.6mcr" },
      { nombre: "Cañón automático", bonus: 2, coste: "2.5mcr" },
    ],
    batBase: 30,
    modulos: [
      { nombre: "Hangar", coste: "1mcr", rasgo: "2 cazas y 1 nave de desembarco" },
      { nombre: "Enfermería", coste: "250kcr", rasgo: "Descanso [+] a bordo" },
    ],
    clase0: [{ nombre: "Caza", cant: 2 }, { nombre: "Nave de desembarco", cant: 1 }],
    notas: [
      "La Corbeta inflige el mayor MDMG, empatada con el Transporte de tropas.",
      "Suele llevar una sección de infantería mecanizada de unos 55 marines al mando de un 1.er teniente.",
    ],
    descripcion:
      "Una auténtica nave de guerra y la escolta más habitual en una flotilla. La Corbeta es un depredador letal en el espacio abierto y lleva armamento pesado, dos cazas y una nave de desembarco para incursiones planetarias. Es la primera nave de guerra de verdad que te encontrarás.",
    cubiertas: [
      "Esclusa. Entrada principal con umbilical de atraque.",
      "Módulo de mando y control. Sensores de tiro, navegación, soporte vital, operaciones.",
      "Cubiertas de operaciones. 3 cubiertas con enfermería, zona de trabajo, armería, calabozo y criocámara.",
      "Cubiertas habitables. Camarotes de oficiales, barracones de tropa, cocina y baños comunes.",
      "Hangar. Alberga x2 cazas y x1 nave de desembarco.",
      "Reactor. Radiación de nivel 1 (trazas).",
    ],
  },
  {
    clave: "jumpliner",
    nombre: "Jumpliner",
    modelo: "BAS-Lehman Contessa J1C-III",
    tipo: "Nave de pasajeros",
    salto: 1, clase: 3,
    coste: "425MCR", casco: 0,
    pro: 25, bat: 16, sis: 20,
    trip: 100, cryo: 500, escape: 50, escapeTexto: "50 cápsulas de escape",
    fuel: 12,
    anclajes: [1, 1], mejoras: [2, 2],
    mdmgBase: "1", mdmgTotal: "0*",
    eslora: "160 m",
    batBase: 15,
    armas: [{ nombre: "Sistema de defensa láser", bonus: 1, coste: "1.5mcr" }],
    modulos: [
      { nombre: "Acolchado de agar (solo 1.ª clase)", coste: "600kcr", rasgo: "Criosueño reducido" },
      { nombre: "Enfermería", coste: "250kcr", rasgo: "Descanso [+] a bordo" },
    ],
    notas: [
      "*Esta nave necesita un arma ofensiva instalada para infligir 1 MDMG (los sistemas de defensa láser solo sirven para defenderse).",
      "Además de las mejoras indicadas, el Contessa cuenta con varias mejoras estéticas: crucero con todas las comodidades.",
    ],
    descripcion:
      "Ya sea entre planetas o entre estrellas, los colosales Jumpliners te llevan si tienes los créditos. Los pasajeros de tercera clase suelen entrar en una criocápsula y subir a bordo como carga; el resto dispone de camarote privado, comidas y ocio durante los tramos del viaje fuera del hiperespacio.",
    cubiertas: [
      "Esclusa principal de embarque. Entrada principal con umbilical de atraque.",
      "Hábitats. Literas, camarotes de 2.ª clase, salón, cocina y criosueño.",
      "Módulo de mando y operaciones. Pilotaje, comunicaciones, camarote del capitán y soporte vital.",
      "Hábitats. Enfermería, servicios y criosueño a bordo.",
      "Anillo de primera clase. Comidas, ocio y suites privadas.",
      "Crio de tercera clase.",
      "Colmena de androides y equipaje.",
      "Reactor. Radiación de nivel 1 (trazas).",
    ],
  },
  {
    clave: "transporte-tropas",
    nombre: "Transporte de tropas",
    modelo: "Tannhäuser Hōshō J3C-V",
    tipo: "Transporte de tropas",
    salto: 3, clase: 5,
    coste: "2.5BCR", casco: 1,
    pro: 25, bat: 41, sis: 25,
    trip: 48, cryo: 400, escape: 100, escapeTexto: "100 cápsulas de escape",
    fuel: 24,
    anclajes: [3, 4], mejoras: [2, 5],
    mdmgBase: "1d10", mdmgTotal: "1d10",
    eslora: "260 m",
    batBase: 30,
    armas: [
      { nombre: "Lanzamisiles (ligero)", bonus: 3, coste: "3.6mcr" },
      { nombre: "Cañón automático", bonus: 2, coste: "2.5mcr" },
      { nombre: "Cañón automático", bonus: 2, coste: "2.5mcr" },
    ],
    modulos: [
      { nombre: "Hangar 1", coste: "1mcr", rasgo: "4 lanchas de abordaje" },
      { nombre: "Hangar 2", coste: "1mcr", rasgo: "4 cazas" },
    ],
    clase0: [{ nombre: "Lancha de abordaje", cant: 4 }, { nombre: "Caza", cant: 4 }],
    notas: [
      "La mayoría de los marines despiertan del criosueño ya eyectados en sus cápsulas de desembarco. Nunca ven el interior de la nave.",
      "Suele llevar un batallón de infantería móvil de unos 350 marines al mando de un coronel.",
    ],
    descripcion:
      "Diseñado para transportar cientos de marines y desplegarlos de inmediato, el transporte de tropas es una base de operaciones volante. Enviado a pacificar colonias enteras, lleva potencia de fuego más que suficiente para cumplir su misión.",
    cubiertas: [
      "Esclusa de abordaje. Entrada principal con umbilical de atraque.",
      "Cubiertas de mando y control. 4 cubiertas para sensores de tiro, navegación, soporte vital y operaciones.",
      "Cubiertas de carga. Transportan 45 contenedores.",
      "Hangar exterior. Aloja x4 naves de desembarco.",
      "Hangar interior. Aloja x4 cazas.",
      "Cubiertas del reactor, mecánica y servicios. 4 cubiertas con mantenimiento, preparación, armería y trabajo. Radiación de nivel 1.",
      "Criocubiertas. 7 cubiertas con 400 criocápsulas.",
    ],
  },
  {
    clave: "exploracion",
    nombre: "Nave de exploración",
    modelo: "NorthStar Paragon J4C-V",
    tipo: "Nave de exploración",
    salto: 4, clase: 5,
    coste: "750MCR", casco: 0,
    pro: 20, bat: 27, sis: 40,
    trip: 48, cryo: 200, escape: 12, escapeTexto: "12 cápsulas de escape",
    fuel: 120,
    anclajes: [2, 2], mejoras: [4, 5],
    mdmgBase: "1d5", mdmgTotal: "1d5",
    eslora: "260 m",
    batBase: 25,
    armas: [
      { nombre: "Cañón láser", bonus: 1, coste: "2mcr" },
      { nombre: "Sistema de defensa láser", bonus: 1, coste: "1.5mcr" },
    ],
    modulos: [
      { nombre: "Laboratorio", coste: "300kcr", rasgo: "Investigación y análisis" },
      { nombre: "Enfermería", coste: "250kcr", rasgo: "Descanso [+] a bordo" },
      { nombre: "Escáneres de espacio profundo", coste: "1mcr", rasgo: "+1 banda de detección" },
      { nombre: "Hangar", coste: "1mcr", rasgo: "2 naves de desembarco" },
    ],
    clase0: [{ nombre: "Nave de desembarco", cant: 2 }],
    notas: [
      "La nave de investigación sirve para todo. Debe llevar más carga que un carguero y defenderse bien en combate.",
      "Caben 200 personas en criosueño. Espera que ninguna despierte por el camino, o no habrá oxígeno para todos.",
    ],
    descripcion:
      "Entre tomar muestras, explorar planetas y rastrear extrañas señales del espacio profundo, las naves de exploración lo han visto todo. Y eso no siempre es bueno. Es ideal para la primera oleada de colonos: espacio para materiales de construcción, terraformadores y las herramientas necesarias para sobrevivir.",
    cubiertas: [
      "Esclusa. Entrada principal con umbilical de atraque.",
      "Módulo de mando. Pilotaje, comunicaciones, operaciones, control de misión, etc.",
      "Módulos habitables. 2 cubiertas con viviendas, espacios de trabajo y zonas comunes.",
      "Hangar. 2 lanchas, 12 cápsulas de escape; apresto y taller.",
      "Criocámara de la tripulación. 48 criocápsulas para la tripulación operativa.",
      "Criocubiertas. 2 con 76 cápsulas cada una: colonos a largo plazo.",
      "Laboratorios y Enfermería.",
      "Cubiertas de carga. 2 cubiertas con capacidad para cuarenta contenedores de 20 pies cada una.",
      "Soporte vital. Hidroponía, agricultura, generación de oxígeno.",
      "Reactor. Radiación de nivel 1 (trazas).",
    ],
  },
  {
    clave: "desembarco",
    nombre: "Nave de desembarco",
    modelo: "Mérida Arcane-1",
    tipo: "Nave de desembarco (Clase 0)",
    salto: 0, clase: 0,
    coste: "50MCR", casco: 0,
    pro: 0, bat: 0, sis: 0,
    trip: 12, cryo: 0, escape: 0, escapeTexto: "—",
    fuel: 0,
    anclajes: [0, 0], mejoras: [0, 0],
    mdmgBase: "0", mdmgTotal: "0",
    eslora: "17 m de eslora, 8 m de altura",
    armas: [],
    modulos: [],
    notas: [
      "Capacidad de tripulación: 12+2. Cabina con 2 plazas.",
      "Su bodega admite un contenedor de carga de 20 pies (6 metros), un TBP o 12 tripulantes más.",
      "Permite viajar entre planetas, pero su escasa capacidad de combustible y su nula capacidad de combate la convierten en el último recurso.",
    ],
    descripcion:
      "La nave de desembarco es el vehículo estándar de inserción planetaria, diseñado para llevar tripulaciones y pelotones a la superficie de un planeta, asteroide o luna. Autonomía: 2 meses.",
    cubiertas: [
      "Cabina con 2 plazas.",
      "Bodega: un contenedor de carga de 20 pies, un TBP o 12 tripulantes más.",
      "Vehículo de inserción planetaria; sin capacidad de combate.",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Mejoras                                                             */
/* ------------------------------------------------------------------ */
export const MEJORAS = [
  { n: "Acolchado de agar", mayor: false, coste: "600kcr", inst: "2 semanas", rasgo: "Criosueño reducido",
    d: "Criocápsulas mejoradas que reducen el mal del criosueño de 1 semana a 1d10 horas. Las Características y salvaciones solo empiezan a deteriorarse tras diez años en criosueño, y entonces solo la mitad." },
  { n: "Inhibidor de comunicaciones", mayor: false, coste: "450kcr", inst: "1 semana", rasgo: "Interferir comunicaciones",
    d: "Tirada de Sistemas (alcance de disparo): permite interferir y escuchar comunicaciones." },
  { n: "Bodega de contrabando", mayor: false, coste: "40kcr", inst: "1 mes", rasgo: "Carga oculta",
    d: "Bodega de carga pequeña y oculta. Muy difícil de detectar durante un abordaje." },
  { n: "Reforma estética", mayor: false, coste: "100kcr+", inst: "1+ meses", rasgo: "Interiores",
    d: "Mejora del aspecto interior de la nave: pintura, mobiliario y decoración." },
  { n: "Criocámara", mayor: false, coste: "250kcr", inst: "2 semanas", rasgo: "Criocápsulas 24×Clase",
    d: "Aumenta el número de criocápsulas hasta 24 por Clase de nave (p. ej., una Clase III podría tener hasta 72)." },
  { n: "Reactor dedicado", efecto: { systems: 10 }, mayor: false, coste: "450kcr", inst: "1 mes", rasgo: "+10 Sistemas",
    d: "Otorga +10 a Sistemas." },
  { n: "Escáneres de espacio profundo", mayor: false, coste: "1mcr", inst: "2 semanas", rasgo: "+1 banda de detección",
    d: "Amplía todo alcance de detección en 1 banda de alcance (lo que antes podías escanear a alcance de contacto, ahora puedes escanearlo a alcance de disparo, etc.)." },
  { n: "Sistemas de emergencia", mayor: false, coste: "1mcr", inst: "1 mes", rasgo: "Energía de emergencia",
    d: "Proporciona energía y soporte vital de emergencia para 1 mes. Debe sustituirse tras su uso." },
  { n: "Depósito ampliado", efecto: { fuel: 12 }, mayor: false, coste: "750kcr", inst: "3 semanas", rasgo: "+12 Combustible máx.",
    d: "Aumenta la capacidad de combustible máxima en 12." },
  { n: "Módulo habitable", mayor: false, coste: "350kcr", inst: "1 mes", rasgo: "Tripulación 24×Clase",
    d: "Aumenta la capacidad de tripulación hasta 24 por Clase de nave (p. ej., una Clase IV podría alojar hasta 96)." },
  { n: "Taller", mayor: false, coste: "750kcr", inst: "3 semanas", rasgo: "Reparaciones en vuelo",
    d: "Permite reparar hasta 3 MDMG y 3 de Casco sin volver a puerto. Reabastecimiento: 200kcr." },
  { n: "Enfermería", mayor: false, coste: "250kcr", inst: "3 semanas", rasgo: "Descanso [+]",
    d: "Las salvaciones de descanso a bordo tienen [+]. Otros tratamientos médicos, a criterio del Guardián." },
  { n: "Placas reforzadas", efecto: { hull: 1 }, mayor: false, coste: "2mcr", inst: "1 mes", rasgo: "Casco máximo 1",
    d: "Aumenta el Casco máximo a 1." },
  { n: "Laboratorio", mayor: false, coste: "300kcr", inst: "3 semanas", rasgo: "Investigación",
    d: "Permite investigar, estudiar, analizar y experimentar con muestras en detalle." },

  { n: "Blindaje adaptativo", efecto: { hull: 2 }, mayor: true, coste: "10mcr", inst: "1 mes", rasgo: "Casco máximo 2",
    d: "Aumenta el Casco máximo a 2." },
  { n: "IA mejorada", efecto: { systems: 15 }, mayor: true, coste: "10mcr", inst: "1 semana", rasgo: "+15 Sistemas",
    d: "Otorga +15 a Sistemas." },
  { n: "Estructura ampliada", efecto: { upgrades: 5 }, mayor: true, coste: "20mcr", inst: "2 meses", rasgo: "+5 Mejoras",
    d: "Reformas estructurales. Otorga +5 Mejoras." },
  { n: "Hangar de naves/drones", mayor: true, coste: "1mcr", inst: "1 mes", rasgo: "4 naves Clase 0",
    d: "Permite alojar y mantener 4 naves de Clase 0." },
  { n: "Anclaje", efecto: { hardpoints: 1 }, mayor: true, coste: "2mcr", inst: "2 semanas", rasgo: "+1 Anclaje",
    d: "Otorga +1 Anclaje. Cada Anclaje adicional cuesta 3× el anterior." },
  { n: "Radiadores mejorados", efecto: { thrusters: 15 }, mayor: true, coste: "3mcr", inst: "3 semanas", rasgo: "+15 Propulsores",
    d: "Otorga +15 a Propulsores." },
  { n: "Mayor potencia de MDMG", efecto: { mdmgUp: 1 }, mayor: true, coste: "25mcr", inst: "1 mes", rasgo: "MDMG 1→1d5 o 1d5→1d10",
    d: "Aumenta el Megadaño de 1 a 1d5, o de 1d5 a un máximo de 1d10 MDMG." },
  { n: "Motor de Salto-1", mayor: true, coste: "5mcr", inst: "1 mes", rasgo: "Salto 1",
    d: "Motor de Salto comercial estándar. Permite viajes de Salto-1." },
  { n: "Motor de Salto-2", mayor: true, coste: "20mcr", inst: "2 meses", rasgo: "Salto 2",
    d: "Motor de Salto militar estándar. Permite viajes de Salto-2." },
  { n: "Motor de Salto-3", mayor: true, coste: "40mcr", inst: "3 meses", rasgo: "Salto 3",
    d: "Motor de Salto avanzado de largo alcance. Permite viajes de Salto-3." },
  { n: "Motor de Salto-4+", mayor: true, coste: "???", inst: "???", rasgo: "Salto 4+",
    d: "Motores de Salto muy experimentales. No se venden en el mercado abierto." },
  { n: "Sistemas redundantes", mayor: true, coste: "5mcr", inst: "1 mes", rasgo: "Ignora 1 MDMG",
    d: "Permite ignorar una tirada de Megadaño. Debe sustituirse tras su uso." },
  { n: "Reducción de firma", mayor: true, coste: "35mcr", inst: "1 mes", rasgo: "Detección difícil",
    d: "Mientras esté activa, solo se detecta tu nave con una tirada de Sistemas [-] exitosa a alcance de disparo. Duplica el gasto de combustible y la duración del viaje. No funciona en el espacio del Núcleo." },
  { n: "Inyectores de combustible optimizados", mayor: true, coste: "50mcr", inst: "1 mes", rasgo: "1 Combustible = 2 meses",
    d: "1 de Combustible dura 2 meses de viaje espacial. En la fase de movimiento, pujar 1 de Combustible cuenta como pujar 2." },
  { n: "Reforma de sistemas", efecto: { clase: 1 }, mayor: true, coste: "20mcr", inst: "3 meses", rasgo: "+1 Clase",
    d: "Reforma integral del casco y los sistemas. Aumenta la Clase de nave en 1." },
  { n: "Sensores de tiro", mayor: true, coste: "750kcr", inst: "2 semanas", rasgo: "[+] Batalla",
    d: "Tirada de Sistemas (alcance de disparo): otorga [+] a las tiradas de Batalla en combate nave contra nave." },
];

/* ------------------------------------------------------------------ */
/* Armas de nave                                                       */
/* ------------------------------------------------------------------ */
export const ARMAS = [
  { n: "Cañón automático", coste: "2.5mcr", bonus: 2, d: "Armamento balístico cinético." },
  { n: "Contramedidas electrónicas", coste: "5mcr", bonus: 1, defensiva: true, d: "Impone [-] a las tiradas de MDMG de la nave enemiga." },
  { n: "Cañón láser", coste: "2mcr", bonus: 1, d: "Potente haz láser para desguazar pecios y cortar asteroides." },
  { n: "Sistema de defensa láser", coste: "1.5mcr", bonus: 1, defensiva: true, d: "Ignora la bonificación de MDMG de los lanzamisiles enemigos. Si es tu única arma, no infliges MDMG en combate naval (ni el enemigo recibe MDMG adicional al fallar tiradas de Batalla)." },
  { n: "Lanzamisiles (ligero)", coste: "3.6mcr", bonus: 3, d: "Lanzador de misiles ligeros." },
  { n: "Lanzamisiles (pesado)", coste: "7mcr", bonus: 5, mdmgExtra: 1, d: "Lanzador de misiles pesados. Otorga +1 MDMG." },
  { n: "Haz de partículas", coste: "3mcr", bonus: 1, d: "El enemigo debe superar una tirada de Sistemas o subir su nivel de radiación en 1." },
  { n: "Cañón de riel", coste: "6.2mcr", bonus: 2, d: "Puede dispararse al alcance de detección." },
];

/* ------------------------------------------------------------------ */
/* Naves de Clase 0                                                    */
/* ------------------------------------------------------------------ */
export const CLASE0 = [
  { n: "Lancha de abordaje", coste: "20MCR", cap: "12", aut: "1 semana",
    d: "Puede acoplarse a naves enemigas al alcance de contacto e introducir por la fuerza un grupo de abordaje. El enemigo puede hacer una tirada de Batalla para resistirse." },
  { n: "Módulo ataúd", coste: "1MCR", cap: "4", aut: "2 años en crio",
    d: "Módulo de aterrizaje planetario. Su lanzador de un solo uso permite devolver el módulo de mando a órbita, pero carece de otros medios de navegación. Cabe en un contenedor de carga estándar de 20 pies." },
  { n: "Nave de desembarco", coste: "50MCR", cap: "24 (12 si lleva un TBP o contenedor)", aut: "2 meses",
    d: "Vehículo de inserción planetaria. Su bodega tiene espacio para un contenedor de carga de 20 pies o un TBP." },
  { n: "Cápsula de escape", coste: "5MCR", cap: "4", aut: "40 años en crio",
    d: "En aterrizajes bruscos (en tierra firme), cada pasajero debe superar una Salvación de Cuerpo o sufrir 1 Herida. Mejora: módulo de descenso pesado (HDP) (+7mcr), que lleva hasta 12 personas, resiste aterrizajes bruscos e inyecta un estimulante automáticamente al aterrizar." },
  { n: "Caza", coste: "75MCR", cap: "2", aut: "1 semana pilotado / 6 meses en crio",
    d: "Cada caza otorga +1 a Batalla a la nave que lo transporta (máx. +10)." },
  { n: "Módulo utilitario", coste: "2.5MCR", cap: "2", aut: "1 mes",
    d: "Vehículo de reparación y mantenimiento espacial. Equipado con 2 brazos robóticos y un cortador láser. No permite aterrizajes planetarios." },
];

export const VEHICULOS = [
  { n: "Transporte blindado de personal Comoco «Sawtooth»", coste: "3MCR",
    d: "Centro de mando móvil y transporte de tropas para movilización planetaria. Tripulación 2 (40 plazas), RD 10, PA 20, Vel. máx. 100 kph / 60 mph, autonomía 1 semana. Resiste atmósferas tóxicas y corrosivas y está preparado para el vacío. Equipado con lanzagranadas de humo trasero, GPMG y mortero ligero (1d10×10 DAÑO). El centro de mando interior cuenta con comunicaciones de largo alcance y sensores térmicos." },
  { n: "Cápsula de desembarco pesada (HDP)", coste: "12MCR",
    d: "Capacidad: 2 marines con equipo completo. Autonomía: 40 años en crio. Diseñada para soportar aterrizajes bruscos y asaltos planetarios. Al tomar tierra, se administran estimulantes a los marines automáticamente." },
  { n: "Contenedor de carga estándar (20 pies)", coste: "—",
    d: "Contenedor de 6 metros y unas 20 toneladas. Cabe en la bodega de un carguero, de una nave de desembarco o en un módulo ataúd. Peso máximo: ~2500 kg." },
  { n: "Kit de reabastecimiento de armas", coste: "100kcr (Clase I)",
    d: "Tras un enfrentamiento en el que hayas usado las armas de tu nave debes reabastecerte. Si no lo haces, tus tiradas de Batalla tendrán [-] en el siguiente combate; a partir de entonces fallarás automáticamente todas las tiradas de Batalla. Multiplica el coste por la Clase de tu nave." },
];

/* ------------------------------------------------------------------ */
/* Averías de mantenimiento (d100)                                     */
/* ------------------------------------------------------------------ */
export const AVERIAS = [
  [0, false, "Hedor rancio en los camarotes."],
  [1, false, "Caos por todas partes."],
  [2, false, "Comunicaciones con estática."],
  [3, false, "Sistema eléctrico defectuoso."],
  [4, false, "Acoplamientos sueltos."],
  [5, false, "Contrabando oculto (muy ilegal)."],
  [6, false, "Piloto automático averiado."],
  [7, false, "Fugas en los sistemas hidráulicos."],
  [8, false, "Crujidos en el casco."],
  [9, false, "Mamparos dañados."],
  [10, false, "Abrazaderas de atraque desalineadas."],
  [11, false, "Visores obstruidos."],
  [12, false, "Esclusas exteriores atascadas."],
  [13, false, "Placas de gravedad averiadas."],
  [14, false, "Incumplimiento de la normativa."],
  [15, false, "Mandos atascados."],
  [16, false, "Fuga de refrigerante."],
  [17, false, "Cardán propulsor mal calibrado."],
  [18, false, "Un sinfín de infracciones de seguridad laboral."],
  [19, false, "Rejillas de ventilación obstruidas."],
  [20, false, "Solo hay alumbrado de emergencia."],
  [21, false, "Problemas de red interna."],
  [22, false, "Recogida de datos imprecisa."],

  [23, true, "Fuga de oxígeno. Si escasea el O₂, pierde 1d5 más al día."],
  [24, true, "Posquemadores limitados. -2d10 Propulsores."],
  [25, true, "Tara. Mantenimiento con [-]."],
  [26, true, "Aceleración lenta. +1 semana de viaje."],
  [27, true, "Navegación imprecisa."],
  [28, true, "Sensores de tiro descalibrados. -1d10 Batalla."],
  [29, true, "Criocápsulas defectuosas. Pesadillas. La crioenfermedad dura una semana más."],
  [30, true, "Cápsulas de escape averiadas."],
  [31, true, "No puede emitir señales de socorro."],
  [32, true, "Sistema de refrigeración saboteado."],
  [33, true, "Trampa mortal. [-] en todas las tiradas."],

  [34, false, "Patas de aterrizaje desgastadas."],
  [35, false, "Filtros de aire caducados."],
  [36, false, "Tuberías corroídas."],
  [37, false, "Navegación de transferencia orbital imprecisa."],
  [38, false, "Inyectores de combustible desgastados."],
  [39, false, "Alumbrado exterior inoperativo."],
  [40, false, "Intercomunicador defectuoso."],
  [41, false, "Reciclaje de residuos deficiente."],
  [42, false, "Propulsores de control de altitud defectuosos."],
  [43, false, "Sistemas de reserva de soporte vital insuficientes."],
  [44, false, "Retardo en los relés de comunicaciones."],
  [45, false, "Conductos de combustible dañados."],
  [46, false, "Colectores de escape corroídos."],
  [47, false, "Pantallas de terminales averiadas."],
  [48, false, "El testigo de avería del motor no se apaga."],
  [49, false, "Sistemas de reserva averiados."],
  [50, false, "Cerraduras defectuosas."],
  [51, false, "Fallos en las comunicaciones."],
  [52, false, "Almacenes de alimentos contaminados."],
  [53, false, "Bancos de datos corruptos."],
  [54, false, "Puertas de la bodega atascadas."],
  [55, false, "Luces interiores parpadeantes."],
  [56, false, "Juntas de las esclusas defectuosas."],

  [57, true, "Fuga. Cada gasto consume +1 Combustible."],
  [58, true, "Fallo de Salto. 10%: dura 2d10 meses, no 2d10 días."],
  [59, true, "Frágil. Siempre sufre +1 MDMG."],
  [60, true, "Escudos térmicos agrietados."],
  [61, true, "Software obsoleto. -1d10 Sistemas."],
  [62, true, "Filtrado de agua deficiente. Parásitos en el suministro de agua."],
  [63, true, "Sistema de gestión de residuos averiado."],
  [64, true, "Reactores de fusión sobrecalentados."],
  [65, true, "Filtro de radiación averiado."],
  [66, true, "Fuga de radiación. Toda la nave tiene un nivel de radiación 2."],

  [67, false, "Sistema de guiado mal calibrado."],
  [68, false, "Acumuladores de energía sobrecargados."],
  [69, false, "Sensores defectuosos."],
  [70, false, "Sistema de recuperación de agua averiado."],
  [71, false, "Casco dañado por micrometeoritos."],
  [72, false, "Unidad de eliminación de CO₂ defectuosa."],
  [73, false, "Paneles solares degradados."],
  [74, false, "Fallo del ordenador por radiación cósmica."],
  [75, false, "Circuitos sobrecargados."],
  [76, false, "Propulsor de plasma defectuoso."],
  [77, false, "Fallo del sistema de gestión térmica."],
  [78, false, "Cortes eléctricos intermitentes."],
  [79, false, "Sistema antiincendios fuera de normativa."],
  [80, false, "Paneles del suelo dañados."],
  [81, false, "Lámpara rota en un pasillo apartado."],
  [82, false, "Bomba de refrigerante dañada."],
  [83, false, "Visores agrietados."],
  [84, false, "Sistemas saturados de malware."],
  [85, false, "Válvula de combustible con fugas."],
  [86, false, "Salida de escape obstruida."],
  [87, false, "Conducto de residuos atascado."],
  [88, false, "Ascensores averiados."],
  [89, false, "Antena de comunicaciones dañada."],

  [90, true, "Filtros de aire obstruidos. Capacidad de tripulación a la mitad."],
  [91, true, "Climatización averiada. Siempre a 85 ºF / 29 ºC."],
  [92, true, "Sin energía de emergencia."],
  [93, true, "Estructura débil. -1 Casco, -1 Mejora."],
  [94, true, "Vertido químico tóxico."],
  [95, true, "Malos escáneres. Acércate una banda de alcance más."],
  [96, true, "Documentación falsa. Nave robada. Se ofrece recompensa por ella."],
  [97, true, "IA corrupta."],
  [98, true, "Los núcleos warp fallan el 10% de las veces."],
  [99, true, "Chatarra oxidada. Todo lo que puede salir mal, sale mal. +1 Estrés mínimo a la tripulación."],
];

/* ------------------------------------------------------------------ */
/* Tablas                                                              */
/* ------------------------------------------------------------------ */
export const TABLAS = [
  {
    clave: "averias",
    nombre: "Averías de mantenimiento (d100)",
    img: "modules/mr-kit-desguazador/assets/iconos/averia.webp",
    descripcion: p("Tira 1d100. Los resultados 23-33, 57-66 y 90-99 son <strong>reparaciones mayores</strong>; el resto son <strong>menores</strong>. Con un fallo crítico en la tirada de mantenimiento, tira dos veces."),
    formula: "1d100-1",
    resultados: AVERIAS.map(([num, mayor, texto]) => ({
      rango: [num, num],
      texto: `<strong>${String(num).padStart(2, "0")}</strong> · ${texto}${mayor ? " <em>(mayor)</em>" : ""}`,
      enlace: { pack: "averias", clave: `averia-${num}` },
    })),
  },
  {
    clave: "megadanio",
    nombre: "Megadaño (MDMG)",
    img: "modules/mr-kit-desguazador/assets/iconos/megadanio.webp",
    descripcion: p("El Megadaño combina el Daño y las Heridas de un personaje. Súmalo al MDMG acumulado, marca el nuevo total y aplica el efecto indicado. Con 9 o más MDMG la nave queda destruida."),
    formula: "1d10-1",
    resultados: [
      { rango: [0, 0], texto: "Todos los sistemas normales. 5×5. Listos para partir." },
      { rango: [1, 1], texto: "Fuga de combustible de emergencia. Cada vez que gastas combustible, gastas 1 más." },
      { rango: [2, 2], texto: "Armas inactivas. Fallas automáticamente las tiradas de Batalla." },
      { rango: [3, 3], texto: "Sin navegación. No puedes hacer tiradas de Propulsores. 10% de perder todos los datos de navegación." },
      { rango: [4, 4], texto: "Incendio en cubierta. El fuego se extiende por la nave creando una atmósfera tóxica (por inhalación de humo) y muy corrosiva (10 DAÑO/asalto) en las zonas en llamas." },
      { rango: [5, 5], texto: "Brecha en el casco. Todos: Salvación de Cuerpo o 1 Herida (Explosión); fallo crítico: al espacio." },
      { rango: [6, 6], texto: "Sin soporte vital. Oxígeno: 1d10 × tripulación máxima." },
      { rango: [7, 7], texto: "Fuga radiactiva. Sube cada 2d10 min." },
      { rango: [8, 8], texto: "A la deriva. Solo energía de emergencia." },
      { rango: [9, 9], texto: "¡Evacuad! Nave destruida en 1d10 min." },
    ],
  },
  {
    clave: "socorro",
    nombre: "Señales de socorro (d10)",
    img: "modules/mr-kit-desguazador/assets/iconos/socorro.webp",
    descripcion: p("Cuando actives la energía de emergencia, te encierres en criocápsulas y emitas una señal de socorro, tira en esta tabla."),
    formula: "1d10-1",
    resultados: [
      { rango: [0, 0], texto: "00 · 2d10 semanas. Eres de los afortunados." },
      { rango: [1, 2], texto: "01-02 · 2d10 meses. Nota: revisar la política de la Compañía sobre salarios atrasados en caso de crioemergencia." },
      { rango: [3, 4], texto: "03-04 · 2d10 años. Supera una Salvación de Cuerpo o pierde 1d5 en todas las Características y Salvaciones." },
      { rango: [5, 5], texto: "05 · 2d10 décadas. Supera una Salvación de Cuerpo [-] o pierde 1d10 en todas las Características y Salvaciones." },
      { rango: [6, 9], texto: "06-09 · Nunca. La nave flota sin fin en el vacío del espacio, que todo lo devora. Gracias por jugar a Mothership." },
    ],
  },
  {
    clave: "quiebra",
    nombre: "Salvación de Quiebra (d4)",
    img: "modules/mr-kit-desguazador/assets/iconos/quiebra.webp",
    descripcion: p("Como propietario-operador tienes una Salvación de Quiebra (2d10+10). Cada año o trimestre haz una salvación y consulta el resultado."),
    formula: "1d4-1",
    resultados: [
      { rango: [0, 0], texto: "Éxito crítico · Obtienes un pequeño beneficio. Elige: compra 1 mejora mayor para la nave; resuelve 1d5 reparaciones mayores; paga 1d5×100kcr a cada tripulante; aumenta tu Salvación de Quiebra en 1d10." },
      { rango: [1, 1], texto: "Éxito · Vas tirando. Elige: compra 1 mejora menor para la nave; compra 1 reparación menor para la nave; paga a cada tripulante 2d10 meses de salario; aumenta tu Salvación de Quiebra en 1d5." },
      { rango: [2, 2], texto: "Fallo · Debes 1d10mcr a prestamistas sin escrúpulos." },
      { rango: [3, 3], texto: "Fallo crítico · La empresa quiebra y debe una fortuna a la peor gente imaginable." },
    ],
  },
  {
    clave: "contrabando",
    nombre: "Contrabando de la patrullera (d10)",
    img: "modules/mr-kit-desguazador/assets/iconos/contrabando.webp",
    descripcion: p("1d5 contenedores llenos de... (inspecciones aduaneras de la Patrullera Arma Type-19)."),
    formula: "1d10-1",
    resultados: [
      { rango: [0, 0], texto: "00 · Fauna exótica: 10% de probabilidad de animales vivos." },
      { rango: [1, 1], texto: "01 · Personas: 00 siervos por contrato; 01-03 prisioneros; 04-06 refugiados; 07-08 colonos (con acuerdo de confidencialidad); 09 rebeldes anticorporativos." },
      { rango: [2, 2], texto: "02 · Androides." },
      { rango: [3, 3], texto: "03 · Propiedad intelectual: películas, cómics, música." },
      { rango: [4, 4], texto: "04 · Bienes culturales: arte, pornografía, libros prohibidos." },
      { rango: [5, 5], texto: "05 · Armas: 70% armas cortas civiles, 29% armas militares, 1% armamento experimental prohibido." },
      { rango: [6, 6], texto: "06 · Falsificaciones: 00 productos alimentarios; 01-03 medios de ocio; 04-06 ropa, zapatillas; 07-08 documentos, etiquetas de marca; 09 joyas y accesorios." },
      { rango: [7, 7], texto: "07 · Medicinas, equipo y fármacos vitales." },
      { rango: [8, 8], texto: "08 · Bienes robados: coches, comida, artículos de lujo." },
      { rango: [9, 9], texto: "09 · Material peligroso." },
    ],
  },
  {
    clave: "restos",
    nombre: "Restos valiosos del cúter (d10)",
    img: "modules/mr-kit-desguazador/assets/iconos/restos.webp",
    descripcion: p("Qué encuentra un cúter de salvamento al desguazar un pecio."),
    formula: "1d10-1",
    resultados: [
      { rango: [0, 0], texto: "00 · Criocápsulas. Alguien las valoraba." },
      { rango: [1, 1], texto: "01 · Núcleos warp. Difíciles de rastrear, fáciles de usar." },
      { rango: [2, 2], texto: "02 · Naves de Clase 0: sus antiguos dueños pagan bien por cápsulas de escape, naves de desembarco y cazas intactos." },
      { rango: [3, 3], texto: "03 · Carga: si valía la pena enviarla, vale la pena recuperarla." },
      { rango: [4, 4], texto: "04 · Chatarra: hasta un pecio desvalijado vale algo." },
      { rango: [5, 5], texto: "05 · Mineral: puedes convertir pérdidas netas en ganancias netas." },
      { rango: [6, 7], texto: "06-07 · Datos: investigación, navegación, diarios de a bordo, manifiesto." },
      { rango: [8, 8], texto: "08 · Armas: un lanzamisiles pesado se puede reinstalar." },
      { rango: [9, 9], texto: "09 · Mejoras: una enfermería operativa siempre se puede reutilizar." },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Generación de documentos                                            */
/* ------------------------------------------------------------------ */
const ahora = 1735689600000; // 1 de enero de 2025, fijo para builds reproducibles

function stats(ship) {
  return {
    armor: { value: ship.casco, min: 0, max: 99, label: "Casco", rollLabel: "Salvación de Casco" },
    combat: { value: 10, min: 0, max: 99, label: "Combate", rollLabel: "Tirada de Combate" },
    intellect: { value: 10, min: 0, max: 99, label: "Intelecto", rollLabel: "Tirada de Intelecto" },
    speed: { value: 10, min: 0, max: 99, label: "Velocidad", rollLabel: "Tirada de Velocidad" },
    thrusters: { value: ship.pro, min: 0, max: 99, label: "Propulsores", rollLabel: "Salvación de Propulsores" },
    battle: { value: ship.bat, min: 0, max: 99, label: "Batalla", rollLabel: "Salvación de Batalla" },
    systems: { value: ship.sis, min: 0, max: 99, label: "Sistemas", rollLabel: "Salvación de Sistemas" },
    bankruptcy: { value: 20, min: 0, max: 99, label: "Quiebra", rollLabel: "Salvación de Quiebra" },
  };
}

function naveDoc(ship) {
  const docId = id(`nave:${ship.clave}`);
  const items = [];

  const comprobar = (etiqueta, real, esperado) => {
    if (real !== esperado) throw new Error(`${ship.nombre}: ${etiqueta} ${real} ≠ ${esperado} del manual`);
  };
  comprobar("anclajes usados", ship.armas.length, ship.anclajes[0]);
  comprobar("mejoras instaladas", ship.modulos.length, ship.mejoras[0]);
  const bonusArmas = ship.armas.reduce((a, w) => a + w.bonus, 0);
  const cazas = (ship.clase0 ?? []).filter((c) => c.nombre === "Caza").reduce((a, c) => a + c.cant, 0);
  const batBase = ship.batBase ?? ship.bat;
  comprobar("Batalla (base + armas + cazas)", batBase + bonusArmas + Math.min(10, cazas), ship.bat);

  for (const [i, arma] of ship.armas.entries()) {
    const def = ARMAS.find((a) => a.n === arma.nombre) ?? {};
    items.push({
      _id: id(`nave-item:${ship.clave}:arma:${i}`),
      name: arma.nombre,
      type: "weapon",
      img: "modules/mr-kit-desguazador/assets/iconos/arma.webp",
      system: {
        description: p(`Arma de nave instalada en el ${ship.nombre}. Bonificación +${arma.bonus} a Batalla.`),
        damage: "", ammo: 0, shots: 0, curShots: 0, shotsPerFire: 1, useAmmo: false,
        ammoType: "", wound: "", critDmg: "", woundEffect: "",
        bonus: arma.bonus, weight: 0, cost: 0,
        ranges: { short: 0, medium: 0, long: 0, value: "" },
        settings: { firstEdition: true },
      },
      effects: [], folder: null, sort: 100000 + i, ownership: { default: 0 },
      flags: { "mr-kit-desguazador": { armaNave: true, bonus: arma.bonus, ...(def.defensiva ? { defensiva: true } : {}), ...(def.mdmgExtra ? { mdmgExtra: def.mdmgExtra } : {}) } },
    });
  }

  for (const [i, mod] of ship.modulos.entries()) {
    const base = MEJORAS.find((m) => mod.nombre === m.n || mod.nombre.startsWith(`${m.n} `) || (mod.nombre.startsWith("Hangar") && m.n === "Hangar de naves/drones"));
    items.push({
      _id: id(`nave-item:${ship.clave}:modulo:${i}`),
      name: mod.nombre,
      type: "module",
      img: "modules/mr-kit-desguazador/assets/iconos/mejora.webp",
      system: {
        description: p(base ? base.d : `${mod.nombre} instalado en el ${ship.nombre}.`) + (mod.rasgo ? p(`<strong>En esta nave:</strong> ${mod.rasgo}.`) : ""),
        quantity: 1, hull: 1, totalHull: 1, feature: mod.rasgo || "", offline: false, cost: 0, weight: 0,
      },
      effects: [], folder: null, sort: 200000 + i, ownership: { default: 0 },
      flags: { "mr-kit-desguazador": { mejora: true, ...(base?.efecto ? { efecto: base.efecto } : {}) } },
    });
  }

  for (const [i, c] of (ship.clase0 ?? []).entries()) {
    const def = CLASE0.find((x) => x.n === c.nombre);
    items.push({
      _id: id(`nave-item:${ship.clave}:clase0:${i}`),
      name: c.nombre,
      type: "item",
      img: "modules/mr-kit-desguazador/assets/iconos/clase0.webp",
      system: {
        description: p(def.d) + p(`<strong>Capacidad:</strong> ${def.cap} · <strong>Autonomía:</strong> ${def.aut}`),
        quantity: c.cant, weight: 0, cost: 0,
      },
      effects: [], folder: null, sort: 300000 + i, ownership: { default: 0 },
      flags: { "mr-kit-desguazador": { clase0: true, caza: c.nombre === "Caza" } },
    });
  }

  return {
    _id: docId,
    name: ship.nombre,
    type: "ship",
    img: `modules/mr-kit-desguazador/assets/naves/${ship.clave}.webp`,
    system: {
      biography: p(ship.descripcion) +
        (ship.cubiertas.length ? "<h3>Plano de cubierta</h3><ol>" + ship.cubiertas.map((c) => `<li>${c}</li>`).join("") + "</ol>" : "") +
        (ship.notas.length ? "<h3>Notas</h3><ul>" + ship.notas.map((n) => `<li>${n}</li>`).join("") + "</ul>" : "") +
        (EXTRA[ship.clave] ?? ""),
      description: ship.descripcion,
      type: ship.tipo,
      class: String(ship.clase),
      make: `${ship.modelo}\n${ship.tipo} · Salto ${ship.salto} · Clase ${ship.clase} · Eslora ${ship.eslora}\nCoste: ${ship.coste} · Casco: ${ship.casco}`,
      transponder: true,
      runSetup: false,
      images: { layout: `modules/mr-kit-desguazador/assets/planos/${ship.clave}.webp`, beauty: `modules/mr-kit-desguazador/assets/naves/${ship.clave}.webp` },
      stats: stats(ship),
      supplies: {
        hull: { value: ship.casco, max: ship.casco, 75: 0, 50: 0, 25: 0 },
        fuel: { value: ship.fuel, max: ship.fuel },
        stock: { value: 0, max: 0 },
        crew: { value: ship.trip, max: ship.trip },
        oxygen: { value: 0 },
        "warp-cores": { value: ship.salto > 0 ? 2 : 0 },
        cryopods: { value: ship.cryo },
        "escape-pods": { value: ship.escape },
        upgrades: { value: ship.mejoras[0], max: ship.mejoras[1] },
      },
      "weapon-stats": {
        weapons: { value: 0, max: bonusArmas },
        megadamage: { value: ship.mdmgBase, max: ship.mdmgTotal },
        hardpoints: { value: ship.anclajes[0], max: ship.anclajes[1] },
      },
      megadamage: { html: "", hits: [], menu: { html: "" }, open: false },
    },
    items,
    effects: [],
    folder: null,
    sort: 100000 + ship.clase * 1000 + NAVES.indexOf(ship),
    flags: {
      "mr-kit-desguazador": {
        nave: ship.clave,
        modelo: ship.modelo,
        salto: ship.salto,
        clase: ship.clase,
        coste: ship.coste,
        eslora: ship.eslora,
        batallaBase: batBase,
        tripulacion: ship.trip,
        cascoBase: ship.casco,
        mdmgBase: ship.mdmgBase,
        aplicado: { battle: bonusArmas + Math.min(10, cazas) },
        anclajesMax: ship.anclajes[1],
        mejorasMax: ship.mejoras[1],
        escapeTexto: ship.escapeTexto,
        notas: ship.notas,
        cubiertas: ship.cubiertas,
        ...(EXTRA[ship.clave] ? { extra: EXTRA[ship.clave] } : {}),
      },
    },
    ownership: { default: 0 },
    _stats: { systemId: "mosh", systemVersion: "0.6.1", coreVersion: "13", createdTime: ahora, modifiedTime: ahora },
  };
}

function mejoraDoc(m, i) {
  return {
    _id: id(`mejora:${m.n}`),
    name: m.n,
    type: "module",
    img: "modules/mr-kit-desguazador/assets/iconos/mejora.webp",
    system: {
      description: p(m.d) + p(`<strong>Coste:</strong> ${m.coste} · <strong>Instalación:</strong> ${m.inst}`),
      quantity: 1, hull: 1, totalHull: 1, feature: m.rasgo, offline: false, cost: 0, weight: 0,
    },
    effects: [], folder: null, sort: 100000 + i,
    flags: { "mr-kit-desguazador": { mayor: m.mayor, coste: m.coste, instalacion: m.inst, rasgo: m.rasgo, ...(m.efecto ? { efecto: m.efecto } : {}) } },
    ownership: { default: 0 },
    _stats: { systemId: "mosh", systemVersion: "0.6.1", coreVersion: "13", createdTime: ahora, modifiedTime: ahora },
  };
}

function armaDoc(a, i) {
  return {
    _id: id(`arma:${a.n}`),
    name: a.n,
    type: "weapon",
    img: "modules/mr-kit-desguazador/assets/iconos/arma.webp",
    system: {
      description: p(a.d) + p(`<strong>Coste:</strong> ${a.coste} (× Clase de nave) · <strong>Bonificación:</strong> +${a.bonus} a Batalla · Ocupa 1 Anclaje y requiere 2 semanas de instalación en puerto.`),
      damage: "", ammo: 0, shots: 0, curShots: 0, shotsPerFire: 1, useAmmo: false,
      ammoType: "", wound: "", critDmg: "", woundEffect: "",
      bonus: a.bonus, weight: 0, cost: 0,
      ranges: { short: 0, medium: 0, long: 0, value: "" },
      settings: { firstEdition: true },
    },
    effects: [], folder: null, sort: 100000 + i,
    flags: { "mr-kit-desguazador": { coste: a.coste, bonus: a.bonus, armaNave: true, ...(a.defensiva ? { defensiva: true } : {}), ...(a.mdmgExtra ? { mdmgExtra: a.mdmgExtra } : {}) } },
    ownership: { default: 0 },
    _stats: { systemId: "mosh", systemVersion: "0.6.1", coreVersion: "13", createdTime: ahora, modifiedTime: ahora },
  };
}

function clase0Doc(c, i) {
  return {
    _id: id(`clase0:${c.n}`),
    name: c.n,
    type: "item",
    img: "modules/mr-kit-desguazador/assets/iconos/clase0.webp",
    system: {
      description: p(c.d) + p(`<strong>Coste:</strong> ${c.coste} · <strong>Capacidad:</strong> ${c.cap} · <strong>Autonomía:</strong> ${c.aut}`),
      quantity: 1, weight: 0, cost: 0,
    },
    effects: [], folder: null, sort: 100000 + i,
    flags: { "mr-kit-desguazador": { clase0: true, coste: c.coste, capacidad: c.cap, autonomia: c.aut } },
    ownership: { default: 0 },
    _stats: { systemId: "mosh", systemVersion: "0.6.1", coreVersion: "13", createdTime: ahora, modifiedTime: ahora },
  };
}

function vehiculoDoc(v, i) {
  return {
    _id: id(`vehiculo:${v.n}`),
    name: v.n,
    type: "item",
    img: "modules/mr-kit-desguazador/assets/iconos/vehiculo.webp",
    system: { description: p(v.d) + p(`<strong>Coste:</strong> ${v.coste}`), quantity: 1, weight: 0, cost: 0 },
    effects: [], folder: null, sort: 100000 + i,
    flags: { "mr-kit-desguazador": { vehiculo: true, coste: v.coste } },
    ownership: { default: 0 },
    _stats: { systemId: "mosh", systemVersion: "0.6.1", coreVersion: "13", createdTime: ahora, modifiedTime: ahora },
  };
}

/** Averías con efecto numérico sobre la nave (dados que se tiran al añadirla; «mitad» = la mitad de la tripulación). */
const EFECTOS_AVERIA = {
  24: { thrusters: "2d10" }, // Posquemadores limitados: -2d10 Propulsores
  28: { battle: "1d10" }, // Sensores de tiro descalibrados: -1d10 Batalla
  61: { systems: "1d10" }, // Software obsoleto: -1d10 Sistemas
  90: { crew: "mitad" }, // Filtros de aire obstruidos: capacidad de tripulación a la mitad
  93: { hull: 1, upgrades: 1 }, // Estructura débil: -1 Casco, -1 Mejora
};

function averiaDoc([num, mayor, texto], i) {
  return {
    _id: id(`averia:${num}`),
    name: `${String(num).padStart(2, "0")} · ${texto.split(".")[0]}`,
    type: "repair",
    img: "modules/mr-kit-desguazador/assets/iconos/averia.webp",
    system: { description: p(texto) + p(mayor ? "<strong>Reparación mayor.</strong> Solo puede realizarse en puerto. Cuesta 1d5mcr × Clase de la nave." : "<strong>Reparación menor.</strong> Unos 2d10 días de trabajo a bordo."), quantity: 1, major: mayor },
    effects: [], folder: null, sort: 100000 + i,
    flags: { "mr-kit-desguazador": { numero: num, mayor, ...(EFECTOS_AVERIA[num] ? { efecto: EFECTOS_AVERIA[num] } : {}) } },
    ownership: { default: 0 },
    _stats: { systemId: "mosh", systemVersion: "0.6.1", coreVersion: "13", createdTime: ahora, modifiedTime: ahora },
  };
}

function tablaDoc(t, i) {
  const tablaId = id(`tabla:${t.clave}`);
  const resultados = t.resultados.map((r, j) => ({
    _id: id(`tabla-result:${t.clave}:${j}`),
    type: "text",
    img: t.img,
    weight: 1,
    range: r.rango,
    drawn: false,
    description: r.enlace
      ? `${r.texto}<br><br>@UUID[Compendium.mr-kit-desguazador.averias.Item.${id(`averia:${r.enlace.clave.replace("averia-", "")}`)}]{Avería de mantenimiento}`
      : r.texto,
    name: "",
    flags: {},
  }));
  return {
    _id: tablaId,
    name: t.nombre,
    img: t.img,
    description: t.descripcion,
    formula: t.formula,
    replacement: true,
    displayRoll: true,
    results: resultados.map((r) => r._id),
    _resultados: resultados,
    folder: null,
    sort: 100000 + i,
    ownership: { default: 0 },
    flags: { "mr-kit-desguazador": { tabla: t.clave } },
    _stats: { systemId: "mosh", systemVersion: "0.6.1", coreVersion: "13", createdTime: ahora, modifiedTime: ahora },
  };
}

/* ------------------------------------------------------------------ */
/* Diarios                                                             */
/* ------------------------------------------------------------------ */
const h2 = (t) => `<h2>${t}</h2>`;
const h3 = (t) => `<h3>${t}</h3>`;
const ul = (xs) => `<ul>${xs.map((x) => `<li>${x}</li>`).join("")}</ul>`;
const table = (cab, filas) => `<table><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

export const DIARIOS = [
  {
    clave: "introduccion",
    nombre: "Kit del Desguazador · Introducción",
    paginas: [
      {
        nombre: "Qué incluye este módulo",
        html:
          h2("El Kit del Desguazador") +
          p("Este módulo lleva a Foundry VTT todo el contenido del <em>Shipbreakers Toolkit</em> de Mothership en español: naves, mejoras, armas, naves de Clase 0, averías, tablas, reglas de viaje, combate y reparaciones, y los ejemplos de juego.") +
          h3("Contenido") +
          ul([
            "Las 10 naves del manual (Asaltante, Transporte ejecutivo, Carguero, Patrullera, Cúter de salvamento, Corbeta, Jumpliner, Transporte de tropas, Nave de exploración y Nave de desembarco) con sus características, armas, mejoras, naves de Clase 0 a bordo, plano de cubierta y reglas propias.",
            "30 mejoras (14 menores y 16 mayores) y 8 armas de nave.",
            "6 naves de Clase 0 y 4 vehículos o equipos.",
            "Las 100 averías de mantenimiento del d100 (69 menores y 31 mayores) como objetos <em>repair</em>.",
            "Tablas de averías, megadaño, señales de socorro, quiebra, contrabando y restos valiosos.",
            "Diarios con las reglas del manual, los costes de viaje y los ejemplos de juego.",
            "Una ficha de nave propia con las tiradas, el disparo, el reabastecimiento y el megadaño integrados, la calculadora de viaje y billetes, y las macros de mantenimiento, socorro, quiebra y moral.",
          ]) +
          h3("Cómo empezar") +
          p("Abre el compendio <strong>Naves</strong> e importa la nave que quieras. La nave se abre con la ficha del Kit: pulsa <strong>Propulsores, Batalla o Sistemas</strong> para tirar, el <strong>nombre de un arma</strong> para disparar y arrastra a los personajes a la ficha para añadirlos a la tripulación. También puedes usar las macros del compendio <strong>Macros del Kit del Desguazador</strong> desde la barra de acceso rápido.") +
          p("Cuando añadas armas, mejoras o naves de Clase 0 a una nave del Kit, el módulo recalcula sus cifras (anclajes, mejoras, Batalla, MDMG y los efectos de las mejoras). Puedes desactivarlo en los ajustes del módulo."),
      },
    ],
  },
  {
    clave: "estadisticas",
    nombre: "Estadísticas de la nave",
    paginas: [
      {
        nombre: "Características, clase y casco",
        html:
          h2("Características de la nave") +
          p("La nave tiene tres Características que también funcionan como Salvaciones:") +
          ul([
            "<strong>Propulsores:</strong> maniobrar y acelerar con seguridad en el espacio.",
            "<strong>Batalla:</strong> apuntar y atacar a otras naves en combate nave contra nave.",
            "<strong>Sistemas:</strong> sensores, ordenadores, mantenimiento y demás subsistemas.",
          ]) +
          p("Las naves hacen tiradas de Característica como los personajes, pero cada vez que una nave falla una, <strong>todos a bordo ganan 1 de Estrés</strong>. Un resultado de 90-99 siempre es un fallo.") +
          h3("Éxitos y fallos críticos") +
          p("Si una nave obtiene un fallo crítico en una tirada de Característica, todos a bordo deben hacer una tirada de Pánico. Los éxitos críticos funcionan como de costumbre.") +
          h3("Habilidades") +
          p("Cuando proceda, puedes sumar tu bonificación de habilidad a una tirada de Característica de la nave. Solo una persona puede aportar su bonificación a cada tirada.") +
          h3("Clase de nave") +
          table(["Clase", "Descripción", "Ejemplo"], [
            ["0", "Lanzaderas.", "Lanzadera, caza, asalto."],
            ["I", "Comercial ligera.", "Asaltante, transporte ejecutivo."],
            ["II", "Comercial media.", "Carguero, patrullera."],
            ["III", "Comercial pesada.", "Cúter de salvamento, Jumpliner."],
            ["IV", "Militar ligera.", "Corbeta."],
            ["V", "Militar media.", "Exploradora, de tropas."],
          ]) +
          p("La clase suele abreviarse junto al nivel de Salto: <strong>J1C-II</strong> es una nave de Salto 1 y Clase II.") +
          h3("Casco y combates imposibles") +
          p("El Casco funciona como los Puntos de armadura de un personaje, pero para naves. Tu nave ignora todo MDMG inferior a su Casco. Si recibe MDMG igual o superior a su Casco de un solo impacto, el casco queda destruido y la nave sufre el MDMG restante.") +
          p("Tienes [+] en todas las tiradas de Batalla y MDMG contra naves 1 Clase inferior a la tuya. Las naves 2 o más Clases superiores a las enemigas son invencibles en un enfrentamiento directo, salvo que el Guardián decida lo contrario."),
      },
    ],
  },
  {
    clave: "viajes",
    nombre: "Viajes espaciales",
    paginas: [
      {
        nombre: "Duración, combustible y saltos",
        html:
          h2("Viajes interplanetarios") +
          p("Pueden durar desde unas semanas hasta un planeta cercano hasta varios años hasta el confín del sistema. Se realizan con los propulsores y consumen <strong>1 unidad de combustible por mes</strong> de viaje espacial. El combustible se paga por adelantado al decidir el destino. Cambiar de rumbo cuesta 1 de Combustible.") +
          h3("Alcance y distancia") +
          table(["Alcance", "Distancia", "Tiempo de viaje"], [
            ["Contacto", "De planeta a órbita cercana.", "Minutos."],
            ["Disparo", "De planeta a luna, estación o campo de asteroides.", "De horas a días."],
            ["Detección", "De planeta a planeta lejano.", "De semanas a meses."],
          ]) +
          h3("Viajes interestelares") +
          p("Para viajar a otros sistemas necesitas una nave con motor de Salto. Cada Salto al hiperespacio consume <strong>1 núcleo warp</strong> y dura <strong>2d10 días</strong>. Antes de entrar en el hiperespacio la nave debe llegar a un punto de Salto: suele llevar 2 semanas.") +
          h3("Costes de combustible") +
          table(["Acción", "Combustible"], [
            ["Encender propulsores (al mes)", "1 Combustible"],
            ["Intento de evasión (alcance de contacto)", "3 de combustible"],
            ["Intento de evasión (alcance de disparo)", "2 de combustible"],
            ["Intento de evasión (alcance de detección)", "1 Combustible"],
            ["Salto al hiperespacio", "1 núcleo warp"],
          ]) +
          h3("Repostar y abastecer") +
          table(["Clase de fuel", "Coste/unidad", "Arma", "Coste C-I"], [
            ["Combustible de Clase I", "1kcr", "Cañón automático", "100kcr"],
            ["Combustible de Clase II", "2kcr", "Láseres", "50kcr"],
            ["Combustible de Clase III", "5kcr", "Misiles ligeros", "200kcr"],
            ["Fuel de Clase IV", "50kcr", "Misiles pesados", "300kcr"],
            ["Fuel de Clase V", "100kcr", "Haz de partículas", "75kcr"],
            ["Núcleo warp", "1mcr", "Cañón de riel", "400kcr"],
          ]) +
          p("Cada Clase de nave usa un tipo de Combustible distinto. Puedes trasvasar combustible de una nave de clase inferior en proporción 2:1, o de una superior en proporción 1:2.") +
          h3("Dilatación temporal") +
          p("Los efectos relativistas de viajar más rápido que la luz son inciertos y parecen aleatorios. Una tripulación puede volver de un Salto-3 y descubrir que han pasado varios años, mientras que otras regresan apenas unos segundos después de partir."),
      },
    ],
  },
  {
    clave: "deteccion",
    nombre: "Detección, alcance y comunicaciones",
    paginas: [
      {
        nombre: "Bandas de alcance y escáneres",
        html:
          h2("Alcance") +
          p("En encuentros con otras naves, la distancia se mide de forma abstracta en tres bandas de alcance:") +
          ul([
            "<strong>Detección:</strong> las naves están en el mismo sistema estelar. La comunicación es lenta. No suelen suponer una amenaza de combate. Pueden detectar el tamaño y la trayectoria de las demás.",
            "<strong>Disparo:</strong> las naves están a semanas de distancia. Pueden comunicarse con cierta latencia y hay riesgo de combate.",
            "<strong>Contacto:</strong> las naves están a pocos días de distancia. Pueden comunicarse sin latencia y hay riesgo de combate y abordaje.",
          ]) +
          h3("Escaneo y sensores") +
          table(["Alcance", "Información revelada"], [
            ["Detección", "Presencia, trayectoria, tamaño aproximado, datos emitidos por el transpondedor (con demora)."],
            ["Disparo", "Rumbo, transpondedor, clase y tipo."],
            ["Contacto", "Trayectoria, datos del transpondedor, clase de nave, tipo, presencia de formas de vida, estado de la nave."],
          ]) +
          h3("Comunicaciones") +
          table(["Alcance", "Latencia"], [
            ["Contacto", "Ninguna."],
            ["Disparo", "Segundos."],
            ["Detección", "De minutos a horas."],
            ["Más allá", "De horas a días o más (si llega)."],
          ]) +
          p("El <strong>transpondedor</strong> es un sistema de radio automático que emite sin cesar el indicativo, el nombre del capitán, el tipo, la clase, el puerto de origen, el destino y más. En la mayoría de los sistemas estelares es ilegal (o muy sospechoso) apagarlo."),
      },
    ],
  },
  {
    clave: "socorro",
    nombre: "Señales de socorro",
    paginas: [
      {
        nombre: "Tabla de señales de socorro",
        html:
          h2("Señales de socorro") +
          p("A veces tendrás que activar la energía de emergencia, encerraros en criocápsulas, emitir una señal de socorro y esperar ayuda. Es poco probable que funcione, pero a veces es tu única opción. Tira 1d10:") +
          table(["D10", "Tiempo de respuesta"], [
            ["00", "2d10 semanas. Eres de los afortunados."],
            ["01-02", "2d10 meses. Nota: revisar la política de la Compañía sobre salarios atrasados en caso de crioemergencia."],
            ["03-04", "2d10 años. Supera una Salvación de Cuerpo o pierde 1d5 en todas las Características y Salvaciones."],
            ["05", "2d10 décadas. Supera una Salvación de Cuerpo [-] o pierde 1d10 en todas las Características y Salvaciones."],
            ["06-09", "Nunca. La nave flota sin fin en el vacío del espacio, que todo lo devora. Gracias por jugar a Mothership."],
          ]) +
          p("En el módulo tienes la tabla <strong>Señales de socorro (d10)</strong> y la macro correspondiente, que además aplica la pérdida de características si procede."),
      },
    ],
  },
  {
    clave: "combate",
    nombre: "Combate nave contra nave",
    paginas: [
      {
        nombre: "Rondas, movimiento, ataque y moral",
        html:
          h2("Rondas de naves") +
          p("Cada ronda consta de tres fases: <strong>Movimiento</strong>, <strong>Ataque</strong> y <strong>Moral</strong>. Dura de unos minutos a unas horas según la distancia. La mayoría de los combates terminan en una ronda; casi ninguno dura más de 3.") +
          h3("Fase de movimiento") +
          p("Las naves deciden si intentan evadir o perseguir a las demás, o si mantienen el rumbo. Después deciden cuánto combustible adicional están dispuestas a quemar. Cada bando revela su elección y hace una tirada de Propulsores: quien haya gastado más combustible obtiene [+]. Con un éxito logras tu objetivo y aumentas o reduces en una banda de alcance la distancia. Con un éxito crítico avanzas aunque el enemigo también tenga éxito; con un fallo crítico, el enemigo avanza aunque falles. Cualquier otro resultado es un empate.") +
          p("Si mantienes el rumbo no gastas combustible adicional, pero el enemigo logra su objetivo sin tirar (aunque gasta el combustible que haya quemado).") +
          table(["Intento de evasión", "Coste de combustible"], [
            ["Contacto", "3 Combustible"],
            ["Disparo", "2 Combustible"],
            ["Detección", "1 Combustible"],
          ]) +
          h3("Fase de ataque") +
          p("Al final de la fase de movimiento, todas las naves a alcance de disparo o menor eligen un objetivo y hacen una tirada de Batalla:") +
          table(["Resultado", "Efecto"], [
            ["Éxito crítico", "La nave inflige el doble de MDMG."],
            ["Éxito", "La nave inflige MDMG."],
            ["Fallo", "La nave sufre 1 MDMG además del MDMG que inflija el enemigo."],
            ["Fallo crítico", "La nave sufre 2 MDMG además del MDMG que inflija el enemigo."],
          ]) +
          p("Si una nave no tiene armas o están desconectadas, falla automáticamente todas las tiradas de Batalla y sus oponentes tienen éxito automático.") +
          h3("Fase de moral") +
          p("Tras cada asalto en el que un enemigo sufra MDMG, este debe hacer una tirada de Moral: tira 1d10. Si saca menos que su MDMG actual, puede enviar una llamada para ofrecer un alto el fuego y reanudar las negociaciones.") +
          h3("Informe tras la batalla") +
          p("Tras un enfrentamiento en el que tu nave sufra MDMG, haz una tirada de Sistemas. Si fallas, tira en la tabla de averías de mantenimiento. Con un fallo crítico, tira dos veces."),
      },
    ],
  },
  {
    clave: "megadanio",
    nombre: "Megadaño",
    paginas: [
      {
        nombre: "Efectos del megadaño",
        html:
          h2("Megadaño (MDMG)") +
          p("El Megadaño combina el Daño y las Heridas de un personaje. Cuando tu nave sufra MDMG, súmalo al MDMG acumulado, marca el nuevo total y aplica el efecto indicado. Si acumula 9 o más MDMG, queda destruida.") +
          table(["MDMG", "Efecto"], [
            ["00", "Todos los sistemas normales. 5×5. Listos para partir."],
            ["01", "Fuga de combustible de emergencia. Cada vez que gastas combustible, gastas 1 más."],
            ["02", "Armas inactivas. Fallas automáticamente las tiradas de Batalla."],
            ["03", "Sin navegación. No puedes hacer tiradas de Propulsores. 10% de perder todos los datos de navegación."],
            ["04", "Incendio en cubierta. El fuego se extiende creando una atmósfera tóxica y muy corrosiva (10 DAÑO/asalto)."],
            ["05", "Brecha en el casco. Todos: Salvación de Cuerpo o 1 Herida (Explosión); fallo crítico: al espacio."],
            ["06", "Sin soporte vital. Oxígeno: 1d10 × tripulación máxima."],
            ["07", "Fuga radiactiva. Sube cada 2d10 min."],
            ["08", "A la deriva. Solo energía de emergencia."],
            ["09+", "¡Evacuad! Nave destruida en 1d10 min."],
          ]) +
          p("El módulo incluye la macro <strong>Megadaño</strong>: suma el MDMG al registro de la nave seleccionada y muestra el efecto correspondiente."),
      },
    ],
  },
  {
    clave: "reparar",
    nombre: "Reparar tu nave",
    paginas: [
      {
        nombre: "Mantenimiento y reparaciones",
        html:
          h2("Estado inicial") +
          p("Toda nave empieza con algo de desgaste. Cuando adquieras una nave, tira en la tabla de averías de mantenimiento para determinar <strong>1d5+1 reparaciones</strong>.") +
          h3("Mantenimiento rutinario") +
          p("Una vez al año, tu nave debe superar una tirada de mantenimiento: haz una tirada de Sistemas. Si tienes éxito, todo sigue funcionando con normalidad. Si fallas, tira en la tabla de averías y todos a bordo ganan 1 de Estrés. Con un fallo crítico, tira dos veces y todos a bordo hacen una tirada de Pánico. Un jefe de ingeniería dedicado puede otorgar [+], a criterio del Guardián.") +
          h3("Reparaciones menores") +
          p("Abarcan daños estéticos, limpieza y otras tareas que la tripulación puede realizar en vuelo. Llevan unos <strong>2d10 días</strong>. Si fallas la tirada, la reparación requiere más tiempo y recursos; con un fallo crítico, pasa a ser mayor y debe realizarse en puerto.") +
          h3("Reparaciones mayores") +
          p("Abarcan daños graves en la estructura o los sistemas, incluidos el Megadaño y el Casco. Cada punto de Casco o Megadaño cuenta como una reparación mayor independiente. Solo pueden realizarse en puerto y cada una cuesta <strong>1d5mcr × Clase de la nave</strong>."),
      },
    ],
  },
  {
    clave: "facturas",
    nombre: "¿Quién paga las facturas?",
    paginas: [
      {
        nombre: "Compañía, Ejército, propietarios y autónomos",
        html:
          h2("¿Quién paga las facturas?") +
          p("Todo lo relativo a las naves está fuera del alcance del ciudadano medio. O trabajas para la Compañía o el Ejército en una nave de su propiedad, o eres propietario-operador o autónomo y asumes la mayoría de los costes.") +
          table(["Gasto", "Compañía", "Militar", "Propietarios-operadores", "Autónomos"], [
            ["Salario", "✓", "✓", "✓", "—"],
            ["Peligrosidad", "Con aprobación", "✓", "Con aprobación", "—"],
            ["Plus de Salto", "Con aprobación", "✓", "Con aprobación", "—"],
            ["Pensión", "Solo a bordo", "A bordo y en la base", "Solo a bordo", "Solo a bordo"],
            ["Repostaje", "✓", "✓", "✓", "—"],
            ["Núcleos warp", "Con aprobación", "✓", "Con aprobación", "—"],
            ["Reparaciones", "Con aprobación", "✓", "—", "—"],
            ["Mejoras", "Con aprobación", "Con aprobación", "—", "—"],
            ["Formación en habilidades", "—", "Con aprobación", "—", "—"],
            ["Atención médica", "—", "A bordo y en la base", "—", "—"],
            ["Equipo", "Con aprobación", "Con aprobación", "—", "—"],
            ["Armas", "—", "✓", "—", "—"],
          ]) +
          h3("Salvaciones de Quiebra") +
          p("Como propietario-operador tienes una Salvación de Quiebra, cuyo valor inicial es <strong>2d10+10</strong>. Cada año —o trimestre, según decida tu Guardián— haz una Salvación de Quiebra y consulta el resultado en la tabla de Quiebra para determinar la salud financiera de la empresa.") +
          table(["Salvación", "Consecuencia"], [
            ["Éxito crítico", "Obtienes un pequeño beneficio. Elige: compra 1 mejora mayor; resuelve 1d5 reparaciones mayores; paga 1d5×100kcr a cada tripulante; aumenta tu Salvación de Quiebra en 1d10."],
            ["Éxito", "Vas tirando. Elige: compra 1 mejora menor; compra 1 reparación menor; paga a cada tripulante 2d10 meses de salario; aumenta tu Salvación de Quiebra en 1d5."],
            ["Fallo", "Debes 1d10mcr a prestamistas sin escrúpulos."],
            ["Fallo crítico", "La empresa quiebra y debe una fortuna a la peor gente imaginable."],
          ]),
      },
    ],
  },
  {
    clave: "armas",
    nombre: "Armas y naves de Clase 0",
    paginas: [
      {
        nombre: "Armamento naval y lanzaderas",
        html:
          h2("Armas de nave") +
          p("Cada arma equipada suma su bonificación a la Característica de Batalla de tu nave. Cada arma ocupa 1 Anclaje y requiere 2 semanas de instalación en puerto. Los costes indicados son para una nave de Clase I: multiplica por la Clase de tu nave.") +
          table(["Arma", "Coste", "Bonificación", "Descripción"], ARMAS.map((a) => [a.n, a.coste, `+${a.bonus}`, a.d])) +
          h2("Naves de Clase 0") +
          p("Diseñadas para recorrer distancias cortas entre naves, o entre una nave y la superficie de un planeta.") +
          table(["Nave", "Coste", "Capacidad", "Autonomía", "Descripción"], CLASE0.map((c) => [c.n, c.coste, c.cap, c.aut, c.d])),
      },
    ],
  },
  {
    clave: "mejoras",
    nombre: "Mejoras de nave",
    paginas: [
      {
        nombre: "Mejoras menores y mayores",
        html:
          h2("Mejoras") +
          p("Cada nave admite un número limitado de mejoras. Deben instalarse en un puerto de clase X, B o A. Los precios son para naves de Clase I: multiplica el coste por la Clase de tu nave.") +
          h3("Mejoras menores") +
          table(["Mejora", "Coste", "Instalación", "Descripción"], MEJORAS.filter((m) => !m.mayor).map((m) => [m.n, m.coste, m.inst, m.d])) +
          h3("Mejoras mayores") +
          table(["Mejora", "Coste", "Instalación", "Descripción"], MEJORAS.filter((m) => m.mayor).map((m) => [m.n, m.coste, m.inst, m.d])),
      },
    ],
  },
  {
    clave: "averias",
    nombre: "Averías de mantenimiento",
    paginas: [
      {
        nombre: "Tabla d100",
        html:
          h2("Averías de mantenimiento") +
          p("Tira 1d100. Los resultados <strong>23-33, 57-66 y 90-99</strong> son reparaciones mayores; el resto son menores. Con un fallo crítico en la tirada de mantenimiento, tira dos veces.") +
          h3("Reparaciones menores") +
          table(["d100", "Avería"], AVERIAS.filter((a) => !a[1]).map((a) => [String(a[0]).padStart(2, "0"), a[2]])) +
          h3("Reparaciones mayores") +
          table(["d100", "Avería"], AVERIAS.filter((a) => a[1]).map((a) => [String(a[0]).padStart(2, "0"), a[2]])),
      },
    ],
  },
  {
    clave: "naves",
    nombre: "Fichas técnicas de las naves",
    paginas: [
      {
        nombre: "Resumen comparativo",
        html:
          h2("Fichas técnicas") +
          p("Resumen de las naves incluidas en el módulo. Importa cualquiera desde el compendio <strong>Naves</strong>.") +
          table(
            ["Nave", "Modelo", "Clase/Salto", "PRO", "BAT", "SIS", "Trip.", "Cryo", "Fuel", "Escape", "Anclajes", "Mejoras", "MDMG", "Coste", "Casco", "Eslora"],
            NAVES.map((n) => [
              n.nombre, n.modelo, `${n.clase} / ${n.salto}`, n.pro, n.bat, n.sis, n.trip, n.cryo,
              n.fuel, n.escapeTexto, `${n.anclajes[0]}/${n.anclajes[1]}`, `${n.mejoras[0]}/${n.mejoras[1]}`,
              n.mdmgTotal, n.coste, n.casco, n.eslora,
            ]),
          ),
      },
    ],
  },
];

// Diarios nuevos y páginas añadidas (textos.mjs)
DIARIOS.splice(DIARIOS.findIndex((d) => d.clave === "naves"), 0, ...DIARIOS_NUEVOS);
for (const [clave, paginas] of Object.entries(PAGINAS_EXTRA)) DIARIOS.find((d) => d.clave === clave).paginas.push(...paginas);

function diarioDoc(d, i) {
  const idDiario = id(`diario:${d.clave}`);
  const pages = d.paginas.map((pg, j) => ({
    _id: id(`pagina:${d.clave}:${j}`),
    sort: 100000 + j * 10000,
    name: pg.nombre,
    type: "text",
    title: { show: true, level: 1 },
    image: {},
    text: { format: 1, content: pg.html },
    src: null,
    system: {},
    flags: {},
    _stats: { coreVersion: "13", systemId: null, systemVersion: null, createdTime: ahora, modifiedTime: ahora },
  }));
  return {
    _id: idDiario,
    name: d.nombre,
    pages: pages.map((pg) => pg._id),
    _paginas: pages,
    folder: null,
    sort: 100000 + i,
    ownership: { default: 0 },
    flags: { "mr-kit-desguazador": { diario: d.clave } },
    _stats: { systemId: "mosh", systemVersion: "0.6.1", coreVersion: "13", createdTime: ahora, modifiedTime: ahora },
  };
}

/* ------------------------------------------------------------------ */
/* Macros                                                              */
/* ------------------------------------------------------------------ */
export const MACROS = [
  { clave: "dossier", nombre: "Abrir ficha de la nave", img: "modules/mr-kit-desguazador/assets/iconos/dossier.webp",
    comando: "game.mrKit.macros.abrirDossier();",
    d: "Abre la ficha de la nave seleccionada o controlada, con todo el Kit integrado." },
  { clave: "mantenimiento", nombre: "Tirada de mantenimiento (SBT)", img: "modules/mr-kit-desguazador/assets/iconos/averia.webp",
    comando: "game.mrKit.macros.mantenimiento();",
    d: "Tirada de Sistemas contra el valor de la nave. Si falla, tira en la tabla de averías del Kit del Desguazador." },
  { clave: "megadanio", nombre: "Megadaño", img: "modules/mr-kit-desguazador/assets/iconos/megadanio.webp",
    comando: "game.mrKit.macros.megadanio();",
    d: "Tira 1d10 de megadaño y súmalo al registro de la nave seleccionada." },
  { clave: "socorro", nombre: "Señal de socorro", img: "modules/mr-kit-desguazador/assets/iconos/socorro.webp",
    comando: "game.mrKit.macros.socorro();",
    d: "Tira 1d10 en la tabla de señales de socorro del Kit con la tirada del sistema." },
  { clave: "quiebra", nombre: "Salvación de quiebra", img: "modules/mr-kit-desguazador/assets/iconos/quiebra.webp",
    comando: "game.mrKit.macros.quiebra();",
    d: "Tirada de Salvación de Quiebra con la tabla de consecuencias." },
  { clave: "moral", nombre: "Tirada de moral", img: "modules/mr-kit-desguazador/assets/iconos/moral.webp",
    comando: "game.mrKit.macros.moral();",
    d: "Tirada de moral de una nave enemiga: 1d10 menor que su MDMG actual." },
  { clave: "inicial", nombre: "Averías iniciales de la nave", img: "modules/mr-kit-desguazador/assets/iconos/averia.webp",
    comando: "game.mrKit.macros.averiasIniciales();",
    d: "Tira 1d5+1 averías de mantenimiento y las añade a la nave seleccionada." },
  { clave: "viaje", nombre: "Calculadora de viaje", img: "modules/mr-kit-desguazador/assets/iconos/viaje.webp",
    comando: "game.mrKit.macros.viaje();",
    d: "Calcula duración, combustible y núcleos warp de un trayecto." },
  { clave: "disparar", nombre: "Disparar con la nave", img: "modules/mr-kit-desguazador/assets/iconos/combate.webp",
    comando: "game.mrKit.macros.disparar();",
    d: "Tirada de Batalla de la nave seleccionada contra la nave marcada como objetivo (T); aplica el MDMG." },
  { clave: "reabastecer", nombre: "Reabastecer las armas", img: "modules/mr-kit-desguazador/assets/iconos/arma.webp",
    comando: "game.mrKit.macros.reabastecer();",
    d: "Reabastece las armas de la nave en puerto (coste por arma y Clase) y quita la penalización de Batalla." },
  { clave: "fin-combate", nombre: "Terminar el combate", img: "modules/mr-kit-desguazador/assets/iconos/combate.webp",
    comando: "game.mrKit.macros.terminarCombate();",
    d: "Anota si la nave ha usado sus armas y hay que reabastecerlas (si no, [-] en Batalla en el siguiente combate)." },
  { clave: "reparar", nombre: "Reparar casco y megadaño", img: "modules/mr-kit-desguazador/assets/iconos/taller.webp",
    comando: "game.mrKit.macros.reparar();",
    d: "Calcula el coste y el tiempo de reparar el casco y el MDMG de la nave." },
  { clave: "costes", nombre: "Costes de viaje y repostaje", img: "modules/mr-kit-desguazador/assets/iconos/credito.webp",
    comando: "game.mrKit.macros.costes();",
    d: "Muestra las tablas de costes de viaje, combustible y reabastecimiento de armas." },
];

/* ------------------------------------------------------------------ */
/* Escritura de _data                                                  */
/* ------------------------------------------------------------------ */
async function escribir() {
  await fs.mkdir("_data", { recursive: true });

  const naves = NAVES.map(naveDoc);
  const mejoras = MEJORAS.map(mejoraDoc);
  const armas = ARMAS.map(armaDoc);
  const clase0 = CLASE0.map(clase0Doc);
  const vehiculos = VEHICULOS.map(vehiculoDoc);
  const averias = AVERIAS.map(averiaDoc);
  const tablas = TABLAS.map(tablaDoc);
  const diarios = DIARIOS.map(diarioDoc);
  const macros = MACROS.map((m, i) => ({
    _id: id(`macro:${m.clave}`),
    name: m.nombre,
    type: "script",
    img: m.img,
    scope: "global",
    command: m.comando,
    author: null,
    folder: null,
    sort: 100000 + i,
    ownership: { default: 0 },
    flags: { "mr-kit-desguazador": { macro: m.clave, descripcion: m.d } },
    _stats: { systemId: "mosh", systemVersion: "0.6.1", coreVersion: "13", createdTime: ahora, modifiedTime: ahora },
  }));

  const salida = {
    naves,
    mejoras,
    "armas-nave": armas,
    "naves-clase-0": clase0,
    vehiculos,
    averias,
    tablas: tablas.map(({ _resultados, ...t }) => t),
    reglas: diarios.map(({ _paginas, ...d }) => d),
    macros,
  };

  for (const [nombre, docs] of Object.entries(salida)) {
    await fs.writeFile(`_data/${nombre}.json`, JSON.stringify(docs, null, 1));
    console.log(`_data/${nombre}.json → ${docs.length}`);
  }

  // Resultados y páginas se guardan aparte para el compilador de LevelDB.
  await fs.writeFile("_data/_resultados.json", JSON.stringify(
    Object.fromEntries(tablas.map((t) => [t._id, t._resultados])), null, 1));
  await fs.writeFile("_data/_paginas.json", JSON.stringify(
    Object.fromEntries(diarios.map((d) => [d._id, d._paginas])), null, 1));

  // Índice de referencias cruzadas (ids de averías) para las tablas.
  await fs.writeFile("_data/_indice.json", JSON.stringify({
    averias: Object.fromEntries(AVERIAS.map(([num]) => [num, id(`averia:${num}`)])),
    tablas: Object.fromEntries(TABLAS.map((t) => [t.clave, id(`tabla:${t.clave}`)])),
    naves: Object.fromEntries(NAVES.map((n) => [n.clave, id(`nave:${n.clave}`)])),
    mejoras: Object.fromEntries(MEJORAS.map((m) => [m.n, id(`mejora:${m.n}`)])),
    armas: Object.fromEntries(ARMAS.map((a) => [a.n, id(`arma:${a.n}`)])),
    macros: Object.fromEntries(MACROS.map((m) => [m.clave, id(`macro:${m.clave}`)])),
  }, null, 1));

  console.log(`Total: ${NAVES.length} naves, ${MEJORAS.length} mejoras, ${ARMAS.length} armas, ${CLASE0.length} naves Clase 0, ${AVERIAS.length} averías, ${TABLAS.length} tablas, ${DIARIOS.length} diarios, ${MACROS.length} macros.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) escribir().catch((e) => { console.error(e); process.exit(1); });
