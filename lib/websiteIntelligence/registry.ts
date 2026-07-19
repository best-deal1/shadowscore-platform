import type { WebsiteScanModule } from "./types";
const modules = new Map<string, WebsiteScanModule>();
export function registerWebsiteModule(module: WebsiteScanModule) { modules.set(module.id, module); return module; }
export function websiteModules() { return [...modules.values()]; }
