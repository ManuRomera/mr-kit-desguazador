# Historial de cambios

## 1.5.0 — 2026-11-02

Todo en la ficha de la nave, con el aspecto de la ficha de personaje.

### Cambiado

- **Ficha de nave propia** (parte de la del sistema y conserva sus objetos, quiebra y megadaño): cabecera y Características como las del personaje, tripulación en un panel negro, megadaño con sus nueve efectos siempre a la vista, botones de Mantenimiento, Socorro, Moral enemiga, Reparar, Viaje y Plano de cubierta, y las pestañas Armas, Mejoras, Carga, Reparaciones y Notas.
- **Sin ventanas aparte**: desaparecen el Dossier y el panel de combate. Propulsores, Batalla y Sistemas se tiran desde la ficha, se dispara con el nombre del arma, el reabastecimiento se ve arma a arma, y el botón *Terminar el combate* ya no hace falta: al cerrar el combate del Combat Tracker las naves que dispararon quedan «sin reabastecer» (el aviso de la pestaña Armas lo ofrece si no usas el Combat Tracker).
- **Sin barra de desplazamiento** en la ventana ni solapes (el botón del plano de cubierta ya no pisa las pestañas); las listas largas se desplazan dentro de su pestaña. Ajuste nuevo «Ficha de nave del Kit» para volver a la del sistema.
- **Tarjetas del chat con el estilo del sistema y de MR- Mothership en español**: titular, dados desplegables y botones negros.
- **Propulsores:** el diálogo permite indicar el combustible que quemas (se descuenta).
- La macro *Abrir dossier de nave* pasa a *Abrir ficha de la nave*; la macro *Combate de naves* desaparece.

### Nuevo

- **Botones de Estrés y Pánico en la tarjeta** cuando una tirada de la nave falla: el Guardián los aplica a toda la tripulación (los personajes arrastrados a la ficha) y cada jugador se aplica el suyo. Cada botón se desactiva al usarlo.
- **Planos de cubierta distintos por nave**: antes todas llevaban el plano por defecto del sistema. Cada una trae ahora su plano del manual (la doble página de la edición en español), que se abre como imagen. Las naves ya importadas se actualizan solas.
- **Diálogo de tirada como el de un personaje**: «Añadir una habilidad» con las habilidades de cada tripulante (retrato, bonificación y descripción, agrupadas por persona), niveles Entrenado/Experto/Maestro para la tripulación sin ficha y botones Ventaja / Normal / Desventaja. El combustible quemado se elige con puntos que se rellenan, sin escribir cifras. La tarjeta muestra quién aporta la habilidad.

### Corregido

- Las cajas de dos valores (Casco, Combustible, Tripulación, Armas…) ya no tienen los campos pintados por encima del marco redondeado.
- Los diálogos del sistema de mantenimiento, socorro, quiebra y moral se ajustan a su contenido (llevaban 265 px de alto fijo).
- **Los botones de Estrés, Pánico y MDMG de las tarjetas actúan sobre la nave que disparó**, también con tokens no enlazados (la nave de la escena, no la del directorio de actores, que no tenía la tripulación).

## 1.4.0 — 2026-11-02

Disparar y rearmar como en la ficha de un personaje, y tripulación con personajes.

### Corregido

- **Se dispara pulsando el nombre del arma**, como en la ficha de un personaje (en la ficha de nave del sistema y en el Dossier). Se quita el botón aparte, y el nombre ya no se limita a mostrar la descripción.
- **Rearmar las armas tiene sitio**: cada arma de la pestaña Armas muestra su estado (cargada o sin reabastecer) y, si está vacía, se rearma pulsando su icono; hay una barra con «Terminar el combate» y «Rearmar todas». Lo mismo en el Dossier.
- La tarjeta del disparo explica de dónde sale la Batalla (p. ej. «32 = 30 de base + 2 de armas»): la cifra es la del manual, y lo que la sube es la habilidad de la tripulación.

### Nuevo

- **Tripulación con personajes**: arrastra un personaje a la ficha de la nave y se añade a la tripulación (con su puesto). Al disparar o tirar una Característica de la nave eliges la habilidad de **un** tripulante (Pilotaje, Entrenamiento militar…) y su bonificación se suma, como pide el manual. También se puede poner una bonificación a mano.

## 1.3.0 — 2026-11-02

Las tiradas pasan a ser las del sistema mosh.

### Corregido

- El Kit tiraba el mantenimiento, el socorro y la quiebra con su propia mecánica. Ahora lo hace el sistema (diálogo de Ventaja/Desventaja, tirada de característica, Estrés a todos a bordo, enlace para tirar otra vez tras un fallo crítico) y el Kit le da sus tablas.
- El registro de megadaño marcaba todos los niveles hasta el total, así que la ficha del sistema mostraba varios efectos a la vez. Ahora lleva una sola marca (el total) y solo se aplica su efecto.
- Las tiradas del panel de combate interpretan Ventaja, Desventaja, críticos y el fallo automático con 90 o más con las mismas funciones del sistema.
- La lista de megadaño de la ficha de nave repetía el número delante del efecto.

