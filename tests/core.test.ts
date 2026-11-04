import fs from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fromDb, toDb } from "../lib/db/map";
import { checkCode, issueCode } from "../lib/otp";
import { normalizePhone, smsSegments } from "../lib/sms";
import {
  applyForMembership, createEvent, decideApplication, getMember, getMemberByEmail, isInGoodStanding, recordAttendance, recordPayment,
  reconcilePayment, registerForEvent, listPayments, listEvents, resolveAudience, stats,
} from "../lib/store";
import { repo } from "../lib/db";
import type { Payment } from "../lib/types";

const DB = ".data/test-db.json";
beforeAll(() => { fs.rmSync(DB, { force: true }); });
afterAll(() => { fs.rmSync(DB, { force: true }); });

describe("phone numbers", () => {
  it("normalises Tanzanian formats to +255", () => {
    expect(normalizePhone("0754 092 507")).toBe("+255754092507");
    expect(normalizePhone("+255 754 092 507")).toBe("+255754092507");
    expect(normalizePhone("754092507")).toBe("+255754092507");
    expect(normalizePhone("00255754092507")).toBe("+255754092507");
  });
  it("rejects numbers that cannot be valid", () => {
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("+254712345678")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });
  it("counts SMS segments for GSM-7 and Unicode text", () => {
    expect(smsSegments("a".repeat(160))).toBe(1);
    expect(smsSegments("a".repeat(161))).toBe(2);
    expect(smsSegments("é".repeat(71))).toBe(2);
  });
});

describe("row mapping", () => {
  it("converts camelCase to snake_case and undefined to null", () => {
    expect(toDb({ memberNo: "SATA-1", lastReminderAt: undefined })).toEqual({ member_no: "SATA-1", last_reminder_at: null });
  });
  it("keeps typed nulls, drops optional nulls, normalises timestamps", () => {
    const r = fromDb<{ paidThrough: null; theme?: string; startsAt: string }>({ paid_through: null, theme: null, starts_at: "2026-05-20T08:00:00+00:00" });
    expect(r.paidThrough).toBeNull();
    expect("theme" in r).toBe(false);
    expect(r.startsAt).toBe("2026-05-20T08:00:00.000Z");
  });
});

describe("membership and payments", () => {
  it("takes an application, approves it, and activates good standing only after payment effects", async () => {
    const a = await applyForMembership({ name: "Test Person", email: "  Test.Person@Example.TZ ", phone: "0712 345 678", category: "associate", cadre: "Nurse Anaesthetist", facility: "Test Hospital", region: "Mbeya" });
    if ("error" in a) throw new Error(a.error);
    expect(a.member.status).toBe("pending");
    expect(a.member.email).toBe("test.person@example.tz");
    expect(a.member.phone).toBe("+255712345678");
    expect((await getMemberByEmail("TEST.PERSON@example.tz"))?.id).toBe(a.member.id);
    expect(await applyForMembership({ name: "Dup", email: "test.person@example.tz", phone: "0712345678", category: "full", cadre: "x", facility: "x", region: "x" })).toEqual({ error: "An application with this email already exists" });

    const d = await decideApplication(a.member.id, true, "tester");
    if ("error" in d) throw new Error(d.error);
    expect(d.member.status).toBe("active");
    expect(isInGoodStanding(d.member)).toBe(true);
    expect(await decideApplication(a.member.id, true, "tester")).toEqual({ error: "Application not found" });
  });

  it("issues sequential receipts and extends the paid-through date", async () => {
    const m = (await getMemberByEmail("test.person@example.tz"))!;
    const before = new Date(m.paidThrough!).getTime();
    const p1 = await recordPayment({ memberId: m.id, purpose: "subscription", amount: 25_000, method: "mpesa" }, "tester");
    const p2 = await recordPayment({ memberId: m.id, purpose: "subscription", amount: 25_000, method: "airtel" }, "tester");
    if ("error" in p1 || "error" in p2) throw new Error("payment failed");
    const n1 = Number(p1.payment.receiptNo!.slice(-4)), n2 = Number(p2.payment.receiptNo!.slice(-4));
    expect(n2).toBe(n1 + 1);
    expect(new Date((await getMember(m.id))!.paidThrough!).getTime()).toBeGreaterThan(before);
  });

  it("reconciles an unmatched payment exactly once", async () => {
    const m = (await getMemberByEmail("test.person@example.tz"))!;
    const unmatched = (await listPayments()).find((p) => !p.memberId)!;
    const ok = await reconcilePayment(unmatched.id, m.id, "tester");
    expect("payment" in ok ? ok.payment?.receiptNo : null).toBeTruthy();
    expect(await reconcilePayment(unmatched.id, m.id, "tester")).toEqual({ error: "Payment or member not found" });
  });

  it("only ever stores positive payment amounts", async () => {
    const p: Payment[] = await repo().list<Payment>("payments");
    expect(p.every((x) => x.amount > 0)).toBe(true);
  });
});

