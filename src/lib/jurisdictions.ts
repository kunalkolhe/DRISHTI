/**
 * Jurisdiction + escalation model.
 *
 * A civic complaint in India can be pushed up a ladder of authorities that
 * depends on whether the area is a Municipal Corporation, a Municipal Council
 * (small town) or a Gram Panchayat (village) — each governed by a different
 * law and grievance system. This module returns, for a given area + issue
 * category, the ORDERED list of people the citizen may write to:
 *
 *   department field officer  →  local administration  →  elected local body
 *   →  MLA + state minister    →  MP + central grievance portal (CPGRAMS)
 *
 * ⚠️  Emails and names are PLACEHOLDERS. Wire this to a real directory (or a DB
 * table keyed by ward / village) before production. Domain + state are
 * overridable:  NEXT_PUBLIC_GOV_EMAIL_DOMAIN, NEXT_PUBLIC_STATE_NAME
 */

import { getDepartmentContact } from "./departments";

const DOMAIN = process.env.NEXT_PUBLIC_GOV_EMAIL_DOMAIN || "city.gov.example";
const STATE = process.env.NEXT_PUBLIC_STATE_NAME || "Maharashtra";
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "area";

export type AreaType = "MUNICIPAL_CORPORATION" | "MUNICIPAL_COUNCIL" | "GRAM_PANCHAYAT";

export const AREA_TYPE_LABELS: Record<AreaType, string> = {
  MUNICIPAL_CORPORATION: "City — Municipal Corporation (Mahanagar Palika)",
  MUNICIPAL_COUNCIL: "Town — Municipal Council / Nagar Parishad",
  GRAM_PANCHAYAT: "Village — Gram Panchayat",
};

export type AuthorityTier =
  | "DEPARTMENT"
  | "LOCAL_ADMIN"
  | "ELECTED_LOCAL"
  | "STATE"
  | "CENTRAL";

export const TIER_LABELS: Record<AuthorityTier, string> = {
  DEPARTMENT: "Department — first responder",
  LOCAL_ADMIN: "Local administration",
  ELECTED_LOCAL: "Elected local body",
  STATE: "State level",
  CENTRAL: "Central level",
};

export type Authority = {
  id: string;
  role: string;
  tier: AuthorityTier;
  name?: string;
  email: string;
  note?: string;
  /** Pre-ticked in the recipient checklist. */
  defaultSelected?: boolean;
};

export type Jurisdiction = {
  key: string;
  displayName: string;
  areaType: AreaType;
  state: string;
  /** Which law / grievance system governs complaints here. */
  policyNote: string;
  grievancePortal?: { name: string; url: string };
  /** Category-agnostic escalation contacts, ordered low → high. */
  authorities: Authority[];
};

/* ------------------------------------------------------------------ *
 * Policy notes per area type
 * ------------------------------------------------------------------ */

function policyNoteFor(areaType: AreaType, state: string): string {
  switch (areaType) {
    case "MUNICIPAL_CORPORATION":
      return `Governed by the ${state} Municipal Corporation Act. Civic grievances may also be filed on the state grievance portal (e.g. "Aaple Sarkar" in Maharashtra) and escalated to CPGRAMS, Government of India.`;
    case "MUNICIPAL_COUNCIL":
      return `Governed by the ${state} Municipal Councils, Nagar Panchayats and Industrial Townships Act. The District Collector supervises the Council; unresolved issues can be escalated to the state portal and CPGRAMS.`;
    case "GRAM_PANCHAYAT":
      return `Governed by the ${state} Village Panchayats Act (73rd Constitutional Amendment). Raise unresolved issues in the Gram Sabha, then escalate to the Panchayat Samiti (Block) and Zilla Parishad (District), or on CPGRAMS.`;
  }
}

const CPGRAMS: Authority = {
  id: "cpgrams",
  role: "CPGRAMS — Central Public Grievance portal",
  tier: "CENTRAL",
  email: "cpgrams@gov.in",
  note: "File at pgportal.gov.in if there is no response in the SLA window",
};

/* ------------------------------------------------------------------ *
 * Escalation ladder for an area type (without the dept officer)
 * ------------------------------------------------------------------ */

