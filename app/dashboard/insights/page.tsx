import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopNav from "@/components/TopNav";
import ComingSoon from "@/components/ComingSoon";

export default async function InsightsDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <TopNav user={{ name: session.name, role: session.role }} />
      <div className="wrap">
        <ComingSoon
          title="Targets & Trends"
          description="Monthly Target vs Achieved, YTD Achieved vs Annual Target, YoY month-wise comparison, and MTD revenue & numbers — built on top of your existing uploads."
        />
      </div>
    </div>
  );
}