### Revisión de reglas

Auditoría completa contra el manual (ver `docs/AUDITORIA.md`). Además de lo anterior:

- **Reabastecer armas** (regla del manual): al terminar un combate en el que se han usado las armas hay que reabastecerlas; si no, [-] en Batalla en el siguiente combate y fallo automático después. Botones «Terminar el combate» y «Reabastecer armas» con el coste por arma y Clase.
- **Efectos de las averías**: Posquemadores limitados (−2d10 Propulsores), Sensores de tiro descalibrados (−1d10 Batalla), Software obsoleto (−1d10 Sistemas), Filtros obstruidos (tripulación a la mitad) y Estructura débil (−1 Casco, −1 Mejora) se aplican a la nave al añadirlas y se quitan al repararlas.
- **Tirada de característica de nave**: ahora da 1 de Estrés a todos a bordo al fallar (y Pánico con fallo crítico), deja sumar la bonificación de habilidad de una persona, y respeta «Sin navegación» y «Armas inactivas».
- Sistema de defensa láser (ignora el MDMG extra de los lanzamisiles) y Haz de partículas (Sistemas o +1 radiación) en el disparo.
- **Salvación de Quiebra** inicial 2d10+10 al importar la nave.
- Avisos: sin Anclajes libres o sin huecos de mejora al añadir un objeto, nave sin motor de Salto, «Fuga de combustible de emergencia» en el viaje y Taller al reparar.

### Nuevo

- **Botón Disparar** en cada arma ofensiva de la ficha de nave y del Dossier, y macro «Disparar con la nave»: la tirada de Batalla de la nave contra la nave marcada como objetivo (T), con Ventaja por Clase, contramedidas, Casco y MDMG aplicado al objetivo. Es una sola tirada por ronda, como en el manual, no una por arma.

### Cambiado

- El ajuste «Usar la tabla de averías del Kit» (que sustituía una función del sistema) es ahora «Usar las tablas del Kit en las tiradas del sistema»: el Kit responde con sus tablas cuando el sistema las pide, sin modificar los ajustes del sistema, así que al desactivar el módulo todo vuelve a ser como antes.
- Las tarjetas de mantenimiento son las del sistema; junto a cada avería del Kit aparece un botón «Añadir a la nave».
- La señal de socorro se tira con la llamada `rollTable` del sistema porque su diálogo propio apunta a una plantilla que no existe en mosh 0.6.1.

## 1.2.0 — 2026-11-02

Aspecto y compatibilidad con el resto de módulos de Mothership, y preparación para publicar.

### Nuevo

- **Mismo aspecto que las hojas del sistema mosh**: dossier, combate, viaje y diálogos en blanco y negro con píldoras y círculos; las tarjetas del chat usan el marcado del sistema (`.mosh > .rollcontainer`) y heredan todo lo que añaden otros módulos.
- **Modo oscuro y accesibilidad compartidos con MR- Mothership en español**: si está activo, el Kit lee y escribe sus ajustes (`a11y-*`) y respeta sus clases `mr-mosh-*` y `--mr-escala`; si no, registra los suyos.
- Las ventanas recuerdan posición, tamaño y la pestaña del dossier. Lupa en la imagen de la nave.
- Iconos y siluetas de las naves en la paleta de Mothership y con la **marca MR** (`tools/iconos.mjs` + `tools/marcar.py`).
- Publicación: banner, capturas, insignias, `scripts/zip.mjs` (mismo script en local y en CI) y workflow de release por etiqueta.
- `module.json` recomienda MR- Mothership en español.

### Corregido

- Un impacto que destruye el Casco sin pasar MDMG ya no se muestra como «0 → 0 MDMG».

## 1.1.0 — 2026-11-02

Revisión completa: corrige los fallos de la 1.0.0, completa el contenido del manual y mejora las herramientas.

### Corregido

