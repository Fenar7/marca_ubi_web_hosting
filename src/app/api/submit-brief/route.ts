import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Write to Sanity using the client
    // Note: ensure the sanity client has a token configured in its setup if write access is restricted.
    // Assuming for now client can write or we can use a server-side client with token.
    // If client in sanity/lib/client is read-only, you'd need to create one with a token.
    // We will attempt to use the existing client.

    const newBrief = {
      _type: "projectBrief",
      ...body,
      submittedAt: new Date().toISOString(),
    };

    const response = await client.create(newBrief);

    return NextResponse.json({ success: true, id: response._id });
  } catch (error: any) {
    console.error("Error submitting project brief:", error);
    return NextResponse.json(
      { error: "Failed to submit project brief." },
      { status: 500 }
    );
  }
}
