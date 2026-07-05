import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getAttachmentForDownload } from "@/lib/reports/attachments";
import { readFile } from "@/lib/storage/local";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const attachment = await getAttachmentForDownload(id, {
    id: session.user.id,
    role: session.user.role,
    organizationId: session.user.organizationId,
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let data: Buffer;
  try {
    data = await readFile(attachment.storageKey);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const encodedName = encodeURIComponent(attachment.fileName);

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(data.byteLength),
      "Content-Disposition": `attachment; filename="${attachment.fileName.replace(/"/g, '\\"')}"; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, no-store",
    },
  });
}
