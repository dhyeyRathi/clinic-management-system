"use client";

import { useState, useTransition } from "react";
import {
  createLabTestTypeAction,
  updateLabTestTypeAction,
  toggleLabTestTypeStatusAction,
} from "@/app/actions/labTests";
import {
  Search,
  Plus,
  X,
  FlaskConical,
  Edit2,
  Check,
  Ban,
  Loader2,
  DollarSign,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface LabTestsClientProps {
  initialTests: any[];
}

export default function LabTestsClient({ initialTests }: LabTestsClientProps) {
  const [tests, setTests] = useState(initialTests);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredTests = tests.filter((test) =>
    test.name.toLowerCase().includes(search.toLowerCase()) ||
    test.description?.toLowerCase()?.includes(search.toLowerCase())
  );

  async function handleToggleStatus(test: any) {
    toast.promise(
      (async () => {
        const res = await toggleLabTestTypeStatusAction(test.id, test.status);
        if (!res.success) throw new Error(res.error || "Failed to update");

        const newStatus = test.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        setTests((prev) =>
          prev.map((t) => (t.id === test.id ? { ...t, status: newStatus } : t))
        );
        return newStatus;
      })(),
      {
        loading: "Toggling status...",
        success: (status) => `Lab test status set to ${status}.`,
        error: (err) => err.message || "Failed to toggle status.",
      }
    );
  }

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createLabTestTypeAction(null, formData);
      if (result.success) {
        toast.success("Lab test added to catalog successfully!");
        setIsAddModalOpen(false);
        form.reset();
        window.location.reload();
      } else {
        setError(result.error || "Failed to create lab test.");
      }
    });
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await updateLabTestTypeAction(editingTest.id, formData);

      if (result.success) {
        toast.success("Lab test updated successfully!");
        setEditingTest(null);
        window.location.reload();
      } else {
        setError(result.error || "Failed to update lab test.");
      }
    });
  }

  return (
    <>
      

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by test name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-4 py-2 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lab Test</span>
        </button>
      </div>

      {/* Grid of Catalog Cards */}
      {filteredTests.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted">
          No lab tests found matching search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className={`bg-card border rounded-2xl p-6 flex flex-col gap-4 shadow-sm transition-all hover:shadow-md relative overflow-hidden ${
                test.status === "ACTIVE" ? "border-border" : "border-border opacity-70"
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  {test.image_url ? (
                    <img
                      src={test.image_url}
                      alt={test.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-heading text-base leading-snug">
                      {test.name}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      Created by {test.creator?.name || "System"}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-extrabold text-heading">
                  ${parseFloat(test.price).toFixed(2)}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-body line-clamp-3 leading-relaxed flex-1">
                {test.description || "No description provided for this diagnostic test."}
              </p>

              {/* Footer Panel */}
              <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-md text-xxs font-extrabold ${
                    test.status === "ACTIVE"
                      ? "bg-success/15 text-success"
                      : "bg-muted/20 text-muted"
                  }`}
                >
                  {test.status}
                </span>

                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  test.doctor_order_required
                    ? "bg-primary/10 text-primary"
                    : "bg-emerald-500/10 text-emerald-500"
                }`}>
                  {test.doctor_order_required ? "Order Required" : "Direct Booking"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTest(test)}
                    title="Edit Catalog Details"
                    className="p-2 rounded-lg border border-border hover:bg-hover hover:border-divider active:scale-95 transition-all text-muted hover:text-heading cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(test)}
                    title={test.status === "ACTIVE" ? "Deactivate Test" : "Activate Test"}
                    className={`p-2 rounded-lg border active:scale-95 transition-all cursor-pointer ${
                      test.status === "ACTIVE"
                        ? "border-danger/20 text-danger hover:bg-danger/5"
                        : "border-success/20 text-success hover:bg-success/5"
                    }`}
                  >
                    {test.status === "ACTIVE" ? (
                      <Ban className="w-3.5 h-3.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Test Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !isPending && setIsAddModalOpen(false)}
            className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
          ></div>

          <div className="bg-card border border-border w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-heading text-lg">Add Lab Test to Catalog</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                disabled={isPending}
                className="text-muted hover:text-heading cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} encType="multipart/form-data" className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-semibold flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Test Name
                </label>
                <div className="relative">
                  <FlaskConical className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    name="name"
                    required
                    disabled={isPending}
                    placeholder="Complete Blood Count (CBC)"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-muted" />
                  <textarea
                    name="description"
                    disabled={isPending}
                    rows={3}
                    placeholder="Measures red blood cells, white blood cells, platelets, and hemoglobin..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Price ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    required
                    disabled={isPending}
                    placeholder="45.00"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Thumbnail Image (Compulsory) */}
              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Thumbnail Image (Required)
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  required
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Status
                </label>
                <select
                  name="status"
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="ACTIVE">Active (Available)</option>
                  <option value="INACTIVE">Inactive (Hidden)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="add-doctorOrderRequired"
                  name="doctorOrderRequired"
                  value="true"
                  disabled={isPending}
                  className="w-4 h-4 text-primary bg-input border-input-border rounded focus:ring-primary cursor-pointer"
                />
                <label htmlFor="add-doctorOrderRequired" className="text-sm font-semibold text-heading cursor-pointer select-none">
                  Doctor order required to run
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-hover active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Add Test</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Test Modal */}
      {editingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !isPending && setEditingTest(null)}
            className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
          ></div>

          <div className="bg-card border border-border w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-heading text-lg">Edit Lab Test</h3>
              <button
                onClick={() => setEditingTest(null)}
                disabled={isPending}
                className="text-muted hover:text-heading cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} encType="multipart/form-data" className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-semibold flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Test Name
                </label>
                <div className="relative">
                  <FlaskConical className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingTest.name}
                    disabled={isPending}
                    placeholder="Complete Blood Count (CBC)"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-muted" />
                  <textarea
                    name="description"
                    defaultValue={editingTest.description}
                    disabled={isPending}
                    rows={3}
                    placeholder="Measures blood cells..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Price ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={editingTest.price}
                    disabled={isPending}
                    placeholder="45.00"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Thumbnail Image (Optional on Edit) */}
              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Thumbnail Image (Optional)
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={editingTest.status}
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="ACTIVE">Active (Available)</option>
                  <option value="INACTIVE">Inactive (Hidden)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="edit-doctorOrderRequired"
                  name="doctorOrderRequired"
                  value="true"
                  defaultChecked={editingTest.doctor_order_required}
                  disabled={isPending}
                  className="w-4 h-4 text-primary bg-input border-input-border rounded focus:ring-primary cursor-pointer"
                />
                <label htmlFor="edit-doctorOrderRequired" className="text-sm font-semibold text-heading cursor-pointer select-none">
                  Doctor order required to run
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingTest(null)}
                  disabled={isPending}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-hover active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save Changes</span>
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
