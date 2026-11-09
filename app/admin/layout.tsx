import { DashShell, type NavItem } from "@/components/DashShell";
import { can, requirePage } from "@/lib/auth";
import { listMembers, listPayments, listResources, listTickets, resolveAudience } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/types";

type Area = Parameters<typeof can>[1];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requirePage();
  const has = (a: Area) => can(me.role, a);
  const [members, payments, tickets, overdue, resources] = await Promise.all([
    has("applications") ? listMembers() : [],
    has("payments") ? listPayments() : [],
    has("support") ? listTickets() : [],
    has("messaging") ? resolveAudience({ type: "overdue" }) : [],
    has("content") ? listResources(true) : [],
  ]);
  const pending = members.filter((m) => m.status === "pending").length;
  const unmatched = payments.filter((p) => !p.memberId).length;
  const open = tickets.filter((t) => t.status === "open").length;
  const review = resources.filter((r) => r.status === "pending").length;
  // `area` may be a list: the link shows when the person can use any of them.
  const all: (NavItem & { area: Area | Area[] | null })[] = [
    { href: "/admin", label: "Overview", area: null, group: "" },
    { href: "/admin/applications", label: "Applications", area: "applications", badge: pending, group: "Membership & finance" },
    { href: "/admin/members", label: "Members", area: "members", group: "Membership & finance" },
    { href: "/admin/payments", label: "Payments", area: "payments", badge: unmatched, group: "Membership & finance" },
    { href: "/admin/messaging", label: "Bulk SMS & email", area: "messaging", badge: overdue.length, group: "Communications" },
    { href: "/admin/newsletter", label: "Weekly newsletter", area: "broadcast", group: "Communications" },
    { href: "/admin/subscribers", label: "Subscribers", area: "subscribers", group: "Communications" },
    { href: "/admin/comms", label: "News & help desk", area: ["broadcast", "announcements", "support"], badge: open, group: "Communications" },
    { href: "/admin/library", label: "Resource library", area: "content", badge: review, group: "Education" },
    { href: "/admin/events", label: "Events & attendance", area: "events", group: "Events & website" },
    { href: "/admin/calendar", label: "Calendar", area: "events", group: "Events & website" },
    { href: "/admin/site", label: "Website & gallery", area: ["site", "gallery"], group: "Events & website" },
    { href: "/admin/departments", label: "Leadership & departments", area: "departments", group: "Society" },
    { href: "/admin/reports", label: "Reports", area: "reports", group: "Society" },
    { href: "/admin/audit", label: "Audit log", area: "audit", group: "Society" },
    { href: "/admin/team", label: "Admin accounts", area: "admins", group: "Society" },
  ];
  const nav: NavItem[] = all
    .filter((n) => n.area === null || (Array.isArray(n.area) ? n.area.some(has) : has(n.area)))
    .map((n) => ({ href: n.href, label: n.label, badge: n.badge, group: n.group }));
  return (
    <DashShell title="SATA Admin" subtitle={ROLE_LABEL[me.role]} bottomTabs="admin" user={{ name: me.name, role: ROLE_LABEL[me.role] }} nav={[...nav, { href: "/portal", label: "My member portal", group: "You" }]}>
      {children}
    </DashShell>
  );
}
