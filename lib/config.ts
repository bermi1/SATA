import type { Category } from "./types";

export const FEES: Record<Category, { registration: number; label: string }> = {
  full: { registration: 100_000, label: "Full Member" },
  associate: { registration: 20_000, label: "Associate Member" },
  honorary: { registration: 0, label: "Honorary Member" },
};

export const ORG = {
  name: "Society of Anaesthesiologists of Tanzania",
  short: "SATA",
  tagline: "Advancing Safe and Quality Anaesthesia and Critical Care Across Tanzania.",
  address: "MUHAS/MOI, P.O. Box 65387, Dar es Salaam, Tanzania",
  phone: "+255 754 092 507",
  email: "info@sata.co.tz",
  renewalMonth: "30 June",
};

export const REGIONS = [
  "Arusha", "Dar es Salaam", "Dodoma", "Geita", "Iringa", "Kagera", "Katavi", "Kigoma", "Kilimanjaro", "Lindi",
  "Manyara", "Mara", "Mbeya", "Morogoro", "Mtwara", "Mwanza", "Njombe", "Pwani", "Rukwa", "Ruvuma",
  "Shinyanga", "Simiyu", "Singida", "Songwe", "Tabora", "Tanga", "Zanzibar",
];

export const CADRES = [
  "Anaesthesiologist", "Anaesthetic Officer", "Nurse Anaesthetist", "Clinical Officer", "Medical Officer", "Pharmacist", "Resident (Anaesthesia)",
];

export const fmtTZS = (n: number) => `TZS ${n.toLocaleString("en-US")}`;