- **Las tablas no se consultaban**: el módulo buscaba las tablas y las averías en el índice del compendio sin pedir los flags, así que mantenimiento, megadaño, señales de socorro, quiebra, averías iniciales y el botón «Añadir a la nave» fallaban con un error.
- Las pestañas del Dossier y de la calculadora de viaje no respondían (la acción `tab` choca con la de Foundry).
- Datos de naves: el Transporte de tropas tenía 2 de 4 anclajes en lugar de 3 de 4 (1 lanzamisiles ligero y 2 cañones automáticos), y la Patrullera contaba su lancha de abordaje como mejora (son 0 de 3). Las naves de Clase 0 que lleva cada nave son ahora objetos de carga con su cantidad, no mejoras.
- Tabla de señales de socorro: la nota sobre los salarios atrasados estaba en la fila equivocada (es de 01-02, no de 03-04).
- Los botones de combate ignoraban la Ventaja, no gastaban el combustible de la persecución, no respetaban «mantener el rumbo» y daban 1 de MDMG a naves sin armas.
- Reparaciones: el coste es 1d5 MCR por **cada** reparación mayor × Clase (antes se tiraba un solo dado para todas).
- La Calculadora de viaje inventaba duraciones; ahora la duración la fijas tú, con la orientación del manual.
- El botón «Dossier del Kit» se montaba sobre las pestañas de la ficha: se queda solo la pestaña Dossier.
- Las tiradas usan los dados de Foundry (Dice So Nice, registro de tiradas) en lugar de números aleatorios sueltos.

### Nuevo

- **Sincronización de cifras**: al añadir o quitar armas, mejoras y naves de Clase 0, la nave recalcula anclajes, mejoras, Batalla, MDMG, y los efectos de Reactor dedicado, IA mejorada, Radiadores, Depósito ampliado, Placas reforzadas, Blindaje adaptativo, Estructura ampliada, Anclaje, Mayor potencia de MDMG y Reforma de sistemas. Respeta lo que edites a mano.
- **Casco** en el megadaño: un impacto menor que el Casco se ignora; uno igual o mayor lo destruye y pasa el resto.
- **Combate**: Ventaja por Clase, combustible gastado, mantener el rumbo, armas inactivas o ausentes, armas defensivas, contramedidas, cañón de riel a alcance de detección, informe tras la batalla y cada fase publicada en el chat.
- **Billetes y fletes** en la calculadora de viaje, con las tarifas del manual.
- **Reparar** con selección de qué se repara y coste detallado; borra las averías resueltas.
- **Dossier**: plano de cubierta numerado, reglas propias de cada nave, naves de Clase 0 a bordo y efecto del megadaño actual.
- **Contenido**: 3 diarios nuevos (Manifiesto de la nave, Costes de viaje y de combustible, Ejemplos de juego) y más páginas en estadísticas, viajes, detección y combate. Cada nave incluye sus reglas propias: inspecciones aduaneras, ley de salvamento, secciones de infantería, viaje típico en Jumpliner, tarifas, etc.
- **Accesibilidad**: icono en la cabecera de cada ventana con tamaño del texto, alto contraste, fuente legible, reducir movimiento y ayuda inmediata.
- Ajuste «Mantener al día las cifras de la nave» (mundo).

### Eliminado

- El ajuste «Avisar al abrir una nave sin dossier», que no hacía nada, y el archivo de idioma sin uso.

## 1.0.0 — 2026-11-02

Primera versión pública.

### Contenido

- **10 naves** del *Shipbreakers Toolkit* con estadísticas, armas, módulos,
  descripción y plano de cubierta: Asaltante, Transporte ejecutivo, Carguero,
  Patrullera, Cúter de salvamento, Corbeta, Jumpliner, Transporte de tropas,
  Nave de exploración y Nave de desembarco.
- **30 mejoras** (14 menores y 16 mayores) con coste, instalación y rasgo.
- **8 armas de nave** y **6 naves de Clase 0**.
- **4 vehículos y equipos** de nave.
- **100 averías de mantenimiento** (69 menores y 31 mayores) como objetos `repair`.
- **6 tablas**: averías d100, megadaño, señales de socorro, salvación de quiebra,
  contrabando de la patrullera y restos valiosos del cúter. Las tablas de averías
  enlazan con los 100 objetos de avería.
- **13 diarios de reglas**: introducción, estadísticas, viajes, detección,
  socorro, combate, megadaño, reparaciones, facturas, armas, mejoras y fichas
  técnicas.
- **11 macros** listas para la barra de acceso rápido.

### Automatizaciones

- Dossier de nave con pestañas de resumen, estado, plano de cubierta y registro.
- Tirada de mantenimiento propia (69/31) que sustituye a la del sistema mediante
  un parche del prototipo, desactivable en los ajustes.
- Registro visual de megadaño con botones para marcar y desmarcar impactos.
- Panel de combate naval con fases de movimiento, ataque y moral.
- Calculadora de viaje interplanetario e interestelar con gasto aplicable a la nave.
- Macros de socorro, quiebra, moral, averías iniciales, reparaciones y costes.
- Botones de chat para añadir averías y aplicar megadaño a la nave.

### Notas de compatibilidad

- Foundry VTT **v13**.
- Sistema **mosh** 0.6.1 o superior.
- Los compendios usan LevelDB (formato de Foundry v12/v13) e identificadores
  deterministas; recompilar no rompe los enlaces internos.
