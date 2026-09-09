import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopNav from "@/components/TopNav";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <div>
      <TopNav user={{ name: session.name, role: session.role }} />
      <div className="wrap">
        <AdminClient currentUserId={session.userId} />
      </div>
    </div>
  );
}
