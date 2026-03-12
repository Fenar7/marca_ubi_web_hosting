import { NextResponse } from "next/server";
import {
  sanitizeCompanyProfileSubmission,
  validateCompanyProfileSubmission,
  type CompanyProfileSubmissionInput,
} from "@/app/lib/companyProfileSubmission";
import { writeClient } from "@/sanity/lib/write-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<CompanyProfileSubmissionInput>;

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

    await writeClient.create({
      _type: "companyProfileSubmission",
      ...sanitizedInput,
      submittedAt: new Date().toISOString(),
      source: "hero-company-profile-modal",
    });

    return NextResponse.json({ ok: true });
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
