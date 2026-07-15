"use client";

import { useState, useTransition } from "react";
import {
  Boxes,
  Search,
  MapPin,
  ShieldCheck,
  Calendar,
  Hash,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ClipboardList,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { requestResourceAction } from "@/app/actions/resources";

interface Resource {
  id: string;
  name: string;
  resource_code: string;
  category: string;
  location: string;
  quantity: number;
  available_quantity: number;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  manufacturer: string;
  serial_number: string;
  warranty_until: string | null;
  image_url: string | null;
}

interface ResourceRequest {
  id: string;
  quantity: number;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resource: {
    name: string;
    resource_code: string;
  };
}

interface StaffResourcesClientProps {
  resources: Resource[];
  requests: ResourceRequest[];
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-success/15 text-success border border-success/20",
  INACTIVE: "bg-danger/15 text-danger border border-danger/20",
  MAINTENANCE: "bg-warning/15 text-warning border border-warning/20 animate-pulse",
};

export default function StaffResourcesClient({
  resources,
  requests: initialRequests,
}: StaffResourcesClientProps) {
  const [requests, setRequests] = useState<ResourceRequest[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<"inventory" | "requests">("inventory");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Booking / Request Modal states
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [reqQty, setReqQty] = useState("1");
  const [reqReason, setReqReason] = useState("");

  const filtered = resources.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.resource_code.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q)
    );
  });

  const handleOpenRequestModal = (res: Resource) => {
    setSelectedResource(res);
    setReqQty("1");
    setReqReason("");
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    const qty = parseInt(reqQty);
    if (!qty || qty <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }

    if (qty > selectedResource.available_quantity) {
      toast.error(`Cannot request more than available stock (${selectedResource.available_quantity}).`);
      return;
    }

    startTransition(async () => {
      const res = await requestResourceAction(selectedResource.id, qty, reqReason);
      if (res.success) {
        toast.success("Resource request submitted successfully!");
        setSelectedResource(null);
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to submit request.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <Toaster position="top-right" richColors />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-px mb-4">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "inventory"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-heading"
          }`}
        >
          Browse Inventory
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer relative flex items-center gap-1.5 ${
            activeTab === "requests"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-heading"
          }`}
        >
          <span>My Requests</span>
          {requests.filter((r) => r.status === "PENDING").length > 0 && (
            <span className="px-1.5 py-0.5 bg-primary text-white dark:text-background text-[10px] font-extrabold rounded-full">
              {requests.filter((r) => r.status === "PENDING").length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "inventory" ? (
        <>
          {/* Search Header */}
          <div className="flex justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search equipment or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
              <Boxes className="w-12 h-12 text-muted/40" />
              <p className="text-sm font-medium">No assets cataloged.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  {/* Asset Header */}
                  <div>
                    {r.image_url ? (
                      <div className="w-full h-36 relative overflow-hidden bg-muted border-b border-border/60">
                        <img
                          src={r.image_url}
                          alt={r.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-36 bg-violet-500/5 flex items-center justify-center text-violet-500 border-b border-border/60">
                        <Boxes className="w-10 h-10" />
                      </div>
                    )}

                    {/* Info details */}
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="font-bold text-heading text-sm md:text-base leading-tight truncate max-w-[150px]">
                            {r.name}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-violet-500/10 text-violet-500 border border-violet-500/20 rounded-full text-[9px] font-bold mt-1.5">
                            Code: {r.resource_code}
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[r.status]}`}>
                          {r.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted pt-2 border-t border-border/40">
                        <p className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted/80 shrink-0" />
                          <span>Location: <strong className="text-heading font-medium">{r.location}</strong></span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5 text-muted/80 shrink-0" />
                          <span>Available: <strong className="text-heading font-medium">{r.available_quantity} / {r.quantity}</strong></span>
                        </p>
                        {r.manufacturer && (
                          <p className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-muted/80 shrink-0" />
                            <span>Mfr: <strong className="text-heading font-medium">{r.manufacturer}</strong></span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-5 pt-3 border-t border-border/45 flex justify-end bg-hover/10">
                    <button
                      onClick={() => handleOpenRequestModal(r)}
                      disabled={r.status !== "ACTIVE" || r.available_quantity <= 0}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white dark:text-background rounded-lg text-xs font-bold transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                    >
                      Request Asset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Requests History List */
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
              <ClipboardList className="w-12 h-12 text-muted/40" />
              <p className="text-sm font-medium">You haven't requested any resources yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-hover border-b border-border text-muted font-bold uppercase tracking-wider">
                    <th className="py-3 px-5">Resource</th>
                    <th className="py-3 px-5 text-center">Qty</th>
                    <th className="py-3 px-5">Reason</th>
                    <th className="py-3 px-5">Requested At</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Feedback / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {requests.map((req) => (
                    <tr key={req.id} className="text-heading font-medium hover:bg-hover/10 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-bold text-heading">{req.resource.name}</p>
                        <span className="text-[10px] text-muted font-mono">{req.resource.resource_code}</span>
                      </td>
                      <td className="py-4 px-5 text-center font-bold">{req.quantity}</td>
                      <td className="py-4 px-5 max-w-xs truncate" title={req.reason}>
                        {req.reason || "N/A"}
                      </td>
                      <td className="py-4 px-5 text-muted font-normal">
                        {new Date(req.created_at).toLocaleDateString([], {
                          dateStyle: "medium",
                        })}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            req.status === "APPROVED"
                              ? "bg-success/10 text-success border-success/20"
                              : req.status === "REJECTED"
                              ? "bg-danger/10 text-danger border-danger/20"
                              : "bg-warning/10 text-warning border-warning/20"
                          }`}
                        >
                          {req.status === "APPROVED" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : req.status === "REJECTED" ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                          )}
                          <span>{req.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-5 text-muted font-medium">
                        {req.admin_notes || <span className="italic text-muted/65">Pending review</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Request Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !isPending && setSelectedResource(null)}
            className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
          ></div>

          <div
            className="bg-card border border-border w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-heading text-lg">Request Asset Allocation</h3>
              <button
                onClick={() => setSelectedResource(null)}
                disabled={isPending}
                className="text-muted hover:text-heading cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1">
                  Asset Details
                </label>
                <p className="text-sm font-bold text-heading">
                  {selectedResource.name} ({selectedResource.resource_code})
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Available Quantity: {selectedResource.available_quantity}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Request Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedResource.available_quantity}
                  value={reqQty}
                  onChange={(e) => setReqQty(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Reason for Request *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide details on why this room or equipment is needed..."
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedResource(null)}
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
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
