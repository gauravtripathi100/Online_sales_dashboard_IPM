import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopNav from "@/components/TopNav";
import ProductDashboardClient from "@/components/ProductDashboardClient";

export default async function ProductDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <TopNav user={{ name: session.name, role: session.role }} />
      <div className="wrap">
        <ProductDashboardClient />
      </div>
    </div>
  );
}
