"use client";

import { useState, useTransition } from "react";
import { uploadLabReportAction } from "@/app/actions/labReports";
import {
  FileText,
  User,
  Upload,
  Loader2,
  CheckCircle,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string;
  clientCode: string;
  name: string;
  email: string;
}

interface TestType {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface LabReportsUploadClientProps {
  patients: Patient[];
  testTypes: TestType[];
}

export default function LabReportsUploadClient({ patients, testTypes }: LabReportsUploadClientProps) {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTestId, setSelectedTestId] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter patients based on search query
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTestTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const testId = e.target.value;
    setSelectedTestId(testId);
    
    const test = testTypes.find((t) => t.id === testId);
    if (test) {
      setDescription(test.description || `Diagnostic lab report for ${test.name}.`);
    } else {
      setDescription("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedPatientId) {
      toast.error("Please select a patient.");
      return;
    }

    if (!selectedTestId) {
      toast.error("Please select a report type.");
      return;
    }

    const test = testTypes.find((t) => t.id === selectedTestId);
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    formData.append("clientId", selectedPatientId);
    formData.append("title", test ? test.name : "Diagnostic Report");

    startTransition(async () => {
      const result = await uploadLabReportAction(null, formData);

      if (result.success) {
        toast.success("Lab report processed and published successfully!");
        form.reset();
        setSelectedPatientId("");
        setSelectedTestId("");
        setDescription("");
        setSearchQuery("");
        setSelectedFile(null);
      } else {
        toast.error(result.error || "Failed to publish lab report.");
      }
    });
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-heading flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Upload Lab Diagnostic Report
          </h1>
          <p className="text-muted text-sm mt-1">
            Issue and publish lab test results directly to the patient's portal.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Patient Selection Card */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-heading uppercase tracking-wider">
              1. Select Patient
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Field */}
              <div className="space-y-2">
                <span className="text-xs text-muted">Search Patient Directory</span>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Search by name, code or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isPending}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Select Dropdown */}
              <div className="space-y-2">
                <span className="text-xs text-muted">Select Target Patient</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  disabled={isPending}
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="">-- Choose Patient --</option>
                  {filteredPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.clientCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <hr className="border-border/60" />

          {/* Report Details */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-heading uppercase tracking-wider">
              2. Report Details
            </label>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">Select Report Type</label>
                <div className="relative">
                  <FlaskConical className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <select
                    value={selectedTestId}
                    onChange={handleTestTypeChange}
                    required
                    disabled={isPending}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="">-- Select Lab Test Type (Active/Inactive) --</option>
                    {testTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted mb-1.5">Description / Comments (Autofilled)</label>
                <textarea
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  rows={3}
                  placeholder="Autofilled when report type is selected. Feel free to customize..."
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <hr className="border-border/60" />

          {/* File Upload Component */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-heading uppercase tracking-wider">
              3. Diagnostic File Upload (Optional)
            </label>
            <div className="relative group border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 text-center bg-hover/20 hover:bg-hover/45 transition-all">
              <input
                type="file"
                name="file"
                accept="application/pdf,image/*"
                onChange={handleFileChange}
                disabled={isPending}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex flex-col items-center justify-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform ${selectedFile ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary group-hover:scale-110'}`}>
                  {selectedFile ? <CheckCircle className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                </div>
                <div>
                  {selectedFile ? (
                    <>
                      <p className="font-bold text-sm text-emerald-500">{selectedFile.name}</p>
                      <p className="text-xs text-muted mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p className="text-[11px] text-primary/80 mt-2 font-medium">Click or drag again to change file</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-sm text-heading">Click or drag report to upload</p>
                      <p className="text-xs text-muted mt-1">Accepts PDF files and images up to 5MB</p>
                      <p className="text-[11px] text-primary/80 mt-2 font-medium">Leave empty to auto-generate a mock lab report PDF for this patient.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-6 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing & Publishing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Publish Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