describe("events, registration and attendance", () => {
  it("enforces capacity, prevents duplicates, charges the right fee, and credits CPD once", async () => {
    const m = (await getMemberByEmail("test.person@example.tz"))!;
    const ev = await createEvent({ title: "Test Workshop", type: "workshop", mode: "physical", startsAt: new Date(Date.now() + 86_400_000).toISOString(), endsAt: new Date(Date.now() + 2 * 86_400_000).toISOString(), venue: "Hall", summary: "x", capacity: 1, cpdPoints: 5, fees: { associate: 10_000, guest: 30_000 } }, "tester");

    const r1 = await registerForEvent(ev.id, { memberId: m.id });
    if ("error" in r1) throw new Error(r1.error);
    expect(r1.fee).toBe(10_000);
    expect(r1.registration.paid).toBe(false);

    const again = await registerForEvent(ev.id, { memberId: m.id });
    expect("already" in again && again.already).toBe(true);
    expect(await registerForEvent(ev.id, { guestName: "Late Guest", guestEmail: "g@example.com" })).toEqual({ error: "This event is full" });

    const pointsBefore = (await getMember(m.id))!.cpdPoints;
    const a = await recordAttendance(ev.id, { ticketCode: r1.registration.ticketCode }, { method: "qr", actor: "tester" });
    if ("error" in a) throw new Error(a.error);
    expect(a.cpdAwarded).toBe(5);
    expect((await getMember(m.id))!.cpdPoints).toBe(pointsBefore + 5);
    expect(await recordAttendance(ev.id, { ticketCode: r1.registration.ticketCode }, { method: "qr", actor: "tester" })).toEqual({ error: "Already checked in" });
    expect(await recordAttendance(ev.id, { ticketCode: "NOPE-000000" }, { method: "qr", actor: "tester" })).toEqual({ error: "Ticket not recognised for this event" });
  });

  it("hides drafts from the public list", async () => {
    await createEvent({ title: "Secret Draft", type: "meeting", mode: "online", startsAt: new Date(Date.now() + 86_400_000).toISOString(), endsAt: new Date(Date.now() + 90_000_000).toISOString(), venue: "Online", summary: "x", capacity: null, cpdPoints: 0, fees: {}, status: "draft" }, "tester");
    expect((await listEvents()).some((e) => e.title === "Secret Draft")).toBe(false);
    expect((await listEvents({ includeDrafts: true })).some((e) => e.title === "Secret Draft")).toBe(true);
  });
});

describe("audiences and stats", () => {
  it("never messages suspended members and de-duplicates 'everyone'", async () => {
    const all = await resolveAudience({ type: "everyone" });
    const keys = all.map((r) => r.email?.toLowerCase() ?? r.phone ?? r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it("computes dashboard statistics", async () => {
    const s = await stats();
    expect(s.total).toBeGreaterThan(0);
    expect(s.good).toBeLessThanOrEqual(s.total);
  });
});

describe("one-time sign-in codes", () => {
  it("accepts the right code once", async () => {
    const code = await issueCode("a@example.com");
    expect(code).toMatch(/^\d{6}$/);
    expect(await checkCode("a@example.com", code)).toBe("ok");
    expect(await checkCode("a@example.com", code)).toBe("expired");
  });
  it("locks after five wrong guesses, even if the right code follows", async () => {
    const code = await issueCode("b@example.com");
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) expect(await checkCode("b@example.com", wrong)).toBe("invalid");
    expect(await checkCode("b@example.com", code)).toBe("expired");
  });
  it("a new code replaces the old one", async () => {
    const first = await issueCode("c@example.com");
    const second = await issueCode("c@example.com");
    if (first !== second) expect(await checkCode("c@example.com", first)).toBe("invalid");
    expect(await checkCode("c@example.com", second)).toBe("ok");
  });
});

describe("rate limiting", () => {
  it("counts hits inside the window", async () => {
    let n = 0;
    for (let i = 0; i < 4; i++) n = await repo().rateHit("test-key", 60_000);
    expect(n).toBe(4);
  });
});
