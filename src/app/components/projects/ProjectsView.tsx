"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderOpen,
  LoaderCircle,
  Search,
  Trash2,
} from "lucide-react";
import useModeStore from "@/app/lib/useModeStore";
import type { ProjectStatus } from "@/app/models/Project";
import { useRouter } from "next/navigation";
import { useSnackbar } from "@/app/components/ui/SnackbarProvider";
import Skeleton from "@/app/components/ui/Skeleton";

interface Project {
  id: string;
  title: string;
  owner: string;
  modified: string;
  modifiedBy: string;
}

interface ProjectsResponse {
  projects: Project[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

interface ProjectsViewProps {
  status: ProjectStatus;
  title: string;
}

function formatRelativeTime(date: string): string {
  let value = Math.round(
    (new Date(date).getTime() - Date.now()) / 1000
  );

  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
  ];

  for (const [threshold, unit] of units) {
    if (Math.abs(value) < threshold) {
      return new Intl.RelativeTimeFormat("en", {
        numeric: "auto",
      }).format(Math.round(value), unit);
    }

    value /= threshold;
  }

  return new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  }).format(Math.round(value), "year");
}

function ProjectListSkeleton({ lightMode }: { lightMode: boolean }) {
  const skeletonClass = lightMode ? "bg-slate-200" : "bg-slate-700";

  return (
    <div className="min-w-245">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="grid min-w-245 grid-cols-[1fr_10fr_3fr_8fr_4fr] items-center gap-4 border-b border-slate-200 px-4 py-4 last:border-b-0 dark:border-slate-700"
        >
          <Skeleton className={`h-4 w-4 ${skeletonClass}`} />
          <Skeleton className={`h-5 w-3/4 ${skeletonClass}`} />
          <Skeleton className={`h-5 w-2/3 ${skeletonClass}`} />
          <Skeleton className={`h-5 w-4/5 ${skeletonClass}`} />
          <div className="flex justify-end gap-3">
            <Skeleton className={`h-5 w-5 ${skeletonClass}`} />
            <Skeleton className={`h-5 w-5 ${skeletonClass}`} />
            <Skeleton className={`h-5 w-5 ${skeletonClass}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProjectsView({ status, title }: ProjectsViewProps) {
  const { lightMode } = useModeStore();
  const { showSnackbar } = useSnackbar();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [sortAscending, setSortAscending] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [bulkAction, setBulkAction] = useState<"active" | "archived" | "trashed" | "">("");
  const [downloadingProjectId, setDownloadingProjectId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);

    const router =useRouter();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchProjects() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          status,
          search: debouncedSearch,
          page: String(page),
          pageSize: String(pagination.pageSize),
          sort: sortAscending ? "asc" : "desc",
        });
        const response = await fetch(`/api/projects?${params}`, { signal: controller.signal });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Unable to load projects");
        }
        const data: ProjectsResponse = await response.json();
        setProjects(data.projects);
        setPagination(data.pagination);
        setSelectedProjects((current) =>
          current.filter((id) => data.projects.some((project) => project.id === id)),
        );
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        showSnackbar(fetchError instanceof Error ? fetchError.message : "Unable to load projects. Please try again.", "error");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void fetchProjects();
    return () => controller.abort();
  }, [debouncedSearch, page, pagination.pageSize, showSnackbar, sortAscending, status]);

  const allSelected =
    projects.length > 0 && projects.every((project) => selectedProjects.includes(project.id));
  const toggleProject = (id: string) =>
    setSelectedProjects((current) =>
      current.includes(id) ? current.filter((projectId) => projectId !== id) : [...current, id],
    );
  const toggleAll = () =>
    setSelectedProjects((current) =>
      allSelected
        ? current.filter((id) => !projects.some((project) => project.id === id))
        : [...new Set([...current, ...projects.map((project) => project.id)])],
    );
  const updateSelectedProjects = async (
    nextStatus: "active" | "archived" | "trashed",
    projectIds = selectedProjects,
  ) => {
    setBulkAction(nextStatus);
    try {
      const response = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: projectIds, status: nextStatus }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Unable to update selected projects");
      }
      setSelectedProjects([]);
      setPage(1);
      const refresh = new URLSearchParams({
        status,
        search: debouncedSearch,
        page: "1",
        pageSize: String(pagination.pageSize),
        sort: sortAscending ? "asc" : "desc",
      });
      const refreshedResponse = await fetch(`/api/projects?${refresh}`);
      if (!refreshedResponse.ok) {
        const data = await refreshedResponse.json();
        throw new Error(data.error ?? "Unable to refresh projects");
      }
      const data: ProjectsResponse = await refreshedResponse.json();
      setProjects(data.projects);
      setPagination(data.pagination);
      showSnackbar("Projects updated successfully.", "success");
    } catch (actionError) {
      showSnackbar(actionError instanceof Error ? actionError.message : "Unable to update selected projects", "error");
    } finally {
      setBulkAction("");
    }
  };
  const downloadProject = async (project: Project) => {
    if (downloadingProjectId) return;

    setDownloadingProjectId(project.id);
    try {
      const response = await fetch(`/api/projects/${project.id}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Unable to download project");
      }

      const downloadUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${project.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "resume"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      showSnackbar("Resume downloaded successfully.", "success");
    } catch (downloadError) {
      showSnackbar(downloadError instanceof Error ? downloadError.message : "Unable to download project", "error");
    } finally {
      setDownloadingProjectId(null);
    }
  };
  const permanentlyDeleteProject = async () => {
    if (!projectToDelete || deletingProject) return;

    setDeletingProject(true);
    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Unable to permanently delete project");
      }

      setProjects((current) => current.filter((project) => project.id !== projectToDelete.id));
      setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
      setSelectedProjects((current) => current.filter((id) => id !== projectToDelete.id));
      setProjectToDelete(null);
      showSnackbar("Project permanently deleted.", "success");
    } catch (deleteError) {
      showSnackbar(deleteError instanceof Error ? deleteError.message : "Unable to permanently delete project", "error");
    } finally {
      setDeletingProject(false);
    }
  };
  const textClass = lightMode ? "text-slate-900" : "text-slate-100";
  const mutedClass = lightMode ? "text-slate-600" : "text-slate-400";
  const panelClass = lightMode
    ? "border border-slate-200 bg-white"
    : "border border-slate-700 bg-slate-900";
  const rowBorderClass = lightMode ? "border-slate-200" : "border-slate-700";
  const gridClass =
    "grid min-w-245 grid-cols-[1fr_10fr_3fr_8fr_4fr] items-center";

  return (
    <main
      className={`app-surface min-h-full px-3 py-6 transition-colors duration-300 sm:px-8 sm:py-9`}
    >
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-teal-600">Workspace</p><h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${textClass}`}>{title}</h1></div>
        <span className={`text-sm ${mutedClass}`}>{pagination.total} {pagination.total === 1 ? "project" : "projects"}</span>
      </div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xl sm:flex-1">
          <Search size={19} className={`absolute left-3 top-1/2 -translate-y-1/2 ${mutedClass}`} />
          <input
            type="search"
            placeholder={`Search in ${title.toLowerCase()}...`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label={`Search ${title.toLowerCase()}`}
            className={`focus-ring h-11 w-full rounded-xl border pl-10 pr-4 text-sm outline-none transition-colors ${lightMode ? "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-500" : "border-slate-600 bg-[#17232d] text-white placeholder:text-slate-400 focus:border-teal-400"}`}
          />
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {selectedProjects.length > 1 && status === "active" && (
              <button type="button" onClick={() => void updateSelectedProjects("archived")} disabled={Boolean(bulkAction)} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:opacity-50 ${lightMode ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100" : "border-amber-700 bg-amber-950/40 text-amber-200 hover:border-amber-500 hover:bg-amber-900/60"}`}>
              <Archive size={16} /> {bulkAction === "archived" ? "Archiving..." : "Archive selected"}
            </button>
          )}
          {selectedProjects.length > 1 && status !== "trashed" && (
              <button type="button" onClick={() => void updateSelectedProjects("trashed")} disabled={Boolean(bulkAction)} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:opacity-50 ${lightMode ? "border-red-300 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100" : "border-red-800 bg-red-950/40 text-red-200 hover:border-red-500 hover:bg-red-900/60"}`}>
              <Trash2 size={16} /> {bulkAction === "trashed" ? "Moving..." : "Move selected to trash"}
            </button>
          )}
          {selectedProjects.length > 1 && status === "archived" && (
              <button type="button" onClick={() => void updateSelectedProjects("active")} disabled={Boolean(bulkAction)} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:opacity-50 ${lightMode ? "border-teal-300 bg-teal-50 text-teal-800 hover:border-teal-400 hover:bg-teal-100" : "border-teal-700 bg-teal-950/40 text-teal-200 hover:border-teal-500 hover:bg-teal-900/60"}`}>
                <FolderOpen size={16} /> {bulkAction === "active" ? "Restoring..." : "Restore selected"}
            </button>
          )}
          {selectedProjects.length > 1 && status === "trashed" && (
            <>
              <button type="button" onClick={() => void updateSelectedProjects("archived")} disabled={Boolean(bulkAction)} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:opacity-50 ${lightMode ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100" : "border-amber-700 bg-amber-950/40 text-amber-200 hover:border-amber-500 hover:bg-amber-900/60"}`}>
                <Archive size={16} /> {bulkAction === "archived" ? "Moving..." : "Move selected to archive"}
              </button>
              <button type="button" onClick={() => void updateSelectedProjects("active")} disabled={Boolean(bulkAction)} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:opacity-50 ${lightMode ? "border-teal-300 bg-teal-50 text-teal-800 hover:border-teal-400 hover:bg-teal-100" : "border-teal-700 bg-teal-950/40 text-teal-200 hover:border-teal-500 hover:bg-teal-900/60"}`}>
                <FolderOpen size={16} /> {bulkAction === "active" ? "Restoring..." : "Restore selected"}
              </button>
            </>
          )}
          {status === "active" && <button type="button" onClick={() => router.push("/new_project")} className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 sm:px-5">New project</button>}
        </div>
      </div>

      <div className={`w-full overflow-x-auto rounded-2xl shadow-sm ${panelClass}`}>
        <div className={`${gridClass} border-b px-4 py-4 ${rowBorderClass}`}>
          <button
            type="button"
            onClick={toggleAll}
            aria-label="Select all projects"
            className="flex h-4.5 w-4.5 items-center justify-center rounded border border-slate-400"
          >
            {allSelected && <div className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />}
          </button>
          <div className={`text-base font-semibold ${textClass}`}>Title</div>
          <div className={`text-base font-semibold ${textClass}`}>Owner</div>
          <button
            type="button"
            onClick={() => setSortAscending((current) => !current)}
            className={`flex items-center gap-2 text-left text-base font-semibold ${textClass}`}
          >
            Last modified{sortAscending ? <ArrowUp size={17} /> : <ArrowDown size={17} />}
          </button>
          <div className={`text-right text-base font-semibold ${textClass}`}>Actions</div>
        </div>
        {loading && (
          <ProjectListSkeleton lightMode={lightMode} />
        )}
        {!loading &&
          projects.map((project) => (
            <div
              key={project.id}

              onClick={()=>{router.push(`/projects/${project.id}`)}}
              className={`${gridClass} border-b px-4 py-3 transition last:border-b-0 ${rowBorderClass} ${lightMode ? "hover:bg-slate-50" : "hover:bg-slate-800"}`}
            >


              <button
                type="button"
                onClick={(e) => {e.stopPropagation(); toggleProject(project.id) }}
                aria-label={`Select ${project.title}`}
                className="flex h-4.5 w-4.5 items-center justify-center rounded border border-slate-400"
              >
                {selectedProjects.includes(project.id) && (
                  <div className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                )}
              </button>
              <div className={`truncate pr-4 text-base font-medium ${textClass}`}>
                {project.title}
              </div>
              <div className={`text-base ${mutedClass}`}>{project.owner}</div>
              <div className={`text-base ${mutedClass} `}>
                {formatRelativeTime(project.modified)}{" "}
                <span className={`${textClass} text-sm `}>by {project.modifiedBy}</span>
              </div>
              <div className={`flex items-center justify-end gap-3 ${mutedClass}`}>
                <button
                  type="button"
                  title="Download PDF"
                  aria-label={`Download ${project.title} as PDF`}
                  onClick={(event) => {
                    event.stopPropagation();
                    void downloadProject(project);
                  }}
                  disabled={Boolean(downloadingProjectId)}
                  className="transition hover:text-teal-600 disabled:opacity-50"
                >
                  {downloadingProjectId === project.id ? <LoaderCircle size={18} className="animate-spin" /> : <Download size={18} />}
                </button>
                {status === "active" && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void updateSelectedProjects("archived", [project.id]);
                    }}
                    title="Archive"
                    aria-label={`Archive ${project.title}`}
                  >
                    <Archive size={18} />
                  </button>
                )}
                {status === "archived" && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void updateSelectedProjects("active", [project.id]);
                    }}
                    title="Unarchive"
                    aria-label={`Unarchive ${project.title}`}
                    className="hover:text-indigo-500"
                  >
                    <FolderOpen size={18} />
                  </button>
                )}
                {status === "trashed" && (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void updateSelectedProjects("archived", [project.id]);
                      }}
                      title="Move to archive"
                      aria-label={`Move ${project.title} to archive`}
                      className="hover:text-amber-500"
                    >
                      <Archive size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void updateSelectedProjects("active", [project.id]);
                      }}
                      title="Restore to active projects"
                      aria-label={`Restore ${project.title} to active projects`}
                      className="hover:text-indigo-500"
                    >
                      <FolderOpen size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setProjectToDelete(project);
                      }}
                      title="Delete permanently"
                      aria-label={`Delete ${project.title} permanently`}
                      className="text-red-600 transition hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                {status !== "trashed" && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void updateSelectedProjects("trashed", [project.id]);
                    }}
                    title="Delete"
                    aria-label={`Delete ${project.title}`}
                    className="hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        {!loading && projects.length === 0 && (
          <div className={`min-w-245 px-4 py-10 text-center ${mutedClass}`}>
            No {title.toLowerCase()} found.
          </div>
        )}
      </div>

      {projectToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingProject) setProjectToDelete(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${panelClass}`}
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <Trash2 size={21} />
            </div>
            <h2 id="delete-project-title" className={`text-xl font-semibold ${textClass}`}>Delete project permanently?</h2>
            <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>
              “{projectToDelete.title}” and its saved LaTeX history will be permanently removed. This action cannot be undone.
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={deletingProject}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${lightMode ? "border-slate-300 hover:bg-slate-50" : "border-slate-600 hover:bg-slate-800"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void permanentlyDeleteProject()}
                disabled={deletingProject}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deletingProject && <LoaderCircle size={16} className="animate-spin" />}
                {deletingProject ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </section>
        </div>
      )}

      <div
        className={`mt-4 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row ${mutedClass}`}
      >
        <span>
          Showing {projects.length} of {pagination.total} projects.
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
            aria-label="Previous page"
            className={`rounded-md border p-2 disabled:cursor-not-allowed disabled:opacity-40 ${lightMode ? "border-slate-300 hover:bg-white" : "border-slate-600 hover:bg-slate-800"}`}
          >
            <ChevronLeft size={17} />
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
            disabled={page >= pagination.totalPages || loading}
            aria-label="Next page"
            className={`rounded-md border p-2 disabled:cursor-not-allowed disabled:opacity-40 ${lightMode ? "border-slate-300 hover:bg-white" : "border-slate-600 hover:bg-slate-800"}`}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </main>
  );
}
