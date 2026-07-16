"use client";

import { useState, useTransition } from "react";
import {
  createResourceAction,
  updateResourceAction,
  toggleResourceStatusAction,
  deleteResourceAction,
  updateResourceRequestStatusAction,
} from "@/app/actions/resources";
import { uploadFileAction } from "@/app/actions/upload";
import {
  Search,
  Filter,
  Plus,
  X,
  Boxes,
  Edit2,
  Trash2,
  Loader2,
  Hotel,
  SlidersHorizontal,
  Upload,
  Calendar,
  DollarSign,
  Tag,
  Hash,
  MapPin,
  Check,
  Ban,
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ResourcesClientProps {
  initialResources: any[];
  initialRequests?: any[];
}

export default function ResourcesClient({
  initialResources,
  initialRequests = [],
}: ResourcesClientProps) {
  const [resources, setResources] = useState(initialResources);
  const [requests, setRequests] = useState(initialRequests);
  const [activeTab, setActiveTab] = useState<"inventory" | "requests" | "allocations">("inventory");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Status dropdown toggle
  const [activeStatusSelect, setActiveStatusSelect] = useState<string | null>(null);

  // Request processing states
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequestAction, setSelectedRequestAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(search.toLowerCase()) ||
      res.resource_code.toLowerCase().includes(search.toLowerCase()) ||
      (res.location && res.location.toLowerCase().includes(search.toLowerCase())) ||
      (res.manufacturer && res.manufacturer.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === "ALL" || res.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenProcessModal = (id: string, action: "APPROVED" | "REJECTED") => {
    setSelectedRequestId(id);
    setSelectedRequestAction(action);
    setAdminNotes("");
    setIsNotesModalOpen(true);
  };

  const handleProcessRequest = () => {
    if (!selectedRequestId || !selectedRequestAction) return;

    startTransition(async () => {
      const res = await updateResourceRequestStatusAction(
        selectedRequestId,
        selectedRequestAction,
        adminNotes
      );

      if (res.success) {
        toast.success(`Request successfully ${selectedRequestAction.toLowerCase()}!`);
        setIsNotesModalOpen(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to process request.");
      }
    });
  };

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Upload to target folder images/resources
      const res = await uploadFileAction(formData, "resource_photos");
      if (res.success && res.url) {
        setImageUrl(res.url);
        toast.success("Image uploaded to Cloudinary!");
      } else {
        toast.error(res.error || "Failed to upload image.");
      }
    } catch (err) {
      toast.error("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(resourceId: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    toast.promise(
      (async () => {
        const res = await deleteResourceAction(resourceId);
        if (!res.success) throw new Error(res.error || "Failed to delete resource");
        setResources((prev) => prev.filter((r) => r.id !== resourceId));
        return name;
      })(),
      {
        loading: "Deleting resource...",
        success: (n) => `Deleted ${n} from inventory.`,
        error: (err) => err.message || "Failed to delete resource.",
      }
    );
  }

  async function handleStatusChange(resourceId: string, newStatus: any) {
    setActiveStatusSelect(null);
    toast.promise(
      (async () => {
        const res = await toggleResourceStatusAction(resourceId, newStatus);
        if (!res.success) throw new Error(res.error || "Failed to update status");

        setResources((prev) =>
          prev.map((r) => (r.id === resourceId ? { ...r, status: newStatus } : r))
        );
        return newStatus;
      })(),
      {
        loading: "Updating status...",
        success: (status) => `Resource status set to ${status}.`,
        error: (err) => err.message || "Failed to update status.",
      }
    );
  }

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (imageUrl) formData.append("image_url", imageUrl);

    startTransition(async () => {
      const result = await createResourceAction(null, formData);
      if (result.success) {
        toast.success("Resource added successfully!");
        setIsAddModalOpen(false);
        setImageUrl(null);
        form.reset();
        window.location.reload();
      } else {
        setError(result.error || "Failed to create resource.");
      }
    });
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const category = formData.get("category") as "EQUIPMENT" | "ROOM" | "OTHER";
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const quantityStr = formData.get("quantity") as string;
    const availableQtyStr = formData.get("available_quantity") as string;
    const status = formData.get("status") as "ACTIVE" | "MAINTENANCE" | "RETIRED";
    const purchaseDate = formData.get("purchase_date") as string;
    const purchaseCostStr = formData.get("purchase_cost") as string;
    const manufacturer = formData.get("manufacturer") as string;
    const serialNumber = formData.get("serial_number") as string;
    const warrantyUntil = formData.get("warranty_until") as string;

    if (!name || !category) {
      setError("Name and Category are required.");
      return;
    }

    startTransition(async () => {
      const result = await updateResourceAction(editingResource.id, {
        name,
        category,
        description,
        location,
        quantity: quantityStr ? parseInt(quantityStr) : 1,
        available_quantity: availableQtyStr ? parseInt(availableQtyStr) : 1,
        status,
        purchase_date: purchaseDate || null,
        purchase_cost: purchaseCostStr ? parseFloat(purchaseCostStr) : null,
        manufacturer,
        serial_number: serialNumber,
        warranty_until: warrantyUntil || null,
        image_url: imageUrl || editingResource.image_url,
      });

      if (result.success) {
        toast.success("Resource updated successfully!");
        setEditingResource(null);
        setImageUrl(null);
        window.location.reload();
      } else {
        setError(result.error || "Failed to update resource.");
      }
    });
  }

  const categoryIcons: Record<string, any> = {
    ROOM: Hotel,
    EQUIPMENT: Boxes,
    OTHER: SlidersHorizontal,
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-success/15 text-success",
    MAINTENANCE: "bg-warning/15 text-warning",
    RETIRED: "bg-danger/15 text-danger",
  };

  return (
    <>
      

      {/* Tabs Selection Bar */}
      <div className="flex gap-2 border-b border-border pb-px mb-6">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "inventory"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-heading"
          }`}
        >
          Inventory List
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer relative flex items-center gap-1.5 ${
            activeTab === "requests"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-heading"
          }`}
        >
          <span>Request Queue</span>
          {requests.filter((r) => r.status === "PENDING").length > 0 && (
            <span className="px-1.5 py-0.5 bg-danger text-white dark:text-background text-[10px] font-extrabold rounded-full">
              {requests.filter((r) => r.status === "PENDING").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("allocations")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer relative flex items-center gap-1.5 ${
            activeTab === "allocations"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-heading"
          }`}
        >
          <span>Active Allocations</span>
          {requests.filter((r) => r.status === "APPROVED").length > 0 && (
            <span className="px-1.5 py-0.5 bg-success text-white dark:text-background text-[10px] font-extrabold rounded-full">
              {requests.filter((r) => r.status === "APPROVED").length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "inventory" ? (
        <>
          {/* Control Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm mb-6">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search by code, name, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Filters & Add Button */}
            <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted bg-input border border-input-border rounded-xl px-3 py-2">
                <Filter className="w-3.5 h-3.5" />
                <span>Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-heading font-bold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="ROOM">Room / Ward</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setImageUrl(null);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-4 py-2 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-all cursor-pointer w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Add Resource</span>
              </button>
            </div>
          </div>

          {/* Grid of Resource Cards */}
          {filteredResources.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted">
              No resources registered in the clinic inventory.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredResources.map((res) => {
                const Icon = categoryIcons[res.category] || Boxes;
                return (
                  <div
                    key={res.id}
                    className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    {/* Resource Image Header */}
                    {res.image_url ? (
                      <div className="h-40 w-full relative bg-muted border-b border-border">
                        <img
                          src={res.image_url}
                          alt={res.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 text-xxs font-extrabold bg-card/85 backdrop-blur border border-border px-2 py-0.5 rounded text-heading">
                          {res.resource_code}
                        </span>
                      </div>
                    ) : (
                      <div className="h-28 w-full bg-hover/40 flex items-center justify-center border-b border-border relative">
                        <Icon className="w-8 h-8 text-muted" />
                        <span className="absolute top-3 left-3 text-xxs font-extrabold bg-card border border-border px-2 py-0.5 rounded text-heading">
                          {res.resource_code}
                        </span>
                      </div>
                    )}

                    {/* Details */}
                    <div className="p-6 flex flex-col gap-4 flex-1">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-heading text-base leading-snug">
                            {res.name}
                          </h3>
                          <span className="text-xxs font-extrabold bg-muted/15 text-muted px-2 py-0.5 rounded border border-border uppercase shrink-0">
                            {res.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{res.location || "Central Storage"}</span>
                        </div>
                      </div>

                      {res.description && (
                        <p className="text-xs text-body line-clamp-2 leading-relaxed">
                          {res.description}
                        </p>
                      )}

                      {/* Quantity Indicator */}
                      <div className="bg-hover/30 border border-border rounded-xl p-3 grid grid-cols-2 gap-2 text-center text-xs">
                        <div>
                          <p className="text-muted text-xxs font-bold uppercase tracking-wider">Available</p>
                          <p className="font-black text-heading text-sm mt-0.5">{res.available_quantity}</p>
                        </div>
                        <div className="border-l border-border">
                          <p className="text-muted text-xxs font-bold uppercase tracking-wider">Total Owned</p>
                          <p className="font-black text-heading text-sm mt-0.5">{res.quantity}</p>
                        </div>
                      </div>

                      {/* Extra specs */}
                      <div className="text-xxs text-body space-y-1 bg-input/40 p-2.5 rounded-lg">
                        {res.manufacturer && (
                          <p>
                            Manufacturer: <strong className="text-heading">{res.manufacturer}</strong>
                          </p>
                        )}
                        {res.serial_number && (
                          <p>
                            Serial No: <strong className="text-heading">{res.serial_number}</strong>
                          </p>
                        )}
                        {res.purchase_cost && (
                          <p>
                            Purchase Cost:{" "}
                            <strong className="text-heading">
                              ${parseFloat(res.purchase_cost).toFixed(2)}
                            </strong>
                          </p>
                        )}
                      </div>

                      {/* Footer status / actions */}
                      <div className="flex items-center justify-between border-t border-border pt-4 mt-auto relative">
                        <button
                          onClick={() =>
                            setActiveStatusSelect(
                              activeStatusSelect === res.id ? null : res.id
                            )
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition-all ${
                            statusColors[res.status]
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>{res.status}</span>
                        </button>

                        {/* Status Dropdown */}
                        {activeStatusSelect === res.id && (
                          <div className="absolute left-0 bottom-10 z-20 w-36 bg-card border border-border shadow-xl rounded-xl p-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                            {[
                              { val: "ACTIVE", icon: Check },
                              { val: "MAINTENANCE", icon: Wrench },
                              { val: "RETIRED", icon: Ban },
                            ].map((st) => (
                              <button
                                key={st.val}
                                onClick={() => handleStatusChange(res.id, st.val)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-hover transition-colors flex items-center gap-2 cursor-pointer ${
                                  res.status === st.val ? "text-primary" : "text-body"
                                }`}
                              >
                                <st.icon className="w-3.5 h-3.5 text-muted shrink-0" />
                                {st.val}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setImageUrl(res.image_url);
                              setEditingResource(res);
                            }}
                            className="flex items-center gap-1 text-xs text-muted hover:text-heading px-2.5 py-1.5 border border-border rounded-lg hover:border-divider active:scale-95 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDelete(res.id, res.name)}
                            className="flex items-center gap-1 text-xs text-danger hover:bg-danger/10 px-2.5 py-1.5 border border-danger/20 rounded-lg active:scale-95 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : activeTab === "requests" ? (
        /* Requests queue list */
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
              <ClipboardList className="w-12 h-12 text-muted/40" />
              <p className="text-sm font-medium">No resource requests logged yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-hover border-b border-border text-muted font-bold uppercase tracking-wider">
                    <th className="py-3 px-5">Resource</th>
                    <th className="py-3 px-5">Requester</th>
                    <th className="py-3 px-5 text-center">Qty</th>
                    <th className="py-3 px-5">Reason</th>
                    <th className="py-3 px-5">Requested At</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {requests.map((req) => {
                    const reqRole = req.requester.role.replace("_", " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
                    return (
                      <tr key={req.id} className="text-heading font-medium hover:bg-hover/10 transition-colors">
                        <td className="py-4 px-5">
                          <p className="font-bold text-heading">{req.resource.name}</p>
                          <span className="text-[10px] text-muted font-mono">{req.resource.resource_code}</span>
                        </td>
                        <td className="py-4 px-5">
                          <p className="font-semibold">{req.requester.name}</p>
                          <span className="text-[10px] text-primary font-bold">{reqRole}</span>
                        </td>
                        <td className="py-4 px-5 text-center font-bold">{req.quantity}</td>
                        <td className="py-4 px-5 max-w-xs truncate" title={req.reason}>
                          {req.reason || "N/A"}
                        </td>
                        <td className="py-4 px-5 text-muted">
                          {new Date(req.created_at).toLocaleDateString('en-US', {
                            dateStyle: "medium",
                          })}
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              req.status === "APPROVED"
                                ? "bg-success/10 text-success border-success/20"
                                : req.status === "REJECTED"
                                ? "bg-danger/10 text-danger border-danger/20"
                                : "bg-warning/10 text-warning border-warning/20"
                            }`}
                          >
                            <span>{req.status}</span>
                          </span>
                          {req.admin_notes && (
                            <p className="text-[10px] text-muted mt-1">
                              Note: <span className="font-semibold text-heading">{req.admin_notes}</span>
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right">
                          {req.status === "PENDING" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenProcessModal(req.id, "APPROVED")}
                                className="px-2 py-1 bg-success/10 hover:bg-success/15 text-success rounded text-[10px] font-bold active:scale-95 transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenProcessModal(req.id, "REJECTED")}
                                className="px-2 py-1 bg-danger/10 hover:bg-danger/15 text-danger rounded text-[10px] font-bold active:scale-95 transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted font-semibold uppercase">Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Active Allocations List */
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          {requests.filter((r) => r.status === "APPROVED").length === 0 ? (
            <div className="p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
              <ClipboardList className="w-12 h-12 text-muted/40" />
              <p className="text-sm font-medium">No active allocations found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-hover border-b border-border text-muted font-bold uppercase tracking-wider">
                    <th className="py-3 px-5">Resource (Asset)</th>
                    <th className="py-3 px-5">Allocated To</th>
                    <th className="py-3 px-5 text-center">Allocated Qty</th>
                    <th className="py-3 px-5">Allocation Purpose</th>
                    <th className="py-3 px-5">Allocation Date</th>
                    <th className="py-3 px-5">Admin Notes</th>
                    <th className="py-3 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {requests
                    .filter((r) => r.status === "APPROVED")
                    .map((req) => {
                      const reqRole = req.requester.role.replace("_", " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
                      return (
                        <tr key={req.id} className="text-heading font-medium hover:bg-hover/10 transition-colors">
                          <td className="py-4 px-5">
                            <p className="font-bold text-heading">{req.resource.name}</p>
                            <span className="text-[10px] text-muted font-mono">{req.resource.resource_code}</span>
                          </td>
                          <td className="py-4 px-5">
                            <p className="font-semibold">{req.requester.name}</p>
                            <span className="text-[10px] text-primary font-bold">{reqRole}</span>
                          </td>
                          <td className="py-4 px-5 text-center font-bold text-success">{req.quantity}</td>
                          <td className="py-4 px-5 max-w-xs truncate" title={req.reason}>
                            {req.reason || "N/A"}
                          </td>
                          <td className="py-4 px-5 text-muted">
                            {new Date(req.created_at).toLocaleDateString('en-US', {
                              dateStyle: "medium",
                            })}
                          </td>
                          <td className="py-4 px-5 text-muted">
                            {req.admin_notes || "N/A"}
                          </td>
                          <td className="py-4 px-5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-success/10 text-success border-success/20">
                              <span>ACTIVE</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Resource Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !isPending && setIsAddModalOpen(false)}
            className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
          ></div>

          <div className="bg-card border border-border w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-heading text-lg">Add New Resource</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                disabled={isPending}
                className="text-muted hover:text-heading cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-semibold flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Resource Photo
                </label>
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden relative border border-border">
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="absolute top-1 right-1 bg-card border border-border p-0.5 rounded-full hover:bg-hover cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 text-muted" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-xl border border-dashed border-input-border flex flex-col items-center justify-center text-muted hover:text-heading hover:bg-hover/30 transition-colors cursor-pointer relative">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span className="text-[10px] mt-1">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="text-xxs text-muted max-w-[240px]">
                    Supported formats: JPG, PNG, WEBP. Max size 5MB. Photo will upload directly to Cloudinary.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Resource Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    disabled={isPending}
                    placeholder="ECG Machine"
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    disabled={isPending}
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="ROOM">Room / Ward</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    disabled={isPending}
                    placeholder="Room 101"
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    disabled={isPending}
                    placeholder="Philips"
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    defaultValue="1"
                    required
                    disabled={isPending}
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Available Quantity
                  </label>
                  <input
                    type="number"
                    name="available_quantity"
                    min="0"
                    defaultValue="1"
                    required
                    disabled={isPending}
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Description / Notes
                </label>
                <textarea
                  name="description"
                  disabled={isPending}
                  rows={2}
                  placeholder="Additional notes about maintenance specs..."
                  className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    name="serial_number"
                    disabled={isPending}
                    placeholder="SN-98231-X"
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Purchase Cost ($)
                  </label>
                  <input
                    type="number"
                    name="purchase_cost"
                    step="0.01"
                    disabled={isPending}
                    placeholder="2500.00"
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    disabled={isPending}
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Warranty Until
                  </label>
                  <input
                    type="date"
                    name="warranty_until"
                    disabled={isPending}
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Initial Status
                </label>
                <select
                  name="status"
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value="ACTIVE">Active (Available)</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="RETIRED">Retired</option>
                </select>
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
                    <span>Create Resource</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !isPending && setEditingResource(null)}
            className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
          ></div>

          <div className="bg-card border border-border w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-heading text-lg">Edit Resource</h3>
              <button
                onClick={() => setEditingResource(null)}
                disabled={isPending}
                className="text-muted hover:text-heading cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-semibold flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Resource Photo
                </label>
                <div className="flex items-center gap-4">
                  {imageUrl || editingResource.image_url ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden relative border border-border">
                      <img
                        src={imageUrl || editingResource.image_url}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl(null);
                          editingResource.image_url = null;
                        }}
                        className="absolute top-1 right-1 bg-card border border-border p-0.5 rounded-full hover:bg-hover cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 text-muted" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-xl border border-dashed border-input-border flex flex-col items-center justify-center text-muted hover:text-heading hover:bg-hover/30 transition-colors cursor-pointer relative">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span className="text-[10px] mt-1">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="text-xxs text-muted max-w-[240px]">
                    Supported formats: JPG, PNG, WEBP. Max size 5MB. Photo will upload directly to Cloudinary.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Resource Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingResource.name}
                    disabled={isPending}
                    placeholder="ECG Machine"
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={editingResource.category}
                    disabled={isPending}
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="ROOM">Room / Ward</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editingResource.location || ""}
                    disabled={isPending}
                    placeholder="Room 101"
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    defaultValue={editingResource.manufacturer || ""}
                    disabled={isPending}
                    placeholder="Philips"
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    defaultValue={editingResource.quantity}
                    required
                    disabled={isPending}
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Available Quantity
                  </label>
                  <input
                    type="number"
                    name="available_quantity"
                    min="0"
                    defaultValue={editingResource.available_quantity}
                    required
                    disabled={isPending}
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Description / Notes
                </label>
                <textarea
                  name="description"
                  defaultValue={editingResource.description || ""}
                  disabled={isPending}
                  rows={2}
                  placeholder="Additional notes about maintenance specs..."
                  className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    name="serial_number"
                    defaultValue={editingResource.serial_number || ""}
                    disabled={isPending}
                    placeholder="SN-98231-X"
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Purchase Cost ($)
                  </label>
                  <input
                    type="number"
                    name="purchase_cost"
                    step="0.01"
                    defaultValue={editingResource.purchase_cost || ""}
                    disabled={isPending}
                    placeholder="2500.00"
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    defaultValue={editingResource.purchase_date || ""}
                    disabled={isPending}
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                    Warranty Until
                  </label>
                  <input
                    type="date"
                    name="warranty_until"
                    defaultValue={editingResource.warranty_until || ""}
                    disabled={isPending}
                    className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Resource Status
                </label>
                <select
                  name="status"
                  defaultValue={editingResource.status}
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value="ACTIVE">Active (Available)</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
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

      {/* Process Request Notes Modal */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !isPending && setIsNotesModalOpen(false)}
            className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
          ></div>

          <div className="bg-card border border-border w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 p-6 space-y-4">
            <div>
              <h3 className="font-bold text-heading text-lg">
                {selectedRequestAction === "APPROVED" ? "Approve Request" : "Reject Request"}
              </h3>
              <p className="text-muted text-xs mt-1">
                Provide notes/instructions for the requesting staff member (optional).
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Admin Notes
                </label>
                <textarea
                  placeholder="e.g. Approved. Please pick it up from room 203, or Rejected: Asset is currently in maintenance."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={isPending}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary placeholder:text-muted resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNotesModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-hover active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessRequest}
                  disabled={isPending}
                  className={`flex items-center gap-2 text-white dark:text-background px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all cursor-pointer disabled:opacity-50 ${
                    selectedRequestAction === "APPROVED"
                      ? "bg-success hover:bg-success-hover"
                      : "bg-danger hover:bg-danger-hover"
                  }`}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirm {selectedRequestAction === "APPROVED" ? "Approval" : "Rejection"}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
