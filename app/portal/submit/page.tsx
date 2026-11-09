import Link from "next/link";
import LibraryForm from "@/components/LibraryForm";
import { PageHeader, Panel } from "@/components/ui";
import { requirePage } from "@/lib/auth";

export default async function Submit() {
  const me = await requirePage();
  return (
    <>
      <PageHeader eyebrow="Resource library" title="Submit to the library">Share research, a case study, an article or a guideline. The Education committee reviews every submission before it is published, and you will get an email with the decision.</PageHeader>
      <Panel title="New submission" action={<Link href="/portal/library" className="text-xs font-bold text-blue">My submissions</Link>}>
        {me.status !== "active" ? <p className="text-sm text-muted">Submissions are open to active members. Complete your membership payment to unlock this.</p> : (
          <LibraryForm url="/api/portal/library" kinds={["research", "case", "article", "guideline"]} submit="Send for review" success="Sent. It now waits for the Education committee." />
        )}
      </Panel>
    </>
  );
}
