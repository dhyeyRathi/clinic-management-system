"use client";

import { useState } from "react";
import {
  FlaskConical,
  Search,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Activity,
  AlertCircle,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { toggleLabTestTypeStatusAction } from "@/app/actions/labTests";

interface LabTest {
  id: string;
  name: string;
  description: string;
  price: number;
  status: "ACTIVE" | "INACTIVE";
  image_url: string | null;
}

interface LabManagerTestsClientProps {
  initialTests: LabTest[];
}

export default function LabManagerTestsClient({
  initialTests,
}: LabManagerTestsClientProps) {
  const [tests, setTests] = useState<LabTest[]>(initialTests);
  const [search, setSearch] = useState("");

  const filtered = tests.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  const handleToggleStatus = async (id: string, currentStatus: "ACTIVE" | "INACTIVE") => {
    const label = currentStatus === "ACTIVE" ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${label} this test?`)) return;

    const toastId = toast.loading("Updating status...");
    try {
      const res = await toggleLabTestTypeStatusAction(id, currentStatus);
      if (res.success) {
        const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        toast.success(`Lab test status updated to ${nextStatus}`, { id: toastId });
        setTests((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
        );
      } else {
        toast.error(res.error || "Failed to toggle status.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.", { id: toastId });
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />

      {/* Search Header */}
      <div className="flex justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search test names or descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
          <FlaskConical className="w-12 h-12 text-muted/40" />
          <p className="text-sm font-medium">No lab tests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              {/* Thumbnail / Header */}
              <div>
                {t.image_url ? (
                  <div className="w-full h-36 relative overflow-hidden bg-muted">
                    <img
                      src={t.image_url}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-36 bg-primary/10 flex items-center justify-center text-primary">
                    <FlaskConical className="w-10 h-10" />
                  </div>
                )}

                {/* Details */}
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-heading text-sm md:text-base leading-tight truncate">
                    {t.name}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">
                    {t.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 pb-5 pt-3 border-t border-border/40 flex justify-between items-center bg-hover/10">
                <div className="flex items-center text-xs font-bold text-heading gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>${t.price.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.status === "ACTIVE"
                      ? "bg-success/15 text-success border border-success/20"
                      : "bg-danger/15 text-danger border border-danger/20"
                  }`}>
                    {t.status}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(t.id, t.status)}
                    className="p-1 text-muted hover:text-heading active:scale-95 transition-all cursor-pointer"
                    title={t.status === "ACTIVE" ? "Deactivate Test" : "Activate Test"}
                  >
                    {t.status === "ACTIVE" ? (
                      <ToggleRight className="w-8 h-8 text-primary" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-muted" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
