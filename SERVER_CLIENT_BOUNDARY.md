# V27 Server/Client Architecture Audit

## Scope and Next.js rule baseline

This audit covers the current ShadowScore App Router architecture and classifies the modules that are server-only versus client-safe. No application code was refactored.

Per the local Next.js documentation in `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, App Router layouts and pages are Server Components by default, while files with a top-level `"use client"` directive become Client Components. Client Components are appropriate for state, event handlers, lifecycle hooks, and browser APIs. Server Components are appropriate for database/API access, secrets, reducing browser JavaScript, and server-side data work.

Per `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md`, `metadata` and `generateMetadata` exports are supported only in Server Components.

## Current client entry points

The following App Router pages/components are explicit Client Components today because they start with `"use client"`:

- `app/page.tsx`
- `app/page-backup.tsx`
- `app/analysis/page.tsx`
- `app/admin/page.tsx`
- `app/report/analysis/page.tsx`
- `app/report/page.tsx`
- `app/account/page.tsx`
- `app/intake/page.tsx`
- `app/signup/page.tsx`
- `app/dashboard/page.tsx`
- `app/login/page.tsx`
- `app/admin-lite/page.tsx`
- `app/radar/page.tsx`
- `app/leads/page.tsx`
- `components/PaymentButtons.tsx`
- `app/components/PaymentButtons.tsx`

Any import reachable from these files must be browser-compatible unless it is a type-only import that is erased by TypeScript.

## Files that must never be imported by client components

These modules either import Node-only APIs, instantiate provider/report pipeline objects, perform privileged/server-side orchestration, or expose data-loading boundaries that should not be bundled into client pages.

| File | Classification | Why client import is unsafe |
| --- | --- | --- |
| `lib/providers/DNSProvider.ts` | Server-only | Imports `node:dns`, performs DNS lookups with Node's DNS resolver, and cannot run in the browser. |
| `lib/providers/WHOISProvider.ts` | Server-only | Provider implementation intended for server-side intelligence collection; should remain behind the provider manager/report pipeline boundary. |
| `lib/providers/BaseProvider.ts` | Server-only framework implementation | Base class for executable providers; safe types should be separated from executable provider code before client imports. |
| `lib/providers/ProviderManager.ts` | Server-only orchestration | Runs registered providers and aggregates provider execution results. |
| `lib/providers/defaultProviders.ts` | Server-only registry | Constructs executable provider instances. If DNS is enabled here later, importing this from a client path would pull `node:dns` into the browser bundle. |
| `lib/providers/index.ts` | Server-only barrel in current form | Re-exports executable providers/manager/default provider factory together with types. Client imports from this barrel risk pulling server-only provider modules into client bundles. |
| `lib/reportPipeline.ts` | Server-only report pipeline | Imports the provider barrel, creates a module-level provider manager, runs providers, and calls risk analysis to build paid reports. |
| `lib/admin.ts` | Server-only admin aggregation | Imports provider factory and report pipeline constants, calls workspace loading, and exposes registered provider metadata by constructing providers. |
| `lib/workspace.ts` | Mixed today; treat as server-only until split | Imports `buildReadyReport` from `lib/reportPipeline.ts`, so client imports can transitively reach the provider framework. Several client pages currently import workspace actions/types. |

Additional caution:

- `lib/riskEngine.ts` is computational and does not directly import Node APIs, but it imports `ProviderResult` from the provider barrel as a normal import. It should use a type-only import from a type-only module before being considered fully client-safe.
- `lib/auth.ts`, `lib/config.ts`, and `lib/legal.ts` are currently client-safe in practice because they are used by client components and rely on browser-safe logic/public environment values. Keep them free of Node-only APIs and secrets.
- `lib/supabase.ts` uses `fetch` and public env configuration. It can be shared only if it never exposes service-role keys or privileged server credentials.

## Provider framework server-only boundary

The provider framework boundary should be drawn around executable provider code:

- `lib/providers/BaseProvider.ts`
- `lib/providers/ProviderManager.ts`
- `lib/providers/defaultProviders.ts`
- `lib/providers/placeholderProviders.ts`
- `lib/providers/WHOISProvider.ts`
- `lib/providers/DNSProvider.ts`
- the executable exports in `lib/providers/index.ts`

Provider execution should only happen from server-side code paths such as Route Handlers, Server Actions, background jobs, or Server Components that do not opt into `"use client"`.

Client-safe provider data should be limited to serialized records that already came from the server, for example:

- provider IDs
- provider names
- versions
- categories
- health/status strings
- evidence/result JSON already stored in reports

Recommended boundary shape:

- Keep `lib/providers/*Provider.ts`, `ProviderManager.ts`, and `defaultProviders.ts` server-only.
- Create or use a type-only/provider-metadata module that exports plain TypeScript types and static metadata without importing provider implementations.
- Avoid importing from the provider barrel (`lib/providers/index.ts`) in Client Components or shared client modules.

## Report pipeline server-only boundary

`lib/reportPipeline.ts` is server-only because it:

1. imports `ProviderManager` and `createDefaultProviders` from the provider barrel;
2. creates a module-level provider manager with registered executable providers;
3. runs provider collection against intake/payment context;
4. builds finalized report objects after payment gating.

The report pipeline should only be invoked from server-controlled paths. Client pages should request report generation through a server endpoint/action, then render the serialized `ShadowScoreReport` response or stored database row.

Current high-risk transitive path:

```text
Client Component
  -> lib/workspace.ts
     -> lib/reportPipeline.ts
        -> lib/providers/index.ts
           -> executable provider framework
```

This means any Client Component importing runtime values from `lib/workspace.ts` can risk bundling report-generation/provider code. Type-only imports are acceptable only when they compile away and do not use a runtime barrel that also exports executable providers.

## Admin UI safe metadata approach

The admin UI should not import `lib/admin.ts` directly from a Client Component. Today `app/admin/page.tsx` is a Client Component and imports `getAdminConsoleData` and `isAdminAllowed` from `lib/admin.ts`, which imports provider/report pipeline code.

Safe approach:

1. Keep the interactive admin shell as a Client Component if it needs `useState`, `useEffect`, routing, filters, JSON viewers, or client-only UI behavior.
2. Move privileged admin data loading to a server-only boundary:
   - a Server Component wrapper page that fetches admin data and passes serialized props into a child client component; or
   - an `/api/admin/...` Route Handler that validates auth/allowlist and returns serialized JSON; or
   - a Server Action if the project standardizes on actions.
3. Return only plain JSON metadata needed by the UI:
   - provider framework version;
   - risk/report engine versions;
   - workspace mode;
   - Supabase connection status;
   - payment provider status;
   - registered provider metadata as `{ id, name, version, category }`.
4. Do not construct provider instances in code imported by the admin client bundle. Prefer a static provider manifest for admin display, or build provider metadata server-side and serialize it.

For page metadata, keep `metadata`/`generateMetadata` exports in server files only. If `app/admin/page.tsx` remains a Client Component, put admin route metadata in `app/admin/layout.tsx` or convert `app/admin/page.tsx` into a Server Component that renders a nested `AdminClient` component.

## Why `DNSProvider` / `node:dns` cannot be imported into client pages

`lib/providers/DNSProvider.ts` imports `promises as dns` from `node:dns`. `node:dns` is a Node.js core module, not a browser API. Browser JavaScript cannot open arbitrary DNS resolver calls via Node's DNS API, and Next.js client bundles cannot ship Node core modules to the browser.

If a Client Component imports a module that statically imports `DNSProvider`, the bundler must analyze that dependency graph for the client bundle. The result is either:

- a compile-time error because `node:dns` cannot be resolved/polyfilled for the browser;
- accidental server-only code leakage into the client graph; or
- a brittle bundle that fails when the provider registry later starts importing `DNSProvider` from a shared barrel.

DNS lookups must therefore be executed on the server and exposed to the UI only as serialized report/provider results.

## Recommended minimal fix plan

No refactor was performed for this audit. The recommended minimal future fix is:

1. **Split provider types from provider runtime.**
   - Add a type-only module such as `lib/providers/types.ts` or `lib/providerTypes.ts` for `ProviderResult`, `ProviderExecutionContext`, and metadata shapes.
   - Ensure client-safe modules import only from that type-only module using `import type`.
2. **Stop importing the provider barrel from shared/client-reachable modules.**
   - Keep `lib/providers/index.ts` server-only, or split it into `server.ts` and `types.ts` entry points.
3. **Split `lib/workspace.ts`.**
   - Move pure types and browser-safe workspace client helpers to a client-safe module.
   - Move `markPaymentPaidAndGenerateReport` and anything importing `lib/reportPipeline.ts` to a server-only module.
4. **Move admin data loading behind a server boundary.**
   - Replace direct `app/admin/page.tsx -> lib/admin.ts` runtime imports with a Server Component wrapper, Route Handler, or Server Action.
   - Pass serialized `AdminConsoleData`/metadata to a client UI component.
5. **Create a static provider metadata manifest.**
   - Use it for admin display rather than constructing provider instances in client-reachable code.
6. **Keep DNS provider out of default client paths.**
   - If `DNSProvider` is added to `createDefaultProviders()`, verify the registry is imported only by server code.
7. **Add a guardrail check.**
   - Add lint/build checks that fail when Client Components import `lib/reportPipeline.ts`, executable `lib/providers/*`, or other server-only modules.

## Audit conclusion

The intended architecture is server-side provider execution and report generation, with client pages rendering serialized workspace/admin/report data. The current risk is not that every provider is active in the browser today, but that shared barrels and mixed modules (`lib/providers/index.ts`, `lib/workspace.ts`, and `lib/admin.ts`) make server-only provider/report code reachable from Client Components. The minimal fix is to split runtime server modules from type/metadata modules and route all provider/report/admin data access through explicit server boundaries.
