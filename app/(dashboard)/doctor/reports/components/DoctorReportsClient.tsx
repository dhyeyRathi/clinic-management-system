"use client";

import { useState, useTransition, useRef } from "react";
import {
  FileText,
  Search,
  Plus,
  X,
  Calendar,
  ExternalLink,
  Loader2,
  FileUp,
  AlertCircle,
  FlaskConical,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { issueClinicalReportAction } from "@/app/actions/doctor";

interface Client {
  id: string;
  client_code: string;
  name: string;
  email: string;
}

interface LabTest {
  id: string;
  name: string;
  price: any;
}

interface Report {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  created_at: string;
  client_name: string;
  client_code: string;
}

interface DoctorReportsClientProps {
  clients: Client[];
  labTests: LabTest[];
  initialReports: Report[];
}

export default function DoctorReportsClient({
  clients,
  labTests,
  initialReports,
}: DoctorReportsClientProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedClient, setSelectedClient] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = reports.filter((rep) => {
    const q = search.toLowerCase();
    return (
      rep.title.toLowerCase().includes(q) ||
      rep.client_name.toLowerCase().includes(q) ||
      rep.client_code.toLowerCase().includes(q) ||
      (rep.description && rep.description.toLowerCase().includes(q))
    );
  });

  const handleLabToggle = (labId: string) => {
    setSelectedLabs((prev) =>
      prev.includes(labId) ? prev.filter((id) => id !== labId) : [...prev, labId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are supported.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be under 5MB.");
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !title || !description || !pdfFile) {
      toast.error("Please fill in all required fields and upload a PDF report.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("clientId", selectedClient);
      formData.append("title", title);

      // Append recommended lab tests names directly to the summary if selected
      let finalDescription = description;
      if (selectedLabs.length > 0) {
        const recommendedNames = labTests
          .filter((l) => selectedLabs.includes(l.id))
          .map((l) => `${l.name} ($${Number(l.price).toFixed(2)})`)
          .join(", ");
        finalDescription += `\n\n[RECOMMENDED LAB TESTS]: ${recommendedNames}`;
      }

      formData.append("description", finalDescription);
      formData.append("pdf", pdfFile);

      const res = await issueClinicalReportAction(formData);
      if (res.success) {
        toast.success("Clinical report issued successfully!");
        setIsModalOpen(false);
        // Reset form
        setSelectedClient("");
        setTitle("");
        setDescription("");
        setSelectedLabs([]);
        setPdfFile(null);
        // Reload to update list
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to issue report.");
      }
    });
  };

  return (
    <>
      <Toaster position="top-right" richColors />

      {/* Control Roster */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search reports by title or patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Issue Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Clinical Report</span>
        </button>
      </div>

      {/* Roster list */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
          <FileText className="w-12 h-12 text-muted/40" />
          <p className="text-sm font-medium">No clinical reports found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((rep) => (
            <div
              key={rep.id}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-heading text-sm md:text-base leading-tight">
                      {rep.title}
                    </h3>
                    <p className="text-[11px] text-muted font-medium mt-0.5">
                      Patient: <span className="text-heading">{rep.client_name} ({rep.client_code})</span>
                    </p>
                  </div>
                </div>

                {rep.description && (
                  <p className="text-xs text-body leading-relaxed whitespace-pre-wrap pl-1 border-l border-border/80 ml-1">
                    {rep.description}
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-xs text-muted pl-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Issued on: {new Date(rep.created_at).toLocaleDateString([], { dateStyle: "medium" })}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40">
                <a
                  href={rep.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2 bg-hover hover:bg-hover-dark text-heading text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Attached PDF File</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-card border border-border shadow-2xl rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold text-heading">Issue Clinical Report</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-hover text-muted hover:text-heading cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Select Client */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Select Patient *
                </label>
                <select
                  required
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">-- Choose Patient --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.client_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Report Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Consultation Summary, Routine Physical check"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Diagnostic clinical description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Clinical Summary & Diagnosis *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Record symptoms, diagnoses, prescriptions, and instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-none"
                />
              </div>

              {/* Recommend Lab Tests */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-1">
                  <FlaskConical className="w-3.5 h-3.5 text-primary" />
                  <span>Recommend Lab Tests (Optional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-border rounded-xl p-2.5 bg-input">
                  {labTests.map((lab) => {
                    const isChecked = selectedLabs.includes(lab.id);
                    return (
                      <div
                        key={lab.id}
                        onClick={() => handleLabToggle(lab.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? "border-primary bg-primary/5 text-primary font-semibold"
                            : "border-border hover:bg-hover text-muted"
                        }`}
                      >
                        <span className="truncate">{lab.name}</span>
                        <span>${Number(lab.price).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Attached PDF Report * (Max 5MB)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                >
                  <FileUp className="w-8 h-8 text-muted/80" />
                  {pdfFile ? (
                    <span className="text-xs font-semibold text-primary truncate max-w-[200px]">
                      {pdfFile.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Click to select PDF report file</span>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/pdf"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-border text-muted hover:bg-hover rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Issue Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
