import { DashShell } from "@/components/DashShell";
import { requirePage } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const me = await requirePage();
  return (
    <DashShell
      title="My SATA"
      subtitle="Member portal"
      bottomTabs
      user={{ name: me.name, role: me.role === "member" ? me.cadre : me.role }}
      nav={[
        { href: "/portal", label: "Dashboard" },
        { href: "/portal/events", label: "Events & attendance" },
        { href: "/portal/calendar", label: "Calendar" },
        { href: "/portal/payments", label: "Payments & receipts" },
        { href: "/portal/support", label: "Help desk" },
        { href: "/portal/profile", label: "Profile" },
        ...(me.role !== "member" ? [{ href: "/admin", label: "Open admin →" }] : []),
      ]}
    >
      {children}
    </DashShell>
  );
}
