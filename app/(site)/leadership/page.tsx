import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { TeamCard } from "@/components/TeamCard";
import { listDepartments, listMembers, listTeam } from "@/lib/store";

export const metadata: Metadata = { title: "Leadership & Governance" };

export default async function Leadership() {
  const depts = await listDepartments();
  const members = await listMembers();
  const team = await listTeam();
  const EXECUTIVE = team.filter((m) => m.group === "executive");
  const COMMITTEE = team.filter((m) => m.group === "committee");
  return (
    <>
      <PageHero pageKey="leadership" eyebrow="Leadership & governance" title="The people who lead SATA." image="/images/events/mbeya-2026.jpg" crumbs={[["Leadership"]]}
        intro="The Executive Committee leads the Society between Annual General Meetings. Departments carry out its work." />

      <section id="executive" className="mx-auto max-w-7xl scroll-mt-28 px-5 pt-12">
        <h2 className="font-display text-xl font-bold text-deep">Executive Committee</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {EXECUTIVE.map((m, i) => <TeamCard key={m.slug} m={m} priority={i < 3} />)}
        </div>
      </section>

      <section id="committee" className="mx-auto max-w-7xl scroll-mt-28 px-5 pt-14">
        <h2 className="font-display text-xl font-bold text-deep">AAAC 2027 organising committee</h2>
        <p className="mt-1 text-sm text-muted">Members who are also leading the 10th All Africa Anaesthesia Congress, hosted by SATA in Dar es Salaam.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {COMMITTEE.map((m) => <TeamCard key={m.slug} m={m} />)}
        </div>
      </section>

      <section id="departments" className="mx-auto max-w-7xl scroll-mt-28 px-5 pt-14">
        <h2 className="font-display text-xl font-bold text-deep">Departments</h2>
        <p className="mt-1 text-sm text-muted">Each department has a head from the Executive Committee and member volunteers. Proposed structure, for the Executive Committee to confirm.</p>
        <ul className="mt-6 grid gap-x-10 divide-y divide-line md:grid-cols-2 md:divide-y-0">
          {depts.map((d, i) => {
            const head = d.headMemberId ? members.find((m) => m.id === d.headMemberId) ?? null : null;
            const count = members.filter((m) => m.departmentIds.includes(d.id)).length;
            return (
              <li key={d.id} className="flex gap-4 border-b border-line py-4">
                <span className="font-display text-sm font-bold text-blue/50">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3"><h3 className="font-display text-[15px] font-bold text-deep">{d.name}</h3><span className="text-xs text-muted">{count} members</span></div>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{d.mandate}</p>
                  <p className="mt-1 text-xs font-semibold text-ink">Head: {head ? head.name : <span className="font-normal text-muted">to be appointed</span>}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <p className="mx-auto max-w-7xl px-5 pt-8 text-xs text-muted">Roles as published at sata.co.tz/our-leadership-and-governance. LinkedIn links open a name search until a member&apos;s own profile is added.</p>
    </>
  );
}
