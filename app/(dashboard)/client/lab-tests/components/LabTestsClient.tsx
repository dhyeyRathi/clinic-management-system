"use client";

import { useState, useTransition } from "react";
import { FlaskConical, Search, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { bookLabTestTypeAction } from "@/app/actions/labTests";
import { toast } from "sonner";

interface LabTestType {
  id: string;
  name: string;
  description: string | null;
  price: any;
  image_url: string | null;
  doctor_order_required: boolean;
}

interface LabTestsClientProps {
  initialTests: LabTestType[];
}

export default function LabTestsClient({ initialTests }: LabTestsClientProps) {
  const [tests] = useState(initialTests);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredTests = tests.filter((test) => {
    const nameMatch = test.name.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = test.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    return nameMatch || descMatch;
  });

  const handleBookDirect = (testId: string) => {
    startTransition(async () => {
      const res = await bookLabTestTypeAction(testId);
      if (res.success) {
        toast.success("Lab test booked! Go to Invoices to complete the payment.");
      } else {
        toast.error(res.error || "Failed to book lab test.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Control Search Header */}
      <div className="flex justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by test name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <span className="text-xs font-semibold text-muted hidden sm:inline-block">
          Showing {filteredTests.length} tests
        </span>
      </div>

      {/* Grid Catalog */}
      {filteredTests.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
          <FlaskConical className="w-12 h-12 text-muted/40" />
          <p className="text-sm font-medium">No tests found matching search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Image */}
                <div className="h-44 w-full bg-hover/20 relative overflow-hidden flex items-center justify-center border-b border-border/60">
                  {test.image_url ? (
                    <img
                      src={test.image_url}
                      alt={test.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted/50">
                      <FlaskConical className="w-10 h-10" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">No Thumbnail</span>
                    </div>
                  )}

                  {/* Price Tag Badge */}
                  <div className="absolute top-3 right-3 bg-heading/90 backdrop-blur-sm text-card px-3 py-1 rounded-xl font-extrabold text-xs shadow-sm flex items-center gap-0.5">
                    <span>${Number(test.price).toFixed(2)}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-heading text-sm md:text-base group-hover:text-primary transition-colors">
                    {test.name}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed line-clamp-3">
                    {test.description || "No description provided for this diagnostic service package."}
                  </p>
                </div>
              </div>

              {/* Action/Notice Footer */}
              <div className="px-5 py-3.5 bg-hover/30 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] text-muted">
                  {test.doctor_order_required ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Doctor order required to run.</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-emerald-600 font-medium">Direct Patient Booking Allowed</span>
                    </>
                  )}
                </div>

                {!test.doctor_order_required && (
                  <button
                    onClick={() => handleBookDirect(test.id)}
                    disabled={isPending}
                    className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Booking...</span>
                      </>
                    ) : (
                      <span>Book Test</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
