import { registerHooks } from "node:module";
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (specifier.startsWith("@/")) {
      const path = new URL(`../${specifier.slice(2)}`, import.meta.url).href;
      try { return nextResolve(path, context); }
      catch {
        try { return nextResolve(`${path}.ts`, context); }
        catch { return nextResolve(`${path}/index.ts`, context); }
      }
    }
    try { return nextResolve(specifier, context); }
    catch (error) {
      if ((specifier.startsWith("./") || specifier.startsWith("../")) && !/\.[a-z]+$/i.test(specifier)) {
        try { return nextResolve(`${specifier}.ts`, context); }
        catch { return nextResolve(`${specifier}/index.ts`, context); }
      }
      throw error;
    }
  },
});
