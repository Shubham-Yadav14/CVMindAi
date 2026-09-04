import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import connectDB from "@/app/lib/mongodb";
import Project from "@/app/models/Project";

const TEX_API_URL = "https://texapi.ovh/api/latex/compile";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const project = await Project.findOne({ _id: id, owner: user._id }).select("_id title").lean();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const body = await request.json();
    let latexCode = typeof body.latexCode === "string" ? body.latexCode : "";

    if (!latexCode.trim()) {
      const latestChat = await (await import("@/app/models/Chat")).default
        .findOne({ project: project._id })
        .sort({ createdAt: -1 })
        .select("latexCode")
        .lean();
      latexCode = latestChat?.latexCode ?? "";
    }

    if (!latexCode.trim()) {
      return NextResponse.json({ error: "Project has no LaTeX code to download" }, { status: 400 });
    }

    const apiKey = process.env.TEX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "TEX_API_KEY is not configured" }, { status: 503 });
    }

    const compileResponse = await fetch(TEX_API_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: latexCode }),
      cache: "no-store",
    });

    if (!compileResponse.ok) {
      const details = await compileResponse.text();
      console.error("TeX API compilation error:", details);
      return NextResponse.json(
        { error: "Unable to compile LaTeX. Check the source and try again." },
        { status: 503 },
      );
    }

    const pdf = await compileResponse.arrayBuffer();
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${project.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "resume"}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Project PDF error:", error);
    return NextResponse.json({ error: "Unable to reach the LaTeX compilation service." }, { status: 503 });
  }
}
