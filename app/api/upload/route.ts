import { auth } from '@clerk/nextjs/server';
import { handleUpload, HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try{
    const jsonResponse = await handleUpload({ 
      body, 
      request, 
      onBeforeGenerateToken: async () => {
        const { userId } = await auth();
        if (!userId) {
          throw new Error("Unauthorized: User not authenticated");
        }

        return {
          allowedContentTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
          addRandomSuffix: true,
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
          tokenPayload: JSON.stringify({ userId })
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("File upload to blob: ", blob.url);

        const payload = tokenPayload ? JSON.parse(tokenPayload) as { userId: string } : null;
        const userId = payload?.userId;

        if (!userId) {
          console.warn("No userId found in token payload");
          return;
        }

        console.log(`Upload completed for user ${userId}. Blob URL: ${blob.url}`);
      }
    })
    return NextResponse.json(jsonResponse);
  }
  catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}