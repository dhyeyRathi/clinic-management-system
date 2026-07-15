"use client";

import { useState } from "react";
import {
  Boxes,
  Search,
  MapPin,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Hash,
} from "lucide-react";

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

interface LabManagerResourcesClientProps {
  resources: Resource[];
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-success/15 text-success border border-success/20",
  INACTIVE: "bg-danger/15 text-danger border border-danger/20",
  MAINTENANCE: "bg-warning/15 text-warning border border-warning/20 animate-pulse",
};

export default function LabManagerResourcesClient({
  resources,
}: LabManagerResourcesClientProps) {
  const [search, setSearch] = useState("");

  const filtered = resources.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.resource_code.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
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
        <span className="text-xs font-semibold text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/10">
          Read-Only Inventory Viewer
        </span>
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
                    {r.warranty_until && (
                      <p className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted/80 shrink-0" />
                        <span>Warranty: <strong className="text-heading font-medium">{new Date(r.warranty_until).toLocaleDateString('en-US', { dateStyle: "medium" })}</strong></span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
