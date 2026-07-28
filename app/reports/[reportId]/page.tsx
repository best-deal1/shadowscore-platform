import ReportFlow from "./ReportFlow";

export default async function FullReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <ReportFlow reportId={reportId} mode="report" />;
}
