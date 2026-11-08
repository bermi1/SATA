import { DashShell, type NavItem } from "@/components/DashShell";
import { can, requirePage } from "@/lib/auth";
import { listMembers, listPayments, listTickets, resolveAudience } from "@/lib/store";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requirePage();
  const pending = (await listMembers()).filter((m) => m.status === "pending").length;
  const unmatched = (await listPayments()).filter((p) => !p.memberId).length;
  const tickets = (await listTickets()).filter((t) => t.status === "open").length;
  const overdue = (await resolveAudience({ type: "overdue" })).length;
  const all: (NavItem & { area: Parameters<typeof can>[1] | null })[] = [
    { href: "/admin", label: "Overview", area: null },
    { href: "/admin/applications", label: "Applications", area: "applications", badge: pending },
    { href: "/admin/members", label: "Members", area: "members" },
    { href: "/admin/events", label: "Events & attendance", area: "events" },
    { href: "/admin/calendar", label: "Calendar", area: "events" },
    { href: "/admin/messaging", label: "Bulk SMS & email", area: "messaging", badge: overdue },
    { href: "/admin/subscribers", label: "Subscribers", area: "subscribers" },
    { href: "/admin/newsletter", label: "Weekly newsletter", area: "announcements" },
    { href: "/admin/payments", label: "Payments", area: "payments", badge: unmatched },
    { href: "/admin/departments", label: "Leadership & departments", area: "departments" },
    { href: "/admin/comms", label: "Communications & help desk", area: "announcements", badge: tickets },
    { href: "/admin/site", label: "Edit website", area: "site" },
    { href: "/admin/reports", label: "Reports", area: "reports" },
    { href: "/admin/audit", label: "Audit log", area: "audit" },
  ];
  const nav: NavItem[] = all
    .filter((n) => n.area === null || can(me.role, n.area))
    .map((n) => ({ href: n.href, label: n.label, badge: n.badge }));
  return (
    <DashShell title="SATA Admin" subtitle="Secretariat console" bottomTabs="admin" user={{ name: me.name, role: me.role }} nav={[...nav, { href: "/portal", label: "My portal →" }]}>
      {children}
    </DashShell>
  );
}
