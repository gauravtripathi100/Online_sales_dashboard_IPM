import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopNav from "@/components/TopNav";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <TopNav user={{ name: session.name, role: session.role }} />
      <div className="wrap">
        <DashboardClient />
      </div>
    </div>
  );
}
