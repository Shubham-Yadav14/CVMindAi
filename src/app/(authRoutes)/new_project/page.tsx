"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import useModeStore from "@/app/lib/useModeStore";
import { useSnackbar } from "@/app/components/ui/SnackbarProvider";
import Skeleton from "@/app/components/ui/Skeleton";
import Image from "next/image";

interface Template {
  id: string;
  name: string;
  description: string;
  image: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { lightMode } = useModeStore();
  const { showSnackbar } = useSnackbar();
  const [step, setStep] = useState<"name" | "template">("name");
  const [name, setName] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step !== "template") return;
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/templates");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load templates");
        setTemplates(data.templates);
      } catch (loadError) {
        showSnackbar(loadError instanceof Error ? loadError.message : "Unable to load templates", "error");
      } finally {
        setLoading(false);
      }
    };
    void loadTemplates();
  }, [showSnackbar, step]);

  const chooseName = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      showSnackbar("Give your project a name first.", "error");
      return;
    }
    setStep("template");
  };

  const createProject = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: name.trim(), templateId: selectedTemplate }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create project");
      showSnackbar("Project created successfully.", "success");
      router.push(`/projects/${data.project.id}`);
    } catch (createError) {
      showSnackbar(createError instanceof Error ? createError.message : "Unable to create project", "error");
      setLoading(false);
    }
  };

  const surface = lightMode ? "bg-white text-slate-900" : "bg-[#17232d] text-slate-100";
  const muted = lightMode ? "text-slate-600" : "text-slate-400";
  const input = lightMode ? "border-slate-300 bg-white" : "border-slate-600 bg-slate-800";
  const skeletonClass = lightMode ? "bg-slate-200" : "bg-slate-700";

  return (
    <main
      className={`app-surface h-screen w-full noSideBar ${lightMode ? "" : "bg-[#101820]"}`}
    >
      <section className={`mx-auto min-h-full w-full border-x p-6 sm:p-10 ${lightMode ? "border-slate-200/80" : "border-slate-700/80"} ${surface}`}>
        <div className=" flex justify-between">
          {step === "template" && <button
            type="button"
            onClick={() => (setStep("name"))}
            className={`mb-8 flex items-center gap-2 text-sm font-medium ${muted}`}
          >
            <ArrowLeft size={17} /> Back
          </button>}
          <div className="mb-10 mx-auto flex items-center gap-3">
            <span className="text-sm font-semibold text-indigo-500">01</span>
            <span className={`h-px w-12 ${step === "template" ? "bg-indigo-500" : lightMode ? "bg-slate-200" : "bg-slate-700"}`} />
            <span className={`text-sm font-semibold ${step === "template" ? "text-indigo-500" : muted}`}>02</span>
            <span className={`ml-1 text-xs uppercase tracking-[0.18em] ${muted}`}>{step === "name" ? "Project details" : "Choose a layout"}</span>
          </div>
          {step === "template" && <div></div>}
        </div>
        {step === "name" ? (
          <div className="mx-auto flex min-h-[55vh] max-w-2xl flex-col justify-center py-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <FileText size={24} />
            </div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-500">
              New project
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">What should we call it?</h1>
            <p className={`mt-4 max-w-lg text-base ${muted}`}>
              Choose a name you will recognize when you return to your resume.
            </p>
            <form onSubmit={chooseName} className="mt-8">
              <label htmlFor="project-name" className="mb-2 block text-sm font-medium">
                Project name
              </label>
              <input
                id="project-name"
                autoFocus
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Product Designer Resume"
                className={`h-12 w-full rounded-md border px-4 outline-none focus:border-indigo-500 ${input}`}
              />
              <button
                type="submit"
                className="mt-6 rounded-md bg-indigo-600 px-7 py-3 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                Choose a template
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="mb-10 max-w-3xl">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-500">
                Step 2 of 2
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Choose a template</h1>
              <p className={`mt-3 ${muted}`}>
                Start with a polished layout. You can edit the LaTeX after creating it.
              </p>
            </div>
            {loading && templates.length === 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className={`overflow-hidden rounded-lg border ${lightMode ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-800"}`}
                  >
                    <Skeleton className={`aspect-3/4 w-full rounded-none ${skeletonClass}`} />
                    <div className="space-y-3 p-4">
                      <Skeleton className={`h-5 w-2/3 ${skeletonClass}`} />
                      <Skeleton className={`h-4 w-full ${skeletonClass}`} />
                      <Skeleton className={`h-4 w-4/5 ${skeletonClass}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ">
                {templates.map((template) => (
                  <button
                    type="button"
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`group overflow-hidden rounded-lg border text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl ${selectedTemplate === template.id ? "border-indigo-500 ring-2 ring-indigo-500" : lightMode ? "border-slate-200 bg-white hover:border-indigo-300" : "border-slate-700 bg-slate-800 hover:border-indigo-500"}`}
                  >
                    <div className="relative aspect-3/4 overflow-hidden bg-slate-100">
                      <Image
                        src={template.image}
                        alt={`${template.name} template preview`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                      {selectedTemplate === template.id && (
                        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                          <Check size={18} />
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="font-semibold">{template.name}</h2>
                      <p className={`mt-1 text-sm ${muted}`}>{template.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                disabled={!selectedTemplate || loading}
                onClick={() => void createProject()}
                className="rounded-md  bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create project"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
