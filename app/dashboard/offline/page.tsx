import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopNav from "@/components/TopNav";
import RevenueDashboardClient from "@/components/RevenueDashboardClient";

export default async function OfflineDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <TopNav user={{ name: session.name, role: session.role }} />
      <div className="wrap">
        <RevenueDashboardClient
          channel="offline"
          title="SuperGrads Offline Sales Dashboard"
          description="Center-wise (COCO/FOFO) enrollments only — from the same uploaded 634 report."
        />
      </div>
    </div>
  );
}
