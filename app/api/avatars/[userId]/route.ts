import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readFile } from "@/lib/storage/local";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { userId } = await context.params;

  const user = await db.user.findFirst({
    where: {
      id: userId,
      organizationId: session.user.organizationId,
      isActive: true,
    },
    select: {
      avatarKey: true,
      avatarMimeType: true,
    },
  });

  if (!user?.avatarKey) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await readFile(user.avatarKey);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": user.avatarMimeType || "image/webp",
        "Cache-Control": "private, max-age=86400, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
