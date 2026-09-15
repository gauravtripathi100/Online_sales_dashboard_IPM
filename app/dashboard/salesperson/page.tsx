import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopNav from "@/components/TopNav";
import SalesPersonDashboardClient from "@/components/SalesPersonDashboardClient";

export default async function SalesPersonDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <TopNav user={{ name: session.name, role: session.role }} />
      <div className="wrap">
        <SalesPersonDashboardClient />
      </div>
    </div>
  );
}
