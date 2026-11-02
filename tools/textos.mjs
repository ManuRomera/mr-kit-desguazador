// Textos del Shipbreakers Toolkit en español que complementan los datos de contenido.mjs:
// reglas propias de cada nave, diarios nuevos y páginas añadidas a diarios existentes.
const p = (t) => `<p>${t}</p>`;
const h3 = (t) => `<h3>${t}</h3>`;
const h4 = (t) => `<h4>${t}</h4>`;
const ul = (xs) => `<ul>${xs.map((x) => `<li>${x}</li>`).join("")}</ul>`;
const table = (cab, filas) => `<table><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

/** Árbol de unidades: cada nodo es «texto» o [texto, ...hijos]. */
const arbol = (nodos) => `<ul>${nodos.map((n) => (Array.isArray(n) ? `<li>${n[0]}${arbol(n.slice(1))}</li>` : `<li>${n}</li>`)).join("")}</ul>`;

/** Diálogo de ejemplo: [quién, texto]. */
const dialogo = (lineas) => lineas.map(([quien, texto]) => `<p><strong>${quien}:</strong> ${texto}</p>`).join("");

// Cada pelotón: 2 equipos de fuego de 4 marines.
const unidadPelotones = ["3 pelotones de fusileros", "2 pelotones de armas", "1 pelotón de apoyo"]
  .map((t) => [t, ["2 equipos de fuego por pelotón", "4 marines por equipo de fuego"]]);

const costesEjecutivo = table(["Objeto", "Coste"], [
  ["Suite privada (interplanetaria)", "20kcr"],
  ["Suite privada (interestelar)", "40kcr"],
  ["Fletamento (interplanetario)", "1mcr"],
  ["Fletamento (interestelar)", "2mcr"],
  ["Espacio de carga (por kg)", "50cr"],
  ["Remolque de nave (Clase II o inferior, máx. 1 nave)", "500kcr"],
]);

const costesJumpliner = table(["Viaje", "Servicio", "Coste"], [
  ["Interplanetario (nave de pasajeros de Salto 0, Clase III)", "Cubierta de tercera clase (solo criocápsula)", "1kcr"],
  ["", "Segunda clase (4 literas por camarote)", "2.5kcr"],
  ["", "Primera clase (camarote privado)", "10kcr"],
  ["", "Espacio de carga / espacio de hangar", "+5kcr / +250kcr"],
  ["", "A un planeta lejano / al límite del sistema", "×2 / ×4"],
  ["Interestelar (Jumpliner de Salto 1, Clase III)", "Cubierta de tercera clase (solo criocápsula)", "2kcr"],
  ["", "Segunda clase (camarote privado hasta el punto de Salto + crio)", "5kcr"],
  ["", "Primera clase (suite hasta Salto + criosueño)", "20kcr"],
  ["", "Espacio de carga / espacio de hangar", "+20kcr / +500kcr"],
  ["", "Billete de Salto 2 / Billete de Salto-3", "+10kcr / +30kcr"],
]);

/** Reglas y texto propios de cada nave (clave de nave → HTML). */
export const EXTRA = {
  "transporte-ejecutivo":
    h3("Costes de viaje") + costesEjecutivo +
    p("Otra ventaja del transporte ejecutivo es que su tripulación suele conocer los lujos que ofrece la periferia (y suele ser discreta). Su gran inconveniente es que puede convertirse en un imán para piratas si no estás vinculado a una megacorporación.") +
    p("En la periferia es tan habitual que sirva a capos del crimen organizado, funcionarios coloniales corruptos o mandos militares privados como a miembros de la Compañía."),

  carguero:
    h3("Cargueros errantes y de línea") +
    p("Los cargueros errantes operan sin itinerario fijo ni puerto de escala habitual y pueden atender necesidades inmediatas. Los de línea siguen rutas y horarios preestablecidos. Ambos cobran una tarifa fija de unos 20cr/kg por lo que transportan, sea cual sea su carga, aunque los errantes pueden cobrar un suplemento por destinos remotos o condiciones peligrosas.") +
    p("Consulta «¿Quién paga las facturas?» en el diario de reglas."),

  patrullera:
    h3("Inspecciones aduaneras") +
    p("Las patrulleras escanean y vigilan las naves de su sistema para detectar posibles sospechosas. Hay un 50% de probabilidad de que llamen a cualquier nave que viaje con el transpondedor apagado.") +
    p("Si la nave enciende el transpondedor y responde al interrogatorio, suele haber un 50% de probabilidad de que la patrullera exija abordar e inspeccionar visualmente la tripulación y la carga en busca de contrabando o, más bien, de un soborno.") +
    p("Las patrulleras que realizan tareas policiales rutinarias tienen [-] en las tiradas de Moral.") +
    p("<strong>Grupo de abordaje:</strong> 1d10+1 marines (soldado raso): C:30, subfusil 2d10 DAÑO, I:25, H:2.") +
    p("Tira en la tabla <strong>Contrabando de la patrullera (d10)</strong> para saber qué llevan los 1d5 contenedores.") +
    p("La patrullera es una nave militar con carga exterior (hasta 8 contenedores de 20 pies, o 200 toneladas) y amplio espacio interior para ampliaciones."),

  "cutter-salvamento":
    h3("La ley de salvamento") +
    p("La ley de salvamento establece que toda nave que ayude a recuperar otra nave o su carga perdidas en el espacio tiene derecho a una recompensa proporcional a lo recuperado.") +
    h4("Pillaje") +
    p("No devolver el material recuperado a su legítimo dueño se considera «pillaje». Si se descubre, una corporación pondrá precio a tu cabeza.") +
    p("Tira en la tabla <strong>Restos valiosos del cúter (d10)</strong> para saber qué encuentra la tripulación al desguazar un pecio. El cúter sirve de desguace, nave de búsqueda y rescate, taller móvil y remolcador."),

  corbeta:
    h3("Sección de infantería mecanizada marine") +
    p("La mayoría de las corbetas llevan una sección de infantería mecanizada de unos 55 marines al mando de un 1.er teniente, dividida en 6 pelotones con apoyo de una nave de desembarco y un TBP.") +
    arbol([
      ["1 sección de infantería mecanizada",
        "1 mando de sección: 1.er teniente, 4 oficiales",
        "1 nave de desembarco: 2 tripulantes",
        "1 transporte blindado de personal",
        ...unidadPelotones],
    ]),

  jumpliner:
    h3("Un viaje espacial típico") +
    p("La mayoría de la gente jamás viajará en un Jumpliner. Quienes lo hagan deberán pagar primero una lanzadera hasta un puerto orbital. Allí quizá deban costearse una o dos semanas de alojamiento mientras esperan la llegada de la nave, el embarque y la carga. Una vez a bordo, les esperan dos o tres semanas hasta el punto de Salto, donde todos entran en criosueño para el viaje por el hiperespacio. Después, otras dos o tres semanas hasta su destino, donde se repite todo el proceso a la inversa. Salvo para los ultrarricos o quienes trabajan en el espacio, estos viajes solo se hacen una vez en la vida. La bodega de un Jumpliner suele contener todas las posesiones de una familia.") +
    p("Los Jumpliners ofrecen dos experiencias distintas: los pasajeros de tercera clase suelen entrar en una criocápsula y subir a bordo como carga. El resto dispone de camarote privado, comidas y ocio durante los tramos del viaje fuera del hiperespacio.") +
    h3("Costes de viaje") + costesJumpliner,

  "transporte-tropas":
    h3("Batallón de infantería móvil de marines") +
    p("La mayoría de los transportes de tropas llevan un batallón de infantería móvil de unos 350 marines al mando de un coronel, dividido en 2 compañías con apoyo de naves de desembarco y TBP.") +
    arbol([
      ["1 mando de batallón: coronel, 8 oficiales, oficial sintético de estrategia",
        ["2 compañías de infantería",
          "1 capitán, 6 oficiales",
          "2 lanchas: 2 tripulantes c/u",
          ["3 unidades mecanizadas",
            "1 mando de sección: 1.er teniente, 4 oficiales",
            "1 transporte blindado de personal",
            ...unidadPelotones]]],
    ]),
};

/** Diarios nuevos, en el orden en que se insertan (antes de «Fichas técnicas»). */
export const DIARIOS_NUEVOS = [
  {
    clave: "manifiesto",
    nombre: "Manifiesto de la nave",
    paginas: [
      {
        nombre: "El Manifiesto",
        html:
          p("Ya te arrastres por los conductos de un pecio, explores una nave desconocida o bebas café del día anterior en la cocina de un carguero destartalado, en Mothership pasarás casi todo el tiempo a bordo de naves espaciales. El Manifiesto de la nave permite llevar la cuenta del estado y los recursos de tu nave.") +
          h3("Transpondedor") +
          p("Tu Transpondedor es un sistema de radio automático que emite información importante sobre tu nave. En la mayoría de los sistemas estelares es ilegal (o muy sospechoso) apagarlo.") +
          h3("Megadaño") +
          p("Cuando tu nave sufra Megadaño (MDMG), súmalo en el registro y aplica el efecto junto al nuevo total. Ahí también puedes llevar la cuenta de sus Puntos de casco.") +
          h3("Características y Salvaciones") +
          p("La nave tiene tres Características que sirven también como Salvaciones: Propulsores, Batalla y Sistemas. Dependen del tipo de nave y pueden aumentarse con mejoras.") +
          h3("Combustible") +
          p("Tu nave gasta Combustible cada mes de viaje. Los núcleos warp sirven para viajar por el hiperespacio.") +
          h3("Tripulación") +
          p("Los sistemas de soporte vital de tu nave solo pueden mantener a un número limitado de tripulantes (humanos). Anota también cuántas criocápsulas y cápsulas de escape lleva por si hay que abandonar la nave.") +
          h3("Armas") +
          p("Cada arma de tu nave aumenta su Característica de Batalla. En combate naval, tu nave inflige Megadaño (MDMG). Sus anclajes limitan cuántos sistemas de armas puedes instalar.") +
          h3("Plano de cubierta") +
          p("Tu plano de cubierta es un mapa de la nave. Por ahora basta con un diagrama sencillo o una lista de sus módulos. También debes registrar el Oxígeno restante por si falla el soporte vital.") +
          h3("Mejoras") +
          p("Tu nave cuenta con los sistemas necesarios para cumplir su función. Además, tiene espacio para algunas mejoras mayores y menores.") +
          h3("Carga") +
          p("Anota toda la carga importante que transporte tu nave.") +
          h3("Reparaciones") +
          p("Con el tiempo, tu nave acumula averías de mantenimiento, mayores y menores, que pueden causar graves problemas si no se atienden. Anótalas en el Manifiesto.") +
          h3("No requiere montaje") +
          p("Las naves de este libro traen todo lo necesario para jugar. No tienes que diseñarlas como al crear un personaje. Si vuestros personajes empiezan en una nave, el Guardián os asignará una ya diseñada, con sus propias averías y problemas. Con el tiempo podéis mejorarla y personalizarla… ¡o no! Esto es un juego de terror: no hace falta llevar una contabilidad detallada, salvo que os apetezca."),
      },
      {
        nombre: "Iconos de los planos de cubierta",
        html:
          p("Los planos de cubierta del manual usan estos iconos:") +
          ul(["Esclusa", "Camarote", "Carga", "Mando", "Radio", "Ordenador", "Crio", "Atraque", "Puerta", "Conductos", "Cocina", "Gravedad", "Hangar", "Anclaje", "Salto", "Escalera", "Soporte vital", "Mantenimiento", "Enfermería", "Energía", "Escáneres", "Laboratorio", "Terminal", "Zona sin presurizar"]),
      },
    ],
  },
  {
    clave: "costes-viaje",
    nombre: "Costes de viaje y de combustible",
    paginas: [
      {
        nombre: "Pasajes, fletes y repostaje",
        html:
          p("Los billetes se pagan en créditos o mediante trueque equivalente. La calculadora del módulo (macro «Calculadora de viaje», pestaña Billetes y fletes) suma los extras por ti.") +
          h3("Viaje interplanetario") +
          table(["Servicio", "Coste"], [
            ["Servicio de lanzadera: asiento de pasajeros", "250cr"],
            ["Servicio de lanzadera: espacio de carga", "+1kcr"],
            ["J0C-III Pasaje de 3.ª clase (solo criocápsula)", "1kcr"],
            ["J0C-III Segunda clase (4 literas por camarote, criocápsula)", "2.5kcr"],
            ["J0C-III Primera clase (camarote privado, criocápsula)", "10kcr"],
            ["J0C-III Espacio de carga", "+5kcr"],
            ["J0C-III Espacio de hangar", "+250kcr"],
            ["A un planeta lejano", "×2"],
            ["Al límite del sistema", "×4"],
            ["J0C-I Transporte ejecutivo, primera clase (suite privada, criocápsula)", "20kcr"],
            ["Nave fletada", "1mcr"],
            ["Remolque de nave (Clase II o inferior, máx. 1 nave)", "+500kcr"],
          ]) +
          h3("Viaje interestelar") +
          table(["Servicio", "Coste"], [
            ["J1C-III Jumpliner, cubierta de tercera clase (solo criocápsula)", "2kcr"],
            ["Segunda clase (camarote privado, criocápsula)", "5kcr"],
            ["Primera clase (suite privada, criocápsula)", "20kcr"],
            ["Espacio de carga", "+20kcr"],
            ["Espacio de hangar", "+500kcr"],
            ["Billete de Salto 2", "+10kcr"],
            ["Billete de Salto-3", "+30kcr"],
            ["J2C-I Transporte ejecutivo, primera clase (suite privada, criocápsula)", "40kcr"],
            ["Nave fletada", "2mcr"],
            ["Remolque de nave (Clase II o inferior, máx. 1 nave)", "+500kcr"],
          ]) +
          h3("Costes de combustible") +
          table(["Acción", "Combustible"], [
            ["Encender propulsores (al mes)", "1 Combustible"],
            ["Intento de evasión (alcance de contacto)", "3 de combustible"],
            ["Intento de evasión (alcance de disparo)", "2 de combustible"],
            ["Intento de evasión (alcance de detección)", "1 Combustible"],
            ["Salto al hiperespacio", "1 núcleo warp"],
          ]) +
          h3("Repostar y abastecer") +
          table(["Clase de fuel", "Coste/unidad", "Arma", "Coste Clase I"], [
            ["Combustible de Clase I", "1kcr", "Cañón automático", "100kcr"],
            ["Combustible de Clase II", "2kcr", "Láseres", "50kcr"],
            ["Combustible de Clase III", "5kcr", "Misiles ligeros", "200kcr"],
            ["Combustible de Clase IV", "50kcr", "Misiles pesados", "300kcr"],
            ["Combustible de Clase V", "100kcr", "Haz de partículas", "75kcr"],
            ["Núcleo warp", "1mcr", "Cañón de riel", "400kcr"],
          ]),
      },
    ],
  },
  {
    clave: "ejemplos",
    nombre: "Ejemplos de juego",
    paginas: [
      {
        nombre: "Microsingularidad",
        html: dialogo([
          ["GUARDIÁN", "Salís del punto de Salto y las alarmas de proximidad suenan a todo volumen."],
          ["CLEO", "Vale, me encargo."],
          ["GUARDIÁN", "La enfermedad del criosueño te ha dejado sin fuerzas, pero consigues salir de tu criocápsula y llegar a trompicones a un terminal de pared. Muestra un gran objeto con forma de toroide a una semana de vuestra posición."],
          ["CLEO", "¿Y está ahí flotando sin más?"],
          ["GUARDIÁN", "Orbita la estrella del sistema. Pero sí."],
          ["CLEO", "¿Podemos esquivarlo?"],
          ["GUARDIÁN", "Ese es el problema. Los sensores indican que os está atrayendo."],
          ["PHIL", "¿Cómo? ¿Con un rayo tractor?"],
          ["CLEO", "«Ordenador, ¿qué pasa?»."],
          ["GUARDIÁN", "«Estamos atrapados en el campo gravitatorio de una microsingularidad no identificada»."],
          ["PHIL", "«Ordenador, ¿qué es una microsingularidad?»."],
          ["GUARDIÁN", "Básicamente, un objeto diminuto que genera una atracción gravitatoria enorme."],
          ["PHIL", "O sea, como un rayo tractor."],
          ["CLEO", "Joder. Vale, eh… Subo a ver si podemos escapar de su atracción."],
          ["GUARDIÁN", "Vale, haz una tirada de Propulsores."],
          ["CLEO", "¿Puedo sumar Pilotaje?"],
          ["GUARDIÁN", "Sí, pero la enfermedad del criosueño te da Desventaja."],
          ["CLEO", "Uso un estimulante."],
          ["GUARDIÁN", "Vale, táchalo y haz la tirada de Propulsores."],
          ["CLEO", "55. Fallo crítico."],
          ["GUARDIÁN", "¡Tirada de Pánico para todos!"],
          ["PHIL", "¿También con Desventaja?"],
          ["GUARDIÁN", "Ya te digo."],
        ]),
      },
      {
        nombre: "Sistema concurrido",
        html: dialogo([
          ["GUARDIÁN", "Bueno, una semana después de alejaros de la Estación de Paso, os llama una patrullera cercana: «*kssht* Aquí la patrullera J0C-III Montana. ¿Por qué lleváis el transpondedor apagado?»."],
          ["CLEO", "¿Qué saben de nosotros?"],
          ["GUARDIÁN", "Mmm, estáis a alcance de disparo, así que saben qué tipo de nave lleváis y en qué dirección vais."],
        ]),
      },
      {
        nombre: "Control rutinario",
        html: dialogo([
          ["GUARDIÁN", "La criatura suelta un chillido como «EEEEAAAAAGGHLBRGL» y las extremidades de su boca se estiran y se aferran a las paredes del pasillo."],
          ["KNOX", "Cierro la esclusa de golpe y meto una palanca para bloquearla. ¿Funcionará?"],
          ["GUARDIÁN", "Haz una tirada de Velocidad. Además, todos oís una alarma de proximidad por los altavoces."],
          ["PHIL", "¡Joder! ¿Y ahora qué?"],
          ["KNOX", "Fallo."],
          ["GUARDIÁN", "Metes la palanca, pero no consigues encajarla bien. La criatura se abalanza contra la puerta de la esclusa, la abre de golpe y te tira al suelo. ¿Hay alguien en el módulo de mando?"],
          ["CLEO", "Yo. ¿Qué pasa?"],
          ["GUARDIÁN", "Te llama una patrullera cercana: «*kssht* Aquí la patrullera J0C-II Montana, ¿me recibís?»."],
          ["PHIL", "¿¿¿Otra vez???"],
          ["CLEO", "Eh... No contesto."],
          ["GUARDIÁN", "Knox, la criatura vuelve a aullar y se alza como si fuera a echarse sobre ti. ¿Qué haces?"],
          ["KNOX", "Joder. Salgo corriendo."],
          ["GUARDIÁN", "Perfecto. Pero tendrás que hacer una Salvación de Cuerpo para levantarte y huir sin que esa cosa te alcance. ¿Te parece justo?"],
          ["KNOX", "Sí, claro."],
          ["GUARDIÁN", "Vale, tira. Cleo, recibes otra llamada: «Nave sin identificar, estáis en una zona restringida. Identificaos y preparaos para el abordaje»."],
          ["PHIL", "Deberíamos largarnos."],
          ["GUARDIÁN", "Podéis hacerlo, pero tened en cuenta que están a alcance de disparo. Si intentáis huir ahora y falláis, aún pueden atacar."],
          ["KNOX", "He fallado."],
          ["GUARDIÁN", "Te levantas y corres, pero la criatura te da un zarpazo y sufres... 12 de Daño, más 1 de Estrés por el fallo."],
          ["KNOX", "Vale, eso es una Herida. ¡Chicos! La cosa se está poniendo muy fea aquí abajo."],
          ["PHIL", "Debería ir a ayudarle. Tenemos que largarnos."],
          ["CLEO", "Vale, nos vamos. Nos largamos."],
          ["GUARDIÁN", "Intentáis dejarlos atrás a alcance de disparo, así que debéis gastar al menos dos de Combustible para intentarlo."],
          ["CLEO", "¿Cuánto hace falta para llegar a Adoni?"],
          ["GUARDIÁN", "Espera, voy a apuntar cuánto gastará la patrullera antes de seguir... Vale, necesitáis uno para llegar al punto de Salto y otro para llegar a Adoni. Allí podéis repostar."],
          ["CLEO", "Vale, son dos. Tenemos seis."],
          ["KNOX", "Y hay que gastar dos como mínimo. Solo nos quedan dos de margen."],
          ["PHIL", "¡Si hoy ni siquiera me tocaba estar aquí!"],
          ["CLEO", "¿Y si guardamos uno y gastamos el otro?"],
          ["KNOX", "Por mí, bien."],
          ["GUARDIÁN", "Entonces, ¿gastáis tres?"],
          ["CLEO", "Sí."],
          ["GUARDIÁN", "Vale, ellos han gastado uno, así que tenéis Ventaja. Haz la tirada de Propulsores."],
          ["CLEO", "Cuarenta y tres, cincuenta. Joder. Fallo."],
          ["GUARDIÁN", "Todos ganáis un punto de Estrés. La patrullera también falla, así que sigue a alcance de disparo. Haz una tirada de Batalla."],
          ["CLEO", "Fallo."],
          ["GUARDIÁN", "Sacan un... ¡veintiséis! ¡Impacto!"],
          ["KNOX", "Nooo..."],
          ["GUARDIÁN", "Os causan 1d5 de Megadaño, más uno por vuestro fallo. Son 3 en total. Apúntalo en la ficha."],
          ["CLEO", "Espera, ¿sufrimos todos estos efectos?"],
          ["GUARDIÁN", "No, solo el que corresponde al total."],
          ["CLEO", "«Navegación desconectada». Mierda."],
          ["PHIL", "Si nos vuelven a dar, ¿empieza de cero o se suma a lo que ya tenemos?"],
          ["GUARDIÁN", "Se suma. Si recibís, por ejemplo, 2 más, llegaríais a 5: «Brecha en el casco»."],
          ["CLEO", "¿Y si recuperamos la navegación con un apaño o algo?"],
          ["GUARDIÁN", "La navegación volverá a funcionar, pero tendréis que ir a puerto para borrar el Megadaño de la ficha."],
          ["CLEO", "Vale, tiene sentido."],
          ["GUARDIÁN", "No hay fase de moral porque no han recibido Megadaño... Se me olvidaba: todos ganáis un punto de Estrés por fallar la tirada de Batalla. Knox, te tambaleas tras el impacto y, al alzar la vista, te das cuenta de que la criatura ha desaparecido."],
          ["KNOX", "Genial. Genial, genial, genial."],
        ]),
      },
      {
        nombre: "Tarjeta de empresa",
        html: dialogo([
          ["GUARDIÁN", "Apenas llegáis a puerto; la nave casi se viene abajo al entrar en el dique seco. El personal de tierra se afana por contener los daños y, en cuanto llegáis a una terminal, encontráis un mensaje... de la central."],
          ["PHIL", "¡Genial!"],
          ["KNOX", "Sí, casi mejor pasar de él."],
          ["GUARDIÁN", "Sin problema, pero recordad que aún no habéis cobrado."],
          ["CLEO", "—Sí, hola, buenas. ¿En qué podemos ayudaros?"],
          ["GUARDIÁN", "Es Jenkins y está que trina. Se han enterado de los daños; repararlos llevará meses. Estáis todos despedidos con efecto inmediato."],
          ["PHIL", "Sí, me cuadra."],
          ["GUARDIÁN", "Además, tienen la obligación de informaros de que se ofrece una recompensa por vuestra captura."],
          ["KNOX", "¿Qué? ¿Por qué?"],
          ["GUARDIÁN", "Por dañar bienes de la empresa."],
        ]),
      },
      {
        nombre: "Cierre del ejercicio fiscal",
        html: dialogo([
          ["GUARDIÁN", "Con ese último Permiso en tierra llegamos a fin de año. Cleo, haz la tirada de Mantenimiento…"],
          ["KNOX", "Y yo he estado trabajando en la nave en mis ratos libres, así que..."],
          ["GUARDIÁN", "…Sí, tienes Ventaja en esa tirada. Y luego, Phil, ¿haces tú la Salvación de Quiebra?"],
          ["PHIL", "Por favor, no."],
          ["CLEO", "Fallo."],
          ["GUARDIÁN", "Todos ganáis un punto de Estrés. Cleo, tira d100 en la tabla de Reparaciones."],
          ["CLEO", "16."],
          ["GUARDIÁN", "Solo una reparación menor: Fuga de refrigerante. Apúntala en el Manifiesto. Phil, ¿qué has sacado?"],
          ["PHIL", "Yo también he fallado."],
          ["GUARDIÁN", "Uf. Todos ganáis un punto de Estrés…"],
          ["PHIL", "Echo de menos ganar Estrés por alienígenas y mierdas de esas."],
          ["GUARDIÁN", "…Parece que os han faltado unos 3mcr para cerrar el año con beneficios. Y no os imagináis a quién le debéis el dinero..."],
        ]),
      },
    ],
  },
];

/** Páginas que se añaden a diarios existentes (clave del diario → páginas). */
export const PAGINAS_EXTRA = {
  estadisticas: [
    {
      nombre: "Ajustar las tiradas de nave",
      html:
        h3("Ventaja y Desventaja") +
        p("Las naves pueden tener Ventaja o Desventaja como cualquier personaje, aunque la causa debe afectar a toda la nave, en lugar de a una sola persona.") +
        h3("Éxitos y fallos críticos") +
        p("Si una nave obtiene un fallo crítico en una tirada de Característica, todos a bordo deben hacer una tirada de Pánico. Los éxitos críticos funcionan como de costumbre.") +
        h3("Habilidades") +
        p("Cuando proceda, puedes sumar tu bonificación de habilidad a una tirada de Característica de la nave. Solo una persona puede aportar su bonificación de habilidad a cada tirada."),
    },
  ],
  viajes: [
    {
      nombre: "Despegue, pasajes y repostaje",
      html:
        p("Menos del 1% de la gente abandona su mundo natal y, de ese porcentaje, menos del 1% visita otro sistema. Eres una rareza entre rarezas: alguien para quien viajar por el espacio es tan necesario como habitual.") +
        h3("Despegue y aterrizaje") +
        p("La mayoría de las naves grandes no están preparadas para la entrada atmosférica y dependen de lanzaderas, naves de desembarco y otros vehículos de reentrada para aterrizar o despegar de la superficie de un planeta.") +
        h3("Reservar pasaje") +
        p("No necesitas tener una nave para cruzar la galaxia, pero debes pagarte el viaje, en créditos o mediante trueque equivalente. Consulta los precios de los billetes en el diario «Costes de viaje y de combustible».") +
        h3("Viajes interplanetarios") +
        p("Los viajes interplanetarios pueden durar desde unas semanas hasta un planeta cercano hasta varios años hasta el confín del sistema. Se realizan con los propulsores de la nave y consumen 1 unidad de combustible por mes de viaje espacial. El combustible se paga por adelantado al decidir el destino. Cambiar de rumbo cuesta 1 de Combustible.") +
        table(["Trayecto", "Duración"], [
          ["Del suelo al espacio", "Minutos"],
          ["A una luna, estación o asteroide en órbita", "Horas o días"],
          ["A un mundo cercano o punto de Salto", "Semanas"],
          ["A un planeta lejano", "Meses"],
          ["Al borde solar", "Años"],
        ]) +
        h3("Repostaje y reabastecimiento") +
        p("Repostas y reabasteces tu nave en puerto. Cada Clase de nave usa un tipo de Combustible distinto (las naves de Clase I usan Combustible de Clase I, las de Clase V, Combustible de Clase V, etc.).") +
        h4("Trasvasar combustible") +
        p("Puedes trasvasar y usar combustible de una nave de una clase inferior a la tuya en proporción 2:1. Asimismo, puedes usar el de una nave de una clase superior en proporción 1:2. El resto es incompatible.") +
        h4("Reabastecer armas") +
        p("Tras un enfrentamiento en el que hayas usado las armas de tu nave, debes reabastecerte. Si no lo haces, tus tiradas de Batalla tendrán [-] en el siguiente combate entre naves. A partir de entonces, fallarás automáticamente todas las tiradas de Batalla. Los precios de reabastecimiento son para naves de Clase I. Multiplica el coste por la Clase de tu nave para obtener el coste total."),
    },
    {
      nombre: "Viajes interestelares",
      html:
        p("Para viajar a otros sistemas estelares, necesitas una nave con un motor de Salto. Estos potentes motores permiten superar la velocidad de la luz y recorrer grandes distancias dando «saltos» al hiperespacio.") +
        h3("Motores de Salto") +
        p("Los motores de Salto se clasifican del 1-9 según la distancia que pueden saltar por el hiperespacio. Casi todas las naves comerciales de viaje interestelar usan motores de Salto-1. Solo las grandes corporaciones, los gobiernos y las fuerzas armadas usan motores de Salto-4 o superior. Cada Salto al hiperespacio consume 1 unidad de un potente combustible llamado núcleo warp.") +
        h3("Puntos de Salto") +
        p("Antes de entrar en el hiperespacio, una nave debe llegar a un punto de Salto, a una distancia segura de los planetas o estaciones espaciales cercanos. Llegar a un punto de Salto suele llevar 2 semanas. Desde allí, la nave puede entrar en el hiperespacio sin peligro.") +
        h3("Criosueño") +
        p("La mayoría de las tripulaciones pasan el viaje por el hiperespacio en criosueño mientras un androide vigila el ordenador de astronavegación. Quienes permanecen despiertos durante los Saltos relatan experiencias extrañas y contradictorias. Incluso los recuerdos de los androides sobre su paso por el hiperespacio suelen ser, como poco... inquietantes.") +
        h3("Dilatación temporal") +
        p("Los Saltos por el hiperespacio duran 2d10 días. Sin embargo, los efectos relativistas de viajar más rápido que la luz son inciertos y parecen aleatorios. Una tripulación puede volver de un viaje de Salto-3 y descubrir que han pasado varios años, mientras que otras regresan apenas unos segundos después de partir.") +
        p("Las rutas comerciales regulares de Salto-1 parecen atenuar estos efectos caóticos, pero no se espera que quienes dan saltos largos, como las legendarias naves coloniales de Salto-9, regresen jamás. Nadie sabe qué efectos tendrían varios Saltos-9. Quizá esos pioneros hayan vuelto, pero milenios en nuestro futuro. O en algún momento de nuestro pasado."),
    },
  ],
  deteccion: [
    {
      nombre: "Alcance y distancia (resumen)",
      html:
        table(["", "Contacto", "Disparo", "Detección"], [
          ["Distancia", "De planeta a órbita cercana.", "De planeta a luna, estación o campo de asteroides.", "De planeta a planeta lejano."],
          ["Tiempo de viaje", "Minutos.", "De horas a días.", "De semanas a meses."],
          ["Escáneres", "Daños, presencia de vida, imagen.", "Transpondedor, clase y armas.", "Tamaño, posición y trayectoria de la nave."],
          ["Latencia de comunicaciones", "Ninguna.", "Segundos.", "De minutos a horas."],
          ["Combate nave contra nave", "Abordaje. Todas las armas.", "Todas las armas.", "Solo cañón de riel."],
        ]) +
        p("Los escáneres de tu nave permiten obtener información sobre naves enemigas, pecios, estaciones espaciales, planetas, lunas, asteroides y otros cuerpos celestes. Cuanto menor sea la distancia, más detallada será la información que obtengan los sensores y escáneres. El grado de detalle queda a criterio del Guardián."),
    },
  ],
  combate: [
    {
      nombre: "Qué puedo hacer y cuánto dura",
      html:
        p("El combate entre dos naves espaciales puede parecer lento y sereno, pero para sus tripulaciones es como una catástrofe natural. Cada nave se mueve a velocidades imposibles y dispara armas guiadas por ordenador contra objetivos a horas o incluso días de distancia. El más mínimo daño puede inutilizar o destruir una nave entera y matar a su tripulación por fuego, radiación, asfixia o algo peor.") +
        h3("Rondas de naves") +
        p("En un enfrentamiento violento entre naves, dividimos el tiempo en intervalos llamados rondas de naves. Cada ronda consta de tres fases: Movimiento, Ataque y Moral. Cada ronda dura de unos minutos a unas horas, según la distancia entre las naves. Tras cada ronda, el tiempo vuelve a la normalidad mientras los jugadores planeáis vuestro próximo movimiento de cara a la siguiente.") +
        ul([
          "A alcance de contacto, solo pasan unos minutos entre rondas de naves (lo suficiente para unas rondas de tiempo normal).",
          "A alcance de disparo, pueden pasar desde unas horas hasta varios días entre rondas.",
        ]) +
        p("La mayoría de los combates entre naves terminan en una ronda de naves. Casi ninguno dura más de 3.") +
        h3("¿Qué puedo hacer?") +
        p("El combate nave contra nave da por hecho que cada nave y su tripulación hacen todo lo posible por ganar el enfrentamiento: realizan maniobras evasivas, disparan a los objetivos más adecuados y, en general, toman decisiones tácticas sensatas. Tu tarea es hablar con el resto de la tripulación y decidir cuándo luchar, cuándo huir y cuándo negociar o rendirse.") +
        h3("La fase de movimiento") +
        p("Durante la fase de Movimiento, las naves deciden si intentan evadir o perseguir a las demás, o si mantienen el rumbo. Después deciden cuánto combustible adicional están dispuestas a quemar, si lo hay.") +
        h4("Si intentas evadir…") +
        p("Puedes gastar tanto combustible como quieras, pero el intento exige un gasto mínimo según la distancia a la nave enemiga: contacto 3, disparo 2, detección 1.") +
        h4("Si intentas perseguir…") +
        p("Puedes gastar tanto combustible como quieras (o nada). Después, cada bando revela su elección y hace una tirada de Propulsores. Quien haya gastado más combustible obtiene [+] en la tirada.") +
        p("Con un éxito, logras tu objetivo y aumentas (o reduces) en una banda de alcance la distancia a la nave enemiga. Con un éxito crítico, avanzas hacia tu objetivo aunque el enemigo también tenga éxito. Del mismo modo, con un fallo crítico, el enemigo avanza hacia su objetivo aunque falle. Cualquier otro resultado se considera un empate y la distancia entre las naves no cambia.") +
        h4("Si vas a mantener el rumbo…") +
        p("No gastas combustible adicional, pero el enemigo logra su objetivo (evadir o perseguir) sin tirar (aunque gasta el combustible adicional que haya quemado).") +
        h3("La fase de moral") +
        p("Tras cada asalto de naves en el que un enemigo sufra MDMG, este debe hacer una tirada de Moral: tira 1d10. Si saca menos que su MDMG actual, puede enviar una llamada para ofrecer un alto el fuego y reanudar las negociaciones."),
    },
  ],
};
