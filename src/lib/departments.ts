/**
 * Department / field-officer routing table + formal-complaint email drafting.
 *
 * This module is a plain, dependency-free helper: it is safe to import from
 * Client Components, Server Components and Server Actions.
 *
 * ⚠️  The email addresses below are PLACEHOLDERS. Replace them with the real
 * municipal addresses for your ward before going live — or move this table
 * into the database / an env file. You can also override the domain and the
 * city name without editing the table:
 *
 *   NEXT_PUBLIC_CITY_NAME="Pune Municipal Corporation"
 *   NEXT_PUBLIC_GOV_EMAIL_DOMAIN="pmc.gov.in"
 */

export const ISSUE_CATEGORIES = [
  "STREETLIGHT",
  "SOLAR_LIGHT",
  "WATER_SUPPLY",
  "HANDPUMP",
  "ROADS",
  "DRAINAGE",
  "GARBAGE",
  "PUBLIC_TOILET",
  "OPEN_GYM",
  "CCTV",
  "OTHER",
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export type DepartmentContact = {
  /** Short label shown in the form dropdown. */
  label: string;
  /** Full department name, written into the email. */
  department: string;
  /** Who the email is addressed to (designation is safer than a person's name). */
  officerName: string;
  /** Official email the complaint is sent TO. */
  email: string;
  /** Optional public helpline, shown to the citizen. */
  phone?: string;
};

const CITY = process.env.NEXT_PUBLIC_CITY_NAME || "Municipal Corporation";
const DOMAIN = process.env.NEXT_PUBLIC_GOV_EMAIL_DOMAIN || "city.gov.example";

export const DEPARTMENT_CONTACTS: Record<IssueCategory, DepartmentContact> = {
  STREETLIGHT: {
    label: "Streetlight not working",
    department: `${CITY} — Electrical / Street Lighting Department`,
    officerName: "The Junior Engineer, Street Lighting",
    email: `streetlight.cell@${DOMAIN}`,
    phone: "1800-000-101",
  },
  SOLAR_LIGHT: {
    label: "Solar light fault",
    department: `${CITY} — Renewable Energy Cell`,
    officerName: "The Junior Engineer, Solar Projects",
    email: `solar.cell@${DOMAIN}`,
  },
  WATER_SUPPLY: {
    label: "Water supply problem (pipeline, no water, leakage)",
    department: `${CITY} — Water Supply Department`,
    officerName: "The Assistant Engineer, Water Works",
    email: `water.works@${DOMAIN}`,
    phone: "1800-000-102",
  },
  HANDPUMP: {
    label: "Handpump broken or dry",
    department: `${CITY} — Water Supply Department (Handpump Wing)`,
    officerName: "The Junior Engineer, Handpump Maintenance",
    email: `handpump.wing@${DOMAIN}`,
  },
  ROADS: {
    label: "Road / footpath damage, potholes",
    department: `${CITY} — Public Works Department`,
    officerName: "The Executive Engineer, Roads",
    email: `roads.pwd@${DOMAIN}`,
    phone: "1800-000-103",
  },
  DRAINAGE: {
    label: "Drainage / sewage overflow or blockage",
    department: `${CITY} — Sewerage & Drainage Department`,
    officerName: "The Assistant Engineer, Drainage",
    email: `drainage.cell@${DOMAIN}`,
  },
  GARBAGE: {
    label: "Garbage not collected / illegal dumping",
    department: `${CITY} — Solid Waste Management Department`,
    officerName: "The Sanitary Inspector",
    email: `swm.ward@${DOMAIN}`,
  },
  PUBLIC_TOILET: {
    label: "Public toilet unusable",
    department: `${CITY} — Sanitation Department`,
    officerName: "The Sanitary Inspector",
    email: `sanitation.ward@${DOMAIN}`,
  },
  OPEN_GYM: {
    label: "Open-gym equipment damaged",
    department: `${CITY} — Parks & Gardens Department`,
    officerName: "The Garden Superintendent",
    email: `parks.dept@${DOMAIN}`,
  },
  CCTV: {
    label: "CCTV camera not working",
    department: `${CITY} — Smart City / City Surveillance Cell`,
    officerName: "The Nodal Officer, City Surveillance",
    email: `cctv.cell@${DOMAIN}`,
  },
  OTHER: {
    label: "Something else",
    department: `${CITY} — Central Public Grievance Cell`,
    officerName: "The Public Grievance Officer",
    email: `grievance@${DOMAIN}`,
    phone: "1800-000-100",
  },
};

/** Maps an asset category (from the Asset registry) onto an issue category. */
const ASSET_CATEGORY_TO_ISSUE: Record<string, IssueCategory> = {
  STREETLIGHT: "STREETLIGHT",
  SOLAR_LIGHT: "SOLAR_LIGHT",
  HANDPUMP: "HANDPUMP",
  OPEN_GYM: "OPEN_GYM",
  CCTV: "CCTV",
  PUBLIC_TOILET: "PUBLIC_TOILET",
};

export function normalizeCategory(category?: string | null): IssueCategory {
  if (!category) return "OTHER";
  const key = category.toUpperCase();
  if (key in DEPARTMENT_CONTACTS) return key as IssueCategory;
  if (key in ASSET_CATEGORY_TO_ISSUE) return ASSET_CATEGORY_TO_ISSUE[key];
  return "OTHER";
}

export function getDepartmentContact(category?: string | null): DepartmentContact {
  return DEPARTMENT_CONTACTS[normalizeCategory(category)];
}

/* ------------------------------------------------------------------ *
 * Formal email drafting
 * ------------------------------------------------------------------ */

export type EmailRecipient = { role: string; name?: string; email: string };

export type ComplaintEmailInput = {
  category?: string | null;
  address?: string | null;
  gpsLat?: number | null;
  gpsLon?: number | null;
  description?: string | null;
  severity?: string | null;
  /** Public URL to the uploaded photo. */
  photoUrl?: string | null;
  /** "attached" when the file rides along (server send); "link" for mailto. */
  photoMode?: "attached" | "link";
  referenceId?: string | number | null;
  /** Name of the person filing — goes above "Yours faithfully". */
  citizenName?: string | null;
  /** Mobile / email line printed under the signature. */
  citizenContact?: string | null;
  reportedAt?: Date | string | number | null;
  /** City / ward / village name, used in the opening sentence. */
  areaLabel?: string | null;
  /** Who the letter is addressed to. Defaults to the category's dept officer. */
  primaryRecipient?: EmailRecipient;
  /** Everyone marked for information / escalation. */
  ccRecipients?: EmailRecipient[];
  /** Which law / grievance system applies (from the jurisdiction). */
  policyNote?: string | null;
};

export type DraftedEmail = {
  to: string;
  cc: string;
  subject: string;
  /** Plain-text letter (used for the mailto: link and as the email fallback). */
  text: string;
  /** Formatted HTML letter (used by the server send). */
  html: string;
};

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Produces a clean, formal complaint email — greeting, reference & date,
 * a short opening, a labelled details list, a one-line note of who is copied,
 * the request paragraphs, and a signed sign-off with the citizen's name and
 * contact. Returns both a plain-text and an HTML version. Pure function.
 */
export function draftComplaintEmail(input: ComplaintEmailInput): DraftedEmail {
  const contact = getDepartmentContact(input.category);
  const issue = contact.label;
  const ref =
    input.referenceId != null ? `DRISHTI-${input.referenceId}` : "DRISHTI (pending sync)";

  const primary: EmailRecipient =
    input.primaryRecipient ?? { role: contact.officerName, email: contact.email };
  const seenCc = new Set<string>();
  const cc = (input.ccRecipients ?? []).filter((r) => {
    const email = r.email?.toLowerCase().trim();
    if (!email || email === primary.email?.toLowerCase().trim() || seenCc.has(email)) return false;
    seenCc.add(email);
    return true;
  });

  const when = new Date(input.reportedAt ?? Date.now()).toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const area = input.areaLabel?.trim() || input.address?.trim() || "";
  const photoValue = input.photoUrl
    ? input.photoMode === "attached"
      ? `Attached to this email (also at ${input.photoUrl})`
      : input.photoUrl
    : null;

  // Ordered detail rows: [label, value]
  const rows: Array<[string, string]> = [["Type of Issue", issue]];
  if (input.severity) rows.push(["Severity", titleCase(input.severity)]);
  if (input.address) rows.push(["Location / Landmark", input.address]);
  if (input.gpsLat != null && input.gpsLon != null) {
    rows.push(["GPS Coordinates", `${input.gpsLat.toFixed(6)}, ${input.gpsLon.toFixed(6)}`]);
    rows.push(["Map", `https://www.google.com/maps?q=${input.gpsLat},${input.gpsLon}`]);
  }
  rows.push(["Date & Time Noticed", when]);
  if (input.description) rows.push(["Description", input.description]);
  if (photoValue) rows.push(["Photograph", photoValue]);
  rows.push(["Reference Number", ref]);

  const senderName = input.citizenName?.trim() || "A concerned resident";
  const contactLines = (input.citizenContact || "")
    .split(/\s*[•·|]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  const subject = `Complaint regarding ${issue} at ${
    input.address || "the reported location"
  } [Ref: ${ref}]`;

  const ccSentence =
    cc.length > 0
      ? `A copy of this complaint has been marked to: ${cc
          .map((r) => (r.name ? `${r.role} (${r.name})` : r.role))
          .join("; ")}.`
      : "";

  const para1 = `I wish to formally lodge a complaint regarding a civic infrastructure issue${
    area ? ` in ${area}` : ""
  } and request that the necessary inspection and repair be carried out at the earliest.`;
  const para2 =
    "This issue may affect public safety in the area. I therefore request the concerned field staff to inspect the site and complete the required repair within the applicable service timeline.";
  const para3 =
    "As per the DRISHTI proof-of-repair process, kindly instruct the attending staff to upload a photograph taken at the site after completing the repair. This will allow the complaint to be verified and formally closed.";
  const para4 =
    "If this matter does not fall under your department's jurisdiction, kindly forward the complaint to the appropriate department and inform me accordingly.";
  const para5 =
    "I request an acknowledgement of this complaint and an update regarding its resolution within the applicable timeline.";
  const para6 = "Thank you for your attention and prompt action.";

  /* --------------------------- plain text --------------------------- */
  const T: string[] = [];
  T.push("Dear Sir/Madam,", "");
  T.push(`Reference: ${ref}`);
  T.push(`Date: ${when}`);
  T.push("");
  T.push(para1, "");
  T.push("Complaint Details:");
  rows.forEach(([k, v]) => T.push(`  - ${k}: ${v}`));
  T.push("");
  if (ccSentence) T.push(ccSentence, "");
  T.push(para2, "", para3, "", para4, "", para5, "", para6, "");
  T.push("Yours faithfully,", senderName);
  contactLines.forEach((l) => T.push(l));
  T.push("", "Filed through the DRISHTI Civic Reporting Platform.");
  if (input.policyNote) T.push("", `Note: ${input.policyNote}`);
  const text = T.join("\n");

  /* ----------------------------- html ------------------------------ */
  const e = escapeHtml;
  const li = rows
    .map(
      ([k, v]) =>
        `<li style="margin:0 0 4px"><strong>${e(k)}:</strong> ${
          k === "Map" || k === "Photograph"
            ? `<a href="${e(v.split(" ")[0])}" style="color:#0d5347">${e(v)}</a>`
            : e(v)
        }</li>`,
    )
    .join("");
  const ccHtml = ccSentence
    ? `<p style="margin:0 0 16px;color:#444">${e(ccSentence)}</p>`
    : "";
  const contactHtml = contactLines.length
    ? "<br>" + contactLines.map((l) => e(l)).join("<br>")
    : "";
  const policyHtml = input.policyNote
    ? `<p style="margin:20px 0 0;color:#888;font-size:12px;font-family:Arial,sans-serif"><em>${e(
        input.policyNote,
      )}</em></p>`
    : "";

  const html = `<!doctype html><html><body style="margin:0;background:#f4f2ec">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;background:#ffffff;padding:28px 32px">
  <p style="margin:0 0 6px;font-size:12px;letter-spacing:.08em;color:#6b7280">DRISHTI &middot; CIVIC REPORTING PLATFORM</p>
  <p style="margin:0 0 16px">Dear Sir/Madam,</p>
  <p style="margin:0 0 4px"><strong>Reference:</strong> ${e(ref)}</p>
  <p style="margin:0 0 16px"><strong>Date:</strong> ${e(when)}</p>
  <p style="margin:0 0 16px">${e(para1)}</p>
  <h3 style="margin:0 0 8px;font-size:15px;color:#111827">Complaint Details</h3>
  <ul style="margin:0 0 16px;padding-left:20px">${li}</ul>
  ${ccHtml}
  <p style="margin:0 0 14px">${e(para2)}</p>
  <p style="margin:0 0 14px">As per the <strong>DRISHTI proof-of-repair process</strong>, kindly instruct the attending staff to upload a photograph taken at the site after completing the repair. This will allow the complaint to be verified and formally closed.</p>
  <p style="margin:0 0 14px">${e(para4)}</p>
  <p style="margin:0 0 20px">${e(para5)}</p>
  <p style="margin:0 0 20px">${e(para6)}</p>
  <p style="margin:0">Yours faithfully,<br><strong>${e(senderName)}</strong>${contactHtml}</p>
  <p style="margin:16px 0 0;color:#6b7280;font-size:13px">Filed through the <strong>DRISHTI Civic Reporting Platform</strong>.</p>
  ${policyHtml}
</div></body></html>`;

  return {
    to: primary.email,
    cc: cc.map((r) => r.email).join(", "),
    subject,
    text,
    html,
  };
}

/** Builds an RFC-6068 `mailto:` link with cc, subject and body pre-filled. */
export function buildMailtoLink(opts: {
  to: string;
  cc?: string | null;
  subject: string;
  body: string;
}): string {
  const parts: string[] = [`subject=${encodeURIComponent(opts.subject)}`];
  const ccList = (opts.cc || "")
    .split(/\s*,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (ccList.length) parts.unshift(`cc=${encodeURIComponent(ccList.join(","))}`);
  // Normalise newlines to CRLF — Outlook and Apple Mail want it.
  parts.push(`body=${encodeURIComponent(opts.body.replace(/\r?\n/g, "\r\n"))}`);
  return `mailto:${opts.to}?${parts.join("&")}`;
}

/**
 * Builds a Gmail web-compose link — opens gmail.com's compose window in a
 * browser tab with everything pre-filled. Unlike `mailto:`, this needs no
 * OS-level mail app registered, so it's the reliable fallback on machines
 * (or dev/test setups) where clicking a `mailto:` link does nothing.
 */
export function buildGmailComposeLink(opts: {
  to: string;
  cc?: string | null;
  subject: string;
  body: string;
}): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: opts.to,
    su: opts.subject,
    body: opts.body,
  });
  if (opts.cc && opts.cc.trim()) params.set("cc", opts.cc.trim());
  return `https://mail.google.com/mail/?${params.toString()}`;
}
