import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import connectDB from "@/app/lib/mongodb";
import Chat from "@/app/models/Chat";
import Project from "@/app/models/Project";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const project = await Project.findOne({ _id: id, owner: user._id }).select("title").lean();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const chat = await Chat.findOne({ project: project._id }).sort({ createdAt: -1 }).select("latexCode").lean();
    if (!chat) return NextResponse.json({ error: "Project has no LaTeX snapshot" }, { status: 404 });
    return NextResponse.json({ project: { id: project._id.toString(), title: project.title, latexCode: chat.latexCode } });
  } catch {
    return NextResponse.json({ error: "Unable to load project" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (typeof body.latexCode !== "string") return NextResponse.json({ error: "LaTeX code is required" }, { status: 400 });
    await connectDB();
    const { id } = await params;
    const project = await Project.findOneAndUpdate({ _id: id, owner: user._id }, { modifiedBy: user.name }, { new: true }).select("title").lean();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const chat = await Chat.findOneAndUpdate(
      { project: project._id },
      { $set: { latexCode: body.latexCode } },
      { new: true, sort: { createdAt: -1 } },
    ).lean();
    if (!chat) return NextResponse.json({ error: "Project has no LaTeX snapshot" }, { status: 404 });
    return NextResponse.json({ project: { id: project._id.toString(), title: project.title, latexCode: chat.latexCode } });
  } catch {
    return NextResponse.json({ error: "Unable to save project" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const project = await Project.findOne({ _id: id, owner: user._id, status: "trashed" })
      .select("_id")
      .lean();

    if (!project) {
      return NextResponse.json(
        { error: "Only projects in the trash can be permanently deleted" },
        { status: 404 },
      );
    }

    await Chat.deleteMany({ project: project._id });
    await Project.deleteOne({ _id: project._id, owner: user._id, status: "trashed" });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Permanently delete project error:", error);
    return NextResponse.json({ error: "Unable to permanently delete project" }, { status: 500 });
  }
}
