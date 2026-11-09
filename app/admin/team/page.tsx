import { Badge, PageHeader, Panel } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { listAdmins } from "@/lib/admin-team";
import { ROLE_LABEL } from "@/lib/types";
import TeamManager from "./TeamManager";

export default async function Team() {
  const me = await requirePage("admins");
  const admins = await listAdmins();
  return (
    <>
      <PageHeader eyebrow="Access" title="Admin accounts">Give committee members access to the console. They sign in with their email and a one-time code.</PageHeader>
      <div className="grid gap-6">
        <Panel title={`People with admin access (${admins.length})`}>
          <TeamManager
            meId={me.id}
            meRole={me.role}
            writable={canWrite(me.role, "admins")}
            admins={admins.map((a) => ({ id: a.id, name: a.name, email: a.email, role: a.role }))}
            labels={ROLE_LABEL}
          />
        </Panel>
        <Panel title="What each role can do">
          <ul className="grid gap-2 text-sm text-muted sm:grid-cols-2">
            <li><Badge>Secretariat</Badge> Everything, including admin accounts.</li>
            <li><Badge>Management</Badge> Applications, members, payments, bulk messaging, newsletter, help desk.</li>
            <li><Badge>Treasurer</Badge> Members, payments, reports and messaging.</li>
            <li><Badge>Education</Badge> Resource library and member submissions.</li>
            <li><Badge>Social</Badge> Events, attendance, news, gallery and website content.</li>
            <li><Badge>Leadership</Badge> View-only summary of most areas.</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
