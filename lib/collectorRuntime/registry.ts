import type { Collector, CollectorDefinition } from "./types";

export class CollectorRegistry {
 private readonly collectors=new Map<string,Collector>();
 register(collector:Collector){const key=`${collector.definition.collectorKey}@${collector.definition.version}`;if(this.collectors.has(key))throw new Error(`Collector ${key} is already registered.`);this.collectors.set(key,collector);return this;}
 get(key:string,version?:string){const matches=[...this.collectors.values()].filter(c=>c.definition.collectorKey===key&&(!version||c.definition.version===version));return matches.sort((a,b)=>b.definition.version.localeCompare(a.definition.version))[0];}
 list():CollectorDefinition[]{return [...this.collectors.values()].map(c=>structuredClone(c.definition)).sort((a,b)=>b.priority-a.priority||a.collectorKey.localeCompare(b.collectorKey));}
}
export const collectorRegistry=new CollectorRegistry();
