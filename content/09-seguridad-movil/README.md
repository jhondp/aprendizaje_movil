# Etapa 9 — Seguridad móvil (OWASP MASVS)

Seguridad defensiva para quien construye apps con React Native y Expo. Cada lección se apoya en el
OWASP Mobile Application Security Verification Standard (MASVS v2) y enseña qué hacer, con
comprobaciones que el estudiante ejecuta sobre su propia app de notas con usuarios (proyecto de la
etapa 8).

Proyecto de cierre: `SECURITY_AUDIT.md`, una auditoría escrita de la app de notas contra el perfil
MAS-L1, con estado, evidencia y corrección aplicada por cada control.

| Módulo             | Archivo                               | Título                                   | Min | MASVS                          | Práctica                                                          |
| ------------------ | ------------------------------------- | ---------------------------------------- | --- | ------------------------------ | ----------------------------------------------------------------- |
| Modelo             | `00-modelo-de-amenazas-movil.mdx`     | Modelo de amenazas móvil                 | 15  | —                              | `Checklist` STRIDE-lite sobre la app de notas; `Playground`       |
| Modelo             | `01-owasp-mobile-top-10-y-masvs.mdx`  | OWASP Mobile Top 10 y MASVS              | 15  | todas                          | `Checklist` mapa Top 10 → lección; `Snack` logging inseguro       |
| Datos y secretos   | `02-secretos-fuera-del-bundle.mdx`    | Secretos fuera del bundle                | 15  | MASVS-STORAGE, MASVS-CODE      | `Terminal` strings del bundle; `Snack` `EXPO_PUBLIC_`; `Checklist` |
| Datos y secretos   | `03-almacenamiento-seguro.mdx`        | Almacenamiento seguro                    | 15  | MASVS-STORAGE                  | `Snack` AsyncStorage vs SecureStore; `Checklist` clasificación    |
| Red y entrada      | `04-https-y-certificate-pinning.mdx`  | HTTPS y certificate pinning              | 15  | MASVS-NETWORK                  | `Terminal` `openssl s_client`; `Checklist`                        |
| Red y entrada      | `05-validacion-de-entrada.mdx`        | Validación de entrada                    | 12  | MASVS-CODE                     | `Snack` esquema zod; SQL de ejemplo en bloque de código           |
| Cadena y privacidad | `06-supply-chain.mdx`                | Supply chain: dependencias y lockfiles   | 12  | MASVS-CODE, MASVS-RESILIENCE   | `Terminal` `pnpm audit`, `npm view`, diff de lockfile; `Checklist` |
| Cadena y privacidad | `07-privacidad-y-permisos-minimos.mdx` | Privacidad y permisos mínimos           | 12  | MASVS-PRIVACY, MASVS-PLATFORM  | `Checklist` inventario de datos, etiquetas de privacidad          |
| Cadena y privacidad | `08-crash-reporting-sin-fugas.mdx`   | Crash reporting sin fugas                | 12  | MASVS-STORAGE, MASVS-PRIVACY   | `Snack` `beforeSend` que limpia datos; `Checklist`                |
| Proyecto           | `09-proyecto-auditoria.mdx`           | Proyecto: auditoría de tu app            | 35  | todas                          | `Checklist` autoauditoría MAS-L1 con columna de evidencia         |

Total: 158 minutos de lección más el trabajo del proyecto.

## Reglas de la etapa

- Cada lección nombra su categoría MASVS en el primer párrafo de `## Concepto`.
- Nomenclatura MASVS v2 (`MASVS-STORAGE-1`), nunca los ids antiguos `MSTG-*`.
- Enfoque defensivo: se muestra cómo detectar y corregir debilidades en la app propia, no cómo
  atacar apps ajenas. Sin secretos reales ni payloads de explotación.
- Certificate pinning se presenta con su costo operativo y con la necesidad de un development build
  o config plugin en Expo; no existe pinning en JavaScript puro.
- Detección de root/jailbreak y ofuscación son defensa en profundidad con límites, no garantías.
