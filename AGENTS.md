# AGENTS.md

Angular 22 SPA for furniture quoting (Movilockers). Standalone components, zoneless change detection, signals. The backend is a separate Spring service; `README.md` is stock Angular CLI boilerplate.

## Commands

```bash
npm start                                              # ng serve -> http://localhost:4200
npm run build                                          # production build; doubles as typecheck
npm run build -- --configuration development           # faster build
npx ng test --watch=false                              # Vitest + jsdom via @angular/build:unit-test
npx ng test --watch=false --include src/app/app.spec.ts --filter "should create"
npx prettier --write <files>                           # no lint/format npm script exists
```

- `proxy.conf.json` maps `/api` -> `localhost:8080` and `/ml` -> `localhost:8000`. Use `npm start`; a static server will not proxy API calls.
- The only current spec is the stale scaffold `src/app/app.spec.ts`. Its `should render title` test fails because `App` renders just `<router-outlet>`; do not treat that as a regression you caused.
- Production build output goes to `dist/cotizacion-muebles-frontend/`.

## Architecture

- Bootstrap: `src/main.ts` -> `src/app/app.config.ts`. Root providers include `provideZonelessChangeDetection()`, router, `HttpClient`, ng2-charts, and `LOCALE_ID = 'es-CL'`. No NgModules and no zone.js: use signals (or the async pipe) so zoneless change detection sees updates.
- `src/app/app.routes.ts`: `login` is public; all other pages nest under `Layout` behind `authGuard`; `usuarios` and `reportes` also require `adminGuard`. Feature `*.routes.ts` files export uppercase constants (`CLIENTES_ROUTES`, etc.) and lazy-load standalone components with `loadComponent`.
- Directory ownership: `core/` = auth, guards, layout shell, cross-cutting models/services; `features/<feature>/` = routes, pages, models, services; `shared/` = reusable components, `money` pipe, toast/confirm services. No UI framework or component library; styling is hand-written CSS with tokens in `src/styles.css`.
- `AuthService` stores the session in `localStorage` under `cotizacion_user`. There is no token, auth header, or HTTP interceptor, so login/logout must go through `AuthService` to update the signal and guards.
- Role names differ by context: login uses `'ADMIN' | 'USUARIO'`; `/api/usuarios` returns `'ADMIN' | 'ASESOR'` (not `ADMINISTRADOR`). Match those exact values when filtering or rendering.
- Use relative `/api/...` URLs. `UsuarioService` is the exception, hardcoding `http://localhost:8080/api/usuarios` and bypassing the dev proxy; prefer proxy-relative URLs when editing.
- `@Service()` in `features/cotizaciones/services/cotizacion.ts` is Angular 22's auto-provided service decorator, not a typo for `@Injectable`.
- Quote flow: `wizard-cotizacion` loads `/api/catalogos/*`, calls `POST /api/cotizacion/predecir` for ML pricing, then `POST /api/cotizacion/confirmar` to persist. `confirmar` currently hardcodes `idUsuario=1`.
- Charts use ng2-charts/Chart.js. `jspdf` and `html2canvas` are installed but not imported anywhere yet.
- SSR-related packages and the `serve:ssr` script are scaffold leftovers: `angular.json` builds `outputMode: "static"` and there is no server entrypoint. Do not assume SSR.
- `src/app/app.ts` uses an inline template; `src/app/app.html` and the empty `app.css` are unused scaffold leftovers. Edit `app.ts` for the root component.
