import { NextResponse } from "next/server";
import { appendCompanyProfileSubmissionToGoogleSheet } from "@/app/lib/googleSheets";
import {
  sanitizeCompanyProfileSubmission,
  validateCompanyProfileSubmission,
  type CompanyProfileSubmissionInput,
} from "@/app/lib/companyProfileSubmission";
import { writeClient } from "@/sanity/lib/write-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<CompanyProfileSubmissionInput> & {
      submissionId?: string;
    };

    const input: CompanyProfileSubmissionInput = {
      name: payload.name ?? "",
      businessType: payload.businessType ?? "",
      phone: payload.phone ?? "",
      email: payload.email ?? "",
      instagramId: payload.instagramId ?? "",
      website: payload.website ?? "",
      message: payload.message ?? "",
    };

    const validationErrors = validateCompanyProfileSubmission(input);

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Please correct the form and try again.",
          errors: validationErrors,
        },
        { status: 400 },
      );
    }

    const sanitizedInput = sanitizeCompanyProfileSubmission(input);
    const submissionId = payload.submissionId?.trim() || crypto.randomUUID();
    const submittedAt = new Date().toISOString();
    const source = "hero-company-profile-modal";

    const document = {
      _id: `company-profile-submission-${submissionId}`,
      _type: "companyProfileSubmission",
      submissionId,
      name: sanitizedInput.name,
      businessType: sanitizedInput.businessType,
      phone: sanitizedInput.phone,
      email: sanitizedInput.email,
      submittedAt,
      source,
      ...(sanitizedInput.instagramId ? { instagramId: sanitizedInput.instagramId } : {}),
      ...(sanitizedInput.website ? { website: sanitizedInput.website } : {}),
      ...(sanitizedInput.message ? { message: sanitizedInput.message } : {}),
    };

    await writeClient.createIfNotExists(document);

    const googleSheetsResult = await appendCompanyProfileSubmissionToGoogleSheet({
      submissionId,
      submittedAt,
      source,
      name: sanitizedInput.name,
      businessType: sanitizedInput.businessType,
      phone: sanitizedInput.phone,
      email: sanitizedInput.email,
      instagramId: sanitizedInput.instagramId,
      website: sanitizedInput.website,
      message: sanitizedInput.message,
    });

    if (!googleSheetsResult.enabled) {
      console.warn(
        "Google Sheets sync is not enabled. Submission was saved to Sanity only. Configure GOOGLE_SHEETS_* environment variables to activate sheet syncing.",
      );
    }

    return NextResponse.json({
      ok: true,
      submissionId,
      googleSheetsEnabled: googleSheetsResult.enabled,
    });
  } catch (error) {
    console.error("Company profile submission failed", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Something went wrong while saving your details. Please try again.",
      },
      { status: 500 },
    );
  }
}
