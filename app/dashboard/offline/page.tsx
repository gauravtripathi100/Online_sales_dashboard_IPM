
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopNav from "@/components/TopNav";
import ComingSoon from "@/components/ComingSoon";

export default async function OfflineDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <TopNav user={{ name: session.name, role: session.role }} />
      <div className="wrap">
        <ComingSoon
          title="Offline Revenue Dashboard"
          description="Center-wise (COCO/FOFO) revenue and enrollment breakdowns, built from the same 634 report you're already uploading. Your uploaded data is already being captured for this — the dashboard view is coming next."
        />
      </div>
    </div>
  );
}
