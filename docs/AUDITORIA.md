# Auditoría de reglas (1.3.0)

Revisión de cada mecánica del módulo contra el *Shipbreakers Toolkit* (traducción al español, v1.2 del original) y contra el
sistema `mosh` 0.6.1. Las páginas son las del PDF del manual; no aparecen en la interfaz.

## Qué se comprobó y cómo queda

| Regla (pág.) | Estado |
| --- | --- |
| Tiradas de Característica de nave: por debajo, 90-99 siempre falla, dobles críticos; cada fallo da 1 de Estrés a todos a bordo, y Pánico con fallo crítico (7) | Usa `parseRollString`/`parseRollResult` del sistema. **Corregido:** el Dossier no daba el Estrés y no dejaba sumar la bonificación de habilidad (solo una persona la aporta). |
| Mantenimiento anual, avería con fallo, dos con fallo crítico (39, 41) | Lo resuelve el sistema con la tabla del Kit. |
| Estado inicial: 1d5+1 averías (39) | Macro «Averías iniciales». |
| **Efectos de las averías** (41): −2d10 Propulsores (24), −1d10 Batalla (28), −1d10 Sistemas (61), tripulación a la mitad (90), −1 Casco y −1 Mejora (93) | **Corregido:** antes solo se añadía el objeto sin efecto. Ahora se tiran los dados al añadirla, se aplican a la nave y se quitan al repararla. Las demás averías son de texto (mantenimiento con [-], aceleración lenta, etc.) y las aplica el Guardián. |
| Casco: ignora el MDMG menor que su valor; con un impacto igual o mayor se destruye y pasa el resto (36) | `aplicarImpacto`. |
| Megadaño: se suma al acumulado, se marca el total y solo se aplica su efecto (36, 38) | **Corregido en 1.3.0:** una sola marca en el registro. |
| Fase de movimiento: evadir con coste mínimo por alcance, [+] a quien gasta más, crítico avanza, fallo crítico regala el avance, mantener el rumbo (35) | Panel de combate. |
| Fase de ataque: una tirada de Batalla por nave y ronda; éxito inflige MDMG (doble con crítico), fallo da 1 o 2 MDMG propios; sin armas o desconectadas fallan solas y el rival acierta solo (36) | Panel y botón Disparar. **Corregido:** disparar ahora se hace desde las armas, con una sola tirada. |
| Clase: [+] contra naves 1 Clase inferior; 2 o más Clases, invencible (36) | Panel y Disparar. |
| Moral: 1d10 contra el MDMG actual (36) | Macro y panel. |
| Informe tras la batalla: tirada de Sistemas (36) | Mismo flujo que el mantenimiento. |
| **Reabastecer armas** (31): sin reabastecer tras un combate, [-] en Batalla en el siguiente; después, fallo automático | **Añadido:** botones «Terminar el combate» y «Reabastecer armas» (coste por arma y Clase). |
| Armas (29): +Batalla, 1 Anclaje cada una, MDMG +1 del lanzamisiles pesado | Datos y sincronización. **Añadido:** aviso si no hay Anclajes libres o huecos de mejora. |
| Sistema de defensa láser: ignora la bonificación de MDMG de los lanzamisiles enemigos; solo defensivo (29) | **Añadido** en Disparar. |
| Contramedidas electrónicas: [-] al MDMG enemigo (29) | Disparar y panel. |
| Haz de partículas: el enemigo supera una tirada de Sistemas o +1 radiación (29) | **Añadido** como aviso en la tarjeta. |
| Cañón de riel: dispara a alcance de detección (29, 33) | Aviso y panel. |
| Mejoras (28): efectos numéricos (Reactor, IA, Radiadores, Depósito, Placas, Blindaje, Estructura, Anclaje, Mayor potencia de MDMG, Reforma de sistemas) | Sincronización. Taller: aviso en Reparar (reparar hasta 3 MDMG y 3 de Casco sin puerto). |
| Cazas: +1 a Batalla cada uno, máximo +10 (29) | Sincronización. |
| Reparaciones (38): menores 2d10 días, sin coste; mayores en puerto, 1d5 MCR × Clase **cada una**; cada punto de Casco o MDMG cuenta | Macro Reparar. |
| Quiebra (41): valor inicial 2d10+10 | **Corregido:** las naves del Kit la tiran al importarse (antes un 20 fijo). |
| Viajes (30, 31): 1 de combustible por mes, 1 por cambio de rumbo, 1 núcleo warp por Salto, 2d10 días de hiperespacio, motor de Salto necesario | **Añadido:** aviso si la nave no tiene motor de Salto y +1 de combustible con «Fuga de combustible de emergencia». |
| Billetes y fletes (cubierta interior) | Calculadora. |
| Datos de naves, mejoras, armas, averías y tablas | Cotejados con el PDF. |

## Decisiones y límites

- Las armas no se tiran una a una: el manual da una sola tirada de Batalla por nave (las armas suman a la Batalla). El botón Disparar de cada arma hace esa tirada.
- El seguimiento del reabastecimiento depende de pulsar «Terminar el combate»: el módulo no sabe cuándo acaba un enfrentamiento.
- No se automatizan: Sensores de tiro ([+] en Batalla), Sistemas redundantes, Reducción de firma, el nivel del motor de Salto, ni la resistencia de una Lancha de abordaje. Son decisiones del Guardián o efectos de narración.
- Los núcleos warp de partida (2 en las naves con Salto) no vienen en el manual.
