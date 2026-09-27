# Etapa 10 — Build, release y operaciones

Slug: `10-build-release-operaciones` · `stage: 10` · 14 horas estimadas de etapa.

Cómo pasar de un proyecto Expo que funciona en tu máquina a una app firmada, publicada en
TestFlight y en Google Play internal testing, con actualizaciones OTA, monitoreo y un runbook
de release escrito. Toda la etapa usa el tooling de Expo: EAS Build, EAS Submit y EAS Update.

Componente de práctica principal: `Terminal` (sesiones simuladas de `eas build`, `eas submit`,
`eas update`) y `Checklist` (pre-release, envío a tiendas). `Playground` para lógica pura
(resolver `app.config`, bump de semver). `Snack` con `sdkVersion="55.0.0"` solo en la lección
de monitoreo.

Todos los identificadores de cuenta, bundle id, package name y credenciales son placeholders
(`com.example.notes`, `<account>`, `<ascAppId>`). Las políticas de las tiendas se enlazan a las
páginas oficiales, nunca se reproducen.

| Módulo        | Archivo                                  | Título                                                            | Min | Práctica                                 |
| ------------- | ---------------------------------------- | ----------------------------------------------------------------- | --: | ---------------------------------------- |
| Configuración | `00-app-config-y-entornos.mdx`           | app.config.ts y entornos                                          |  15 | Terminal, Playground, Checklist          |
| Configuración | `01-secrets-en-eas.mdx`                  | Secrets y variables en EAS                                        |  12 | Terminal, Checklist                      |
| Build         | `02-eas-build-perfiles.mdx`              | EAS Build y perfiles en eas.json                                  |  15 | Terminal, Checklist                      |
| Build         | `03-firma-ios-android.mdx`               | Firma: certificados, provisioning y keystore                      |  15 | Terminal, Checklist                      |
| Build         | `04-cuentas-apple-google.mdx`            | Cuentas de Apple Developer y Google Play Console                  |  12 | Checklist, Playground                    |
| Publicar      | `05-eas-submit-testflight-internal.mdx`  | EAS Submit, TestFlight e Internal testing                         |  15 | Terminal, Checklist                      |
| Publicar      | `06-store-listing-y-revision.mdx`        | Ficha de la tienda y proceso de revisión                          |  12 | Checklist                                |
| Operar        | `07-eas-update-y-rollback.mdx`           | EAS Update (OTA) y rollback                                       |  15 | Terminal, Checklist                      |
| Operar        | `08-versionado-y-changelog.mdx`          | Versionado, runtimeVersion y changelog                            |  10 | Playground, Terminal, Checklist          |
| Operar        | `09-monitoreo-sentry.mdx`                | Monitoreo con Sentry y métricas                                   |  12 | Terminal, Snack, Checklist               |
| Operar        | `10-salir-de-managed.mdx`                | Salir del workflow managed: prebuild, config plugins y módulos nativos |  15 | Terminal, Checklist                 |
| Proyecto      | `11-proyecto-publicar.mdx`               | Proyecto: publicar la app en ambas tiendas                        |  45 | Checklist, Terminal                      |

Total: 193 minutos de lección guiada más el trabajo propio del proyecto.

## Proyecto de cierre

La app de notas de las etapas anteriores publicada en TestFlight y en Google Play internal
testing (no se exige pasar la revisión de tienda), con:

- `eas.json` con los perfiles `development`, `preview` y `production`.
- Secrets en variables de entorno de EAS, ninguno en el repositorio.
- Credenciales gestionadas por EAS y respaldadas fuera del repositorio.
- Sentry activo y recibiendo un error de prueba.
- Una actualización OTA publicada y revertida con `eas update:rollback`.
- `CHANGELOG.md` y un runbook de release escrito.

## Documentación consultada

- https://docs.expo.dev/workflow/configuration/
- https://docs.expo.dev/eas/environment-variables/
- https://docs.expo.dev/eas/environment-variables/manage/
- https://docs.expo.dev/build/introduction/
- https://docs.expo.dev/build/eas-json/
- https://docs.expo.dev/eas/json/
- https://docs.expo.dev/eas/cli/
- https://docs.expo.dev/app-signing/app-credentials/
- https://docs.expo.dev/app-signing/managed-credentials/
- https://docs.expo.dev/submit/introduction/
- https://docs.expo.dev/submit/ios/
- https://docs.expo.dev/submit/android/
- https://docs.expo.dev/eas-update/introduction/
- https://docs.expo.dev/eas-update/deployment/
- https://docs.expo.dev/eas-update/rollbacks/
- https://docs.expo.dev/eas-update/runtime-versions/
- https://docs.expo.dev/build-reference/app-versions/
- https://docs.expo.dev/guides/using-sentry/
- https://docs.expo.dev/workflow/prebuild/
- https://docs.expo.dev/config-plugins/introduction/
- https://docs.expo.dev/config-plugins/plugins/
- https://developer.apple.com/app-store/review/guidelines/
- https://play.google.com/console/about/guides/releasewithconfidence/
