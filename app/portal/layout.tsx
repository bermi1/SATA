import { DashShell } from "@/components/DashShell";
import { requirePage } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/types";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const me = await requirePage();
  return (
    <DashShell
      title="My SATA"
      subtitle="Member portal"
      bottomTabs
      user={{ name: me.name, role: me.role === "member" ? me.cadre : ROLE_LABEL[me.role], demo: !!me.demo }}
      nav={[
        { href: "/portal", label: "Dashboard" },
        { href: "/portal/events", label: "Events & attendance", group: "Membership" },
        { href: "/portal/calendar", label: "Calendar", group: "Membership" },
        { href: "/portal/payments", label: "Payments & receipts", group: "Membership" },
        { href: "/portal/library", label: "My submissions", group: "Library" },
        { href: "/portal/submit", label: "Submit an article", group: "Library" },
        { href: "/portal/support", label: "Help desk", group: "Account" },
        { href: "/portal/profile", label: "Profile", group: "Account" },
        ...(me.role !== "member" ? [{ href: "/admin", label: "Committee console", group: "Account" }] : []),
      ]}
    >
      {children}
    </DashShell>
  );
}
