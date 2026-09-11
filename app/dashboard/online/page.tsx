import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopNav from "@/components/TopNav";
import RevenueDashboardClient from "@/components/RevenueDashboardClient";

export default async function OnlineDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <TopNav user={{ name: session.name, role: session.role }} />
      <div className="wrap">
        <RevenueDashboardClient
          channel="online"
          title="SuperGrads Online Sales Dashboard"
          description="Online enrollments only — filtered from your uploaded 634 report."
        />
      </div>
    </div>
  );
}
