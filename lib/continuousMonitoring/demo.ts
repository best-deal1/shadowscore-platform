import type { MonitoredEntity, MonitoringAlert, MonitoringSnapshot } from "./types";
export const monitoringDemoEntities: MonitoredEntity[] = [
  { id:"monitor-northstar",workspaceId:"demo",reportId:"northstar",company:"Northstar Commerce",target:"northstar.example",status:"attention_required",frequency:"daily",currentTrustScore:62,lastScanAt:"2026-07-28T08:30:00.000Z",lastSuccessfulCycleAt:"2026-07-28T08:30:00.000Z",createdAt:"2026-06-14T10:00:00.000Z" },
  { id:"monitor-cedar",workspaceId:"demo",reportId:"cedar",company:"Cedar Labs",target:"cedarlabs.example",status:"active",frequency:"weekly",currentTrustScore:88,lastScanAt:"2026-07-27T09:15:00.000Z",lastSuccessfulCycleAt:"2026-07-27T09:15:00.000Z",createdAt:"2026-05-20T10:00:00.000Z" },
  { id:"monitor-atlas",workspaceId:"demo",reportId:"atlas",company:"Atlas Supply",target:"atlassupply.example",status:"paused",frequency:"daily",currentTrustScore:74,lastScanAt:"2026-07-24T14:05:00.000Z",lastSuccessfulCycleAt:"2026-07-24T14:05:00.000Z",createdAt:"2026-07-01T10:00:00.000Z" },
];
export const monitoringDemoSnapshots: MonitoringSnapshot[] = [
  {id:"s1",monitoredEntityId:"monitor-northstar",trustScore:78,capturedAt:"2026-07-01T08:30:00.000Z",values:{}},{id:"s2",monitoredEntityId:"monitor-northstar",trustScore:62,capturedAt:"2026-07-28T08:30:00.000Z",values:{}},
  {id:"s3",monitoredEntityId:"monitor-cedar",trustScore:84,capturedAt:"2026-07-01T09:15:00.000Z",values:{}},{id:"s4",monitoredEntityId:"monitor-cedar",trustScore:88,capturedAt:"2026-07-27T09:15:00.000Z",values:{}},
  {id:"s5",monitoredEntityId:"monitor-atlas",trustScore:74,capturedAt:"2026-07-01T14:05:00.000Z",values:{}},{id:"s6",monitoredEntityId:"monitor-atlas",trustScore:74,capturedAt:"2026-07-24T14:05:00.000Z",values:{}}
];
export const monitoringDemoAlerts: MonitoringAlert[] = [
  {id:"a1",monitoredEntityId:"monitor-northstar",company:"Northstar Commerce",provider:"DNS collector",category:"dns",severity:"high",title:"Name servers changed",description:"The authoritative name servers changed since the last scan.",detectedAt:"2026-07-28T08:30:00.000Z",previousValue:"ns1.old.example",currentValue:"ns1.new.example",resolved:false,fingerprint:"a1"},
  {id:"a2",monitoredEntityId:"monitor-northstar",company:"Northstar Commerce",provider:"Trust engine",category:"trust_score",severity:"critical",title:"Trust score fell 16 points",description:"The trust score changed from 78 to 62.",detectedAt:"2026-07-28T08:31:00.000Z",previousValue:78,currentValue:62,resolved:false,fingerprint:"a2"},
  {id:"a3",monitoredEntityId:"monitor-cedar",company:"Cedar Labs",provider:"SSL collector",category:"ssl",severity:"low",title:"Certificate renewed",description:"A new certificate was observed with the expected domain coverage.",detectedAt:"2026-07-27T09:15:00.000Z",previousValue:"2026-08-02",currentValue:"2026-10-25",resolved:true,fingerprint:"a3"}
];