function ladderFor(areaType: AreaType, areaName: string, state: string): Authority[] {
  const s = slug(areaName);
  const common: Authority[] = [
    {
      id: `mla-${s}`,
      role: `MLA — ${areaName} constituency`,
      tier: "STATE",
      email: `mla.${s}@${state.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      note: "Member of the State Legislative Assembly",
    },
    {
      id: `mp-${s}`,
      role: `MP — ${areaName} (Lok Sabha)`,
      tier: "CENTRAL",
      email: `mp.${s}@sansad.nic.in`,
      note: "Member of Parliament",
    },
    CPGRAMS,
  ];

  if (areaType === "GRAM_PANCHAYAT") {
    return [
      {
        id: `gramsevak-${s}`,
        role: "Gram Sevak / Panchayat Secretary",
        tier: "LOCAL_ADMIN",
        email: `gramsevak.${s}@${DOMAIN}`,
        defaultSelected: true,
        note: "Records the complaint in the Panchayat register",
      },
      {
        id: `sarpanch-${s}`,
        role: `Sarpanch — ${areaName} Gram Panchayat`,
        tier: "ELECTED_LOCAL",
        email: `sarpanch.${s}@${DOMAIN}`,
        defaultSelected: true,
      },
      {
        id: `bdo-${s}`,
        role: "Block Development Officer (Panchayat Samiti)",
        tier: "LOCAL_ADMIN",
        email: `bdo.${s}@${DOMAIN}`,
      },
      {
        id: `zp-ceo-${s}`,
        role: "Chief Executive Officer, Zilla Parishad",
        tier: "LOCAL_ADMIN",
        email: `ceo.zp.${s}@${DOMAIN}`,
      },
      {
        id: `min-rural-${slug(state)}`,
        role: `Minister, Rural Development — ${state}`,
        tier: "STATE",
        email: `min.rural@${state.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      },
      ...common,
    ];
  }

  if (areaType === "MUNICIPAL_COUNCIL") {
    return [
      {
        id: `chief-officer-${s}`,
        role: `Chief Officer — ${areaName} Municipal Council`,
        tier: "LOCAL_ADMIN",
        email: `chiefofficer.${s}@${DOMAIN}`,
        defaultSelected: true,
      },
      {
        id: `council-president-${s}`,
        role: `Council President (Nagaradhyaksha) — ${areaName}`,
        tier: "ELECTED_LOCAL",
        email: `president.${s}@${DOMAIN}`,
      },
      {
        id: `collector-${s}`,
        role: `District Collector — supervises the Council`,
        tier: "LOCAL_ADMIN",
        email: `collector.${s}@${DOMAIN}`,
      },
      {
        id: `min-urban-${slug(state)}`,
        role: `Minister, Urban Development — ${state}`,
        tier: "STATE",
        email: `min.urban@${state.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      },
      ...common,
    ];
  }

  // MUNICIPAL_CORPORATION
  return [
    {
      id: `ward-officer-${s}`,
      role: `Ward Officer — ${areaName}`,
      tier: "LOCAL_ADMIN",
      email: `wardofficer.${s}@${DOMAIN}`,
      defaultSelected: true,
      note: "Runs the ward office that owns the field staff",
    },
    {
      id: `municipal-commissioner-${s}`,
      role: `Municipal Commissioner — ${areaName}`,
      tier: "LOCAL_ADMIN",
      email: `commissioner.${s}@${DOMAIN}`,
    },
    {
      id: `corporator-${s}`,
      role: `Corporator / Councillor — ${areaName} ward`,
      tier: "ELECTED_LOCAL",
      email: `corporator.${s}@${DOMAIN}`,
      note: "Your directly elected local representative",
    },
    {
      id: `mayor-${s}`,
      role: `Mayor — ${areaName}`,
      tier: "ELECTED_LOCAL",
      email: `mayor.${s}@${DOMAIN}`,
    },
    ...common.slice(0, 1), // MLA
    {
      id: `min-urban-${slug(state)}`,
      role: `Minister, Urban Development — ${state}`,
      tier: "STATE",
      email: `min.urban@${state.toLowerCase().replace(/\s+/g, "")}.gov.in`,
    },
    ...common.slice(1), // MP, CPGRAMS
  ];
}

/* ------------------------------------------------------------------ *
 * Built-in sample jurisdictions (replace with real data)
 * ------------------------------------------------------------------ */

export function buildJurisdiction(opts: {
  key?: string;
  displayName: string;
  areaType: AreaType;
  areaName: string;
  state?: string;
  grievancePortal?: { name: string; url: string };
}): Jurisdiction {
  const state = opts.state || STATE;
  return {
    key: opts.key || slug(opts.displayName),
    displayName: opts.displayName,
    areaType: opts.areaType,
    state,
    policyNote: policyNoteFor(opts.areaType, state),
    grievancePortal: opts.grievancePortal,
    authorities: ladderFor(opts.areaType, opts.areaName, state),
  };
}

export const JURISDICTIONS: Record<string, Jurisdiction> = {
  "pune-w18": buildJurisdiction({
    key: "pune-w18",
    displayName: "Pune — Ward 18 (Kothrud), PMC",
    areaType: "MUNICIPAL_CORPORATION",
    areaName: "Kothrud",
    state: "Maharashtra",
    grievancePortal: { name: "Aaple Sarkar (Maharashtra)", url: "https://aaplesarkar.mahaonline.gov.in/" },
  }),
  "pcmc-nigdi": buildJurisdiction({
    key: "pcmc-nigdi",
    displayName: "Pimpri-Chinchwad — Nigdi, PCMC",
    areaType: "MUNICIPAL_CORPORATION",
    areaName: "Nigdi",
    state: "Maharashtra",
    grievancePortal: { name: "PCMC Sarathi", url: "https://www.pcmcindia.gov.in/" },
  }),
  "shirur-council": buildJurisdiction({
    key: "shirur-council",
    displayName: "Shirur — Municipal Council",
    areaType: "MUNICIPAL_COUNCIL",
    areaName: "Shirur",
    state: "Maharashtra",
  }),
  "velhe-gp": buildJurisdiction({
    key: "velhe-gp",
    displayName: "Velhe — Gram Panchayat",
    areaType: "GRAM_PANCHAYAT",
    areaName: "Velhe",
    state: "Maharashtra",
  }),
};

/* ------------------------------------------------------------------ *
 * The main entry point used by the Report form
 * ------------------------------------------------------------------ */

/**
 * Returns the full ordered chain of recipients for a complaint:
 * the category's department officer first, then the jurisdiction ladder.
 */
export function getEscalationChain(
  jurisdiction: Jurisdiction,
  category?: string | null,
): Authority[] {
  const dept = getDepartmentContact(category);
  const deptAuthority: Authority = {
    id: "dept-officer",
    role: dept.officerName,
    tier: "DEPARTMENT",
    email: dept.email,
    note: dept.department,
    defaultSelected: true,
  };
  // de-dupe by id (CPGRAMS may appear once)
  const seen = new Set<string>();
  return [deptAuthority, ...jurisdiction.authorities].filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}
