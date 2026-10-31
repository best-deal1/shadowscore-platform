import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

// Runs the actual TSX event handlers against deterministic hook state. This
// covers component behavior without substituting a second journey model.
// Layout, focus, hydration, and browser APIs still require browser acceptance.
export async function clientComponentDriver(file, { modules, globals = {} }) {
  const slots = [];
  let cursor = 0;
  let dirty = false;
  let pendingEffects = [];
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], (value) => {
        const next = typeof value === "function" ? value(slots[index]) : value;
        if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ||= { current: initial };
    },
    useMemo(compute) { return compute(); },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const prior = slots[index];
      if (!prior || dependencies.some((value, i) => !Object.is(value, prior.dependencies[i]))) {
        pendingEffects.push(() => {
          prior?.cleanup?.();
          slots[index] = { dependencies, cleanup: effect() };
        });
      }
    },
  };
  const source = await readFile(file, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const output = { exports: {} };
  const context = vm.createContext({
    module: output, exports: output.exports, URLSearchParams, FormData, File,
    process: { env: { NEXT_PUBLIC_PERSONAL_IDENTITY_ENABLED: "true" } },
    require: (specifier) => {
      if (specifier === "react") return hooks;
      if (specifier === "react/jsx-runtime") return require(specifier);
      if (specifier in modules) return typeof modules[specifier] === "string" ? { default: modules[specifier] } : modules[specifier];
      throw new Error(`Unmocked component dependency: ${specifier}`);
    },
    ...globals,
  });
  vm.runInContext(compiled, context, { filename: file.pathname });
  return {
    render(props) {
      let tree;
      let renders = 0;
      do {
        dirty = false; cursor = 0; pendingEffects = [];
        tree = output.exports.default(props);
        for (const effect of pendingEffects) effect();
        if (++renders > 20) throw new Error("Component did not reach stable state.");
      } while (dirty);
      return tree;
    },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
  };
}

export function elements(tree) {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...elements(tree.props?.children)];
}

export function textOf(tree) {
  if (Array.isArray(tree)) return tree.map(textOf).join("");
  if (tree === null || tree === undefined || typeof tree === "boolean") return "";
  return typeof tree === "object" ? textOf(tree.props?.children) : String(tree);
}
