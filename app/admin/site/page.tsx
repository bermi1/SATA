import Image from "next/image";
import MultipartForm from "@/components/MultipartForm";
import { RowControls } from "@/components/RowControls";
import { PageHeader, Panel } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { getSettings, listPartners, listTeam } from "@/lib/store";
import BannersEditor from "./BannersEditor";
import GalleryEditor from "./GalleryEditor";
import ResourcesEditor from "./ResourcesEditor";
import SettingsForm from "./SettingsForm";
import { listGallery, listResources } from "@/lib/store";

const GROUPS = [{ value: "executive", label: "Executive Committee" }, { value: "committee", label: "AAAC 2027 organising committee" }];
const unopt = (s: string) => s.startsWith("/api/");

export default async function SiteEditor() {
  const me = await requirePage("site");
  const writable = canWrite(me.role, "site");
  const team = await listTeam();
  const partners = await listPartners();
  const settings = await getSettings();
  const resources = await listResources(true);

  const teamFields = (m?: (typeof team)[number]) => [
    { name: "name", label: "Full name", defaultValue: m?.name, span: true },
    { name: "role", label: "Title / role", defaultValue: m?.role, span: true },
    { name: "group", label: "Shown under", type: "select" as const, options: GROUPS, defaultValue: m?.group ?? "executive" },
    { name: "linkedin", label: "LinkedIn profile", type: "url" as const, defaultValue: m?.linkedin, required: false, hint: "Paste the full profile link. Leave blank to link to a LinkedIn search." },
    { name: "note", label: "Extra line (optional)", defaultValue: m?.note, required: false, span: true },
  ];

  return (
    <>
      <PageHeader eyebrow="Website" title="Edit the public website">Change the pictures, people, partners and details visitors see. Changes go live immediately.</PageHeader>
      <nav className="-mt-2 mb-6 flex flex-wrap gap-2 text-xs font-bold" aria-label="Sections">
        {[["team", "Team & leadership"], ["partners", "Partners"], ["hero", "Hero & contact"], ["banners", "Page banners"], ["gallery", "Gallery"], ["resources", "Resources"]].map(([id, l]) => <a key={id} href={`#${id}`} className="rounded-full bg-white px-4 py-2 text-deep ring-1 ring-line hover:text-blue hover:ring-blue">{l}</a>)}
      </nav>
      {!writable && <p className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Your role can view this page but not change it.</p>}

      <div className="grid gap-6">
        <section id="team" className="scroll-mt-24">
          <Panel title={`Team & leadership (${team.length})`}>
            <ul className="divide-y divide-line">
              {team.map((m) => (
                <li key={m.slug} className="py-3 first:pt-0">
                  <div className="flex items-center gap-3">
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-sky-200 to-blue/60"><Image src={m.photo} alt="" fill sizes="48px" className="object-cover object-top" unoptimized={unopt(m.photo)} /></span>
                    <div className="min-w-0 flex-1"><div className="truncate font-semibold text-deep">{m.name}</div><div className="truncate text-xs text-muted">{m.role} · {m.group === "executive" ? "Executive" : "AAAC committee"}</div></div>
                    {writable && <RowControls url="/api/admin/site/team" idKey="slug" id={m.slug} move label={m.name} />}
                  </div>
                  {writable && (
                    <details className="group mt-2">
                      <summary className="cursor-pointer text-xs font-bold text-blue">Edit details & photo</summary>
                      <div className="mt-3 rounded-2xl bg-mist p-4"><MultipartForm url="/api/admin/site/team" hidden={{ slug: m.slug }} image={{ name: "photo", label: "Photo", current: m.photo, round: true }} fields={teamFields(m)} submit="Save profile" /></div>
                    </details>
                  )}
                </li>
              ))}
            </ul>
            {writable && (
              <details className="mt-4 rounded-2xl border border-dashed border-blue/40 p-4">
                <summary className="cursor-pointer text-sm font-bold text-blue">+ Add a team member</summary>
                <div className="mt-4"><MultipartForm url="/api/admin/site/team" image={{ name: "photo", label: "Photo", required: true, round: true }} fields={teamFields()} submit="Add to team" resetOnDone /></div>
              </details>
            )}
          </Panel>
        </section>

        <section id="partners" className="scroll-mt-24">
          <Panel title={`Partners (${partners.length})`}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {partners.map((p) => (
                <li key={p.id} className="rounded-2xl border border-line p-2">
                  <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-white"><Image src={p.logo} alt={p.name} fill sizes="160px" className="object-contain" unoptimized={unopt(p.logo)} /></div>
                  <div className="mt-2 flex items-center justify-between gap-1 px-1"><span className="truncate text-xs font-semibold text-deep">{p.name}</span>{writable && <RowControls url="/api/admin/site/partners" idKey="id" id={p.id} label={p.name} />}</div>
                </li>
              ))}
            </ul>
            {writable && (
              <details className="mt-4 rounded-2xl border border-dashed border-blue/40 p-4">
                <summary className="cursor-pointer text-sm font-bold text-blue">+ Add a partner</summary>
                <div className="mt-4"><MultipartForm url="/api/admin/site/partners" image={{ name: "logo", label: "Logo", required: true }} fields={[{ name: "name", label: "Organisation name", span: true }, { name: "url", label: "Website (optional)", type: "url", required: false, span: true }]} submit="Add partner" resetOnDone /></div>
              </details>
            )}
          </Panel>
        </section>

        <section id="hero" className="scroll-mt-24">
          <Panel title="Hero slideshow & contact details">
            {writable ? <SettingsForm settings={settings} slides={settings.heroSlides} /> : <p className="text-sm text-muted">{settings.address} · {settings.phone} · {settings.email}</p>}
          </Panel>
        </section>

        <section id="banners" className="scroll-mt-24">
          <Panel title="Page banners"><p className="mb-4 text-sm text-muted">The photograph at the top of each inner page. Choose a wide, high-resolution image.</p><BannersEditor banners={settings.pageHeroes ?? {}} focus={settings.pageHeroFocus ?? {}} writable={writable} /></Panel>
        </section>

        <section id="gallery" className="scroll-mt-24">
          <Panel title={`Gallery (${(await listGallery()).length} albums)`}><p className="mb-4 text-sm text-muted">Two or three featured pictures per event, plus a link to the full album. The two newest albums appear in the Resources menu.</p><GalleryEditor albums={await listGallery()} writable={writable} /></Panel>
        </section>

        <section id="resources" className="scroll-mt-24">
          <Panel title={`Resources (${resources.length})`}>
            <ResourcesEditor items={resources} writable={writable} />
          </Panel>
        </section>
      </div>
    </>
  );
}
