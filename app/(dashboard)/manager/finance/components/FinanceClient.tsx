"use client";

import { useState, useTransition } from "react";
import { updateInvoiceStatusAction } from "@/app/actions/finance";
import {
  Search,
  Filter,
  X,
  Receipt,
  FileText,
  CreditCard,
  CheckCircle,
  Clock,
  Ban,
  Printer,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface FinanceClientProps {
  initialInvoices: any[];
}

export default function FinanceClient({ initialInvoices }: FinanceClientProps) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredInvoices = invoices.filter((inv) => {
    const clientName = inv.client?.profile?.name || "";
    const matchesSearch =
      inv.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || inv.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleMarkAsPaid(invoiceId: string, method: string = "CASH") {
    startTransition(async () => {
      const result = await updateInvoiceStatusAction(invoiceId, "PAID", method as any);
      if (result.success) {
        toast.success("Invoice marked as PAID!");
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoiceId
              ? { ...inv, payment_status: "PAID", payment_method: "CASH" }
              : inv
          )
        );
        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          setSelectedInvoice((prev: any) => ({
            ...prev,
            payment_status: "PAID",
            payment_method: method,
          }));
        }
      } else {
        toast.error(result.error || "Failed to update invoice.");
      }
    });
  }

  const statusColors: Record<string, string> = {
    PAID: "bg-success/15 text-success border-success/20",
    UNPAID: "bg-danger/15 text-danger border-danger/20",
    NOT_STARTED: "bg-danger/15 text-danger border-danger/20",
    PENDING_APPROVAL: "bg-warning/15 text-warning border-warning/20",
    PARTIAL: "bg-warning/15 text-warning border-warning/20",
    REFUNDED: "bg-muted/15 text-muted border-border",
  };

  return (
    <>
      

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by invoice no or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted bg-input border border-input-border rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-heading font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="PARTIAL">Partial</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-hover/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Invoice ID</th>
                <th className="py-4 px-6">Client / MRN</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Total Cost</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Invoice Sheet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    No billing records found matching filter constraints.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-hover/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-semibold text-heading">{inv.invoice_no}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-heading">
                          {inv.client?.profile?.name || "Anonymous Patient"}
                        </p>
                        <p className="text-xxs text-muted mt-0.5 uppercase tracking-wide">
                          MRN: {inv.client?.client_code || "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted text-xs">
                      {new Date(inv.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6 font-bold text-heading">
                      ${parseFloat(inv.total).toFixed(2)}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xxs font-bold border uppercase ${
                          statusColors[inv.payment_status]
                        }`}
                      >
                        <span className="w-1 h-1 rounded-full bg-current"></span>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer transition-colors"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedInvoice(null)}
            className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
          ></div>

          <div className="bg-card border border-border w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-hover/20">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-heading text-base">
                  Invoice details: {selectedInvoice.invoice_no}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-muted hover:text-heading cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Details Card */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-hover/40 p-4 border border-border rounded-xl">
                <div>
                  <p className="text-muted uppercase font-bold tracking-wider mb-0.5">Patient</p>
                  <p className="font-semibold text-heading text-sm">
                    {selectedInvoice.client?.profile?.name || "N/A"}
                  </p>
                  <p className="text-muted text-xxs mt-0.5 uppercase">
                    MRN: {selectedInvoice.client?.client_code || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted uppercase font-bold tracking-wider mb-0.5">Date Created</p>
                  <p className="font-semibold text-heading">
                    {new Date(selectedInvoice.created_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-bold text-heading text-xs uppercase tracking-wider">
                  Billed Diagnostics & Services
                </h4>
                <div className="border border-border rounded-xl overflow-hidden bg-input/40">
                  <div className="grid grid-cols-12 bg-hover/30 border-b border-border py-2 px-3 text-xxs font-bold text-muted uppercase">
                    <span className="col-span-6">Description</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-2 text-right">Price</span>
                    <span className="col-span-2 text-right">Total</span>
                  </div>
                  <div className="divide-y divide-border max-h-48 overflow-y-auto">
                    {selectedInvoice.invoice_items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 py-2.5 px-3 text-xs text-body hover:bg-hover/10"
                      >
                        <span className="col-span-6 font-medium text-heading truncate">
                          {item.description}
                        </span>
                        <span className="col-span-2 text-center text-muted">{item.quantity}</span>
                        <span className="col-span-2 text-right text-muted">
                          ${parseFloat(item.unit_price).toFixed(2)}
                        </span>
                        <span className="col-span-2 text-right font-bold text-heading">
                          ${parseFloat(item.total_price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-border pt-4 flex flex-col gap-2 text-xs">
                <div className="flex justify-between text-body">
                  <span>Subtotal</span>
                  <span>${parseFloat(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-body">
                  <span>Tax & Levies</span>
                  <span>${parseFloat(selectedInvoice.tax).toFixed(2)}</span>
                </div>
                {parseFloat(selectedInvoice.discount) > 0 && (
                  <div className="flex justify-between text-success font-semibold">
                    <span>Discount</span>
                    <span>-${parseFloat(selectedInvoice.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-heading font-extrabold text-sm border-t border-border pt-2 mt-1">
                  <span>Total Amount Billed</span>
                  <span>${parseFloat(selectedInvoice.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Actions panel */}
              <div className="flex items-center justify-between border-t border-border pt-4 bg-hover/10 -mx-6 -mb-6 px-6 py-4">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-muted" />
                  <span className="text-xs text-muted font-medium">
                    Payment Method:{" "}
                    <strong className="text-heading uppercase">
                      {selectedInvoice.payment_method || "N/A"}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedInvoice.payment_status === "PENDING_APPROVAL" && (
                    <button
                      onClick={() => handleMarkAsPaid(selectedInvoice.id, selectedInvoice.payment_method || "ONLINE")}
                      disabled={isPending}
                      className="flex items-center gap-1.5 bg-success text-white dark:text-background hover:bg-success/90 px-3.5 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Approve Payment</span>
                    </button>
                  )}
                  {(selectedInvoice.payment_status === "UNPAID" || selectedInvoice.payment_status === "NOT_STARTED") && (
                    <button
                      onClick={() => handleMarkAsPaid(selectedInvoice.id, "CASH")}
                      disabled={isPending}
                      className="flex items-center gap-1.5 bg-success text-white dark:text-background hover:bg-success/90 px-3.5 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Collect Cash</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      toast.info("Invoice printing template triggered.");
                      window.print();
                    }}
                    className="p-1.5 rounded-lg border border-border hover:bg-hover hover:border-divider active:scale-95 transition-all text-muted hover:text-heading cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
