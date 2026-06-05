// app/api/proxy-pdf/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get("url");

  if (!fileUrl) {
    return NextResponse.json({ error: "Missing source resource parameter tracking token" }, { status: 400 });
  }

  try {
    // Fetch the asset from Cloudinary cleanly inside server space
    const response = await fetch(fileUrl);
    
    if (!response.ok) throw new Error("Cloudinary bucket handshake rejected response context.");

    const arrayBuffer = await response.arrayBuffer();
    
    // Pass raw buffered streams directly back to client context headers
    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("PDF Proxy Stream Fault:", error.message);
    return NextResponse.json({ error: "Internal cross-origin pipe broken" }, { status: 500 });
  }
}