"use server";

import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { getSession } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { draftComplaintEmail, type ComplaintEmailInput } from "@/lib/departments";

type SendInput = ComplaintEmailInput & {
  /** Extra address the citizen typed in, added to CC. */
  extraCc?: string | null;
  /** Stored path of the uploaded photo, e.g. "/uploads/172…-road.webp". */
  photoPath?: string | null;
  /** Stored path of the uploaded voice note. */
  voicePath?: string | null;
};

export type SendResult =
  | { ok: true; mode: "smtp" | "dummy"; to: string; cc: string; previewUrl: string | null }
  | { ok: false; error: string };

/** Resolves a stored "/uploads/x" path to an absolute file on disk, if it exists. */
function resolveUpload(p?: string | null): { filename: string; path: string } | null {
  if (!p) return null;
  const rel = p.replace(/^\/+/, "");
  const abs = path.join(process.cwd(), "public", rel);
  if (!abs.startsWith(path.join(process.cwd(), "public"))) return null; // path-traversal guard
  if (!fs.existsSync(abs)) return null;
  return { filename: path.basename(abs), path: abs };
}

/**
 * Sends the drafted complaint email.
 *
 *  • SMTP_* env vars set  → real delivery through that server.
 *  • otherwise            → DUMMY mode: nodemailer opens a throwaway "Ethereal"
 *    inbox, the message is accepted but never delivered, and a preview URL is
 *    returned so you can read exactly what would have gone out (needs internet).
 *
 * The citizen's name / contact and the CC list are taken from the server
 * session — never trusted from the client.
 */
export async function sendComplaintEmail(input: SendInput): Promise<SendResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const citizen = await prisma.user.findUnique({
    where: { id: session.id },
    select: { name: true, email: true, mobileNumber: true },
  });

  const contactBits = [
    citizen?.mobileNumber ? `Mobile: ${citizen.mobileNumber}` : null,
    citizen?.email ? `Email: ${citizen.email}` : null,
  ].filter(Boolean);

  const photo = resolveUpload(input.photoPath);
  const voice = resolveUpload(input.voicePath);
  const attachments = [photo, voice].filter(Boolean) as { filename: string; path: string }[];

  const { to, cc, subject, text, html } = draftComplaintEmail({
    ...input,
    citizenName: citizen?.name ?? input.citizenName ?? null,
    citizenContact: contactBits.join("  •  ") || null,
    photoMode: photo ? "attached" : "link",
  });

  const ccAll = [
    ...cc.split(/\s*,\s*/),
    citizen?.email,
    input.extraCc?.trim(),
  ]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i && v !== to)
    .join(", ");

  try {
    let transporter: nodemailer.Transporter;
    let mode: "smtp" | "dummy";

    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      mode = "smtp";
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      mode = "dummy";
    }

    const info = await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        `${citizen?.name || "DRISHTI Reporter"} via DRISHTI <no-reply@drishti.local>`,
      replyTo: citizen?.email || undefined,
      to,
      cc: ccAll || undefined,
      subject,
      text,
      html,
      attachments,
    });

    return {
      ok: true,
      mode,
      to,
      cc: ccAll,
      previewUrl: nodemailer.getTestMessageUrl(info) || null,
    };
  } catch (e) {
    console.error("sendComplaintEmail failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send email" };
  }
}
