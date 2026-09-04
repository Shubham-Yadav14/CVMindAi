import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import connectDB from "@/app/lib/mongodb";
import Chat from "@/app/models/Chat";
import Project, { ProjectStatus } from "@/app/models/Project";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const PROJECT_STATUSES: ProjectStatus[] = ["active", "archived", "trashed"];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() ?? "";
    const requestedStatus = searchParams.get("status") ?? "active";
    const status: ProjectStatus = PROJECT_STATUSES.includes(
      requestedStatus as ProjectStatus,
    )
      ? (requestedStatus as ProjectStatus)
      : "active";
    const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const requestedPageSize = Number.parseInt(
      searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE),
      10,
    );
    const sort = searchParams.get("sort") === "asc" ? 1 : -1;
    const page = Number.isFinite(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
    const pageSize = Number.isFinite(requestedPageSize) && requestedPageSize > 0
      ? Math.min(requestedPageSize, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

    await connectDB();

    const filter: Record<string, unknown> = { owner: user._id, status };
    if (search) {
      const searchExpression = new RegExp(escapeRegExp(search), "i");
      filter.$or = [{ title: searchExpression }];
    }

    const total = await Project.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const projects = await Project.find(filter)
      .sort({ updatedAt: sort })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .select("title modifiedBy status createdAt updatedAt")
      .lean();

    return NextResponse.json({
      projects: projects.map((project) => ({
        id: project._id.toString(),
        title: project.title,
        owner: "You",
        modified: project.updatedAt,
        modifiedBy: project.modifiedBy,
      })),
      pagination: {
        page: currentPage,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const templateId = typeof body.templateId === "string" ? body.templateId : "";

    if (!title || title.length > 100 || !templateId) {
      return NextResponse.json({ error: "A project name and template are required" }, { status: 400 });
    }

    await connectDB();
    const existingProject = await Project.findOne({ owner: user._id, title })
      .collation({ locale: "en", strength: 2 })
      .select("_id")
      .lean();
    if (existingProject) {
      return NextResponse.json(
        { error: "You already have a project with this name" },
        { status: 409 },
      );
    }

    const template = await (await import("@/app/models/Template")).default.findById(templateId).lean();
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    const project = await Project.create({
      title,
      templateId: template._id,
      owner: user._id,
      modifiedBy: user.name,
      status: "active",
    });
    await Chat.create({
      project: project._id,
      humanCommand: "Initial resume created from template",
      aiResponse: "",
      latexCode: template.latexCode,
    });

    return NextResponse.json({ project: { id: project._id.toString(), title: project.title } }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    if (error instanceof Error && "code" in error && error.code === 11000) {
      return NextResponse.json(
        { error: "You already have a project with this name" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const ids = Array.isArray(body.ids) && body.ids.every((id: unknown) => typeof id === "string")
      ? body.ids
      : [];
    const nextStatus = body.status;

    if (ids.length === 0 || !["active", "archived", "trashed"].includes(nextStatus)) {
      return NextResponse.json({ error: "Project ids and a valid status are required" }, { status: 400 });
    }

    await connectDB();
    const result = await Project.updateMany(
      { _id: { $in: ids }, owner: user._id },
      { $set: { status: nextStatus, modifiedBy: user.name } },
    );

    return NextResponse.json({ updated: result.modifiedCount });
  } catch (error) {
    console.error("Bulk update projects error:", error);
    return NextResponse.json({ error: "Unable to update projects" }, { status: 500 });
  }
}
