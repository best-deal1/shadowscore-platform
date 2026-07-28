import { MonitoringDashboard } from "@/components/monitoring/MonitoringDashboard";
import { monitoringDemoAlerts, monitoringDemoEntities, monitoringDemoSnapshots } from "@/lib/continuousMonitoring/demo";
export default function MonitoringPage(){return <MonitoringDashboard entities={monitoringDemoEntities} snapshots={monitoringDemoSnapshots} alerts={monitoringDemoAlerts}/>;}

