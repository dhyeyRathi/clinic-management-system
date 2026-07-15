"use client";

import { useState } from "react";
import {
  Receipt,
  Search,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Calendar,
  DollarSign,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  item_type: string;
  description: string;
  unit_price: any;
  quantity: number;
  total_price: any;
}

interface Invoice {
  id: string;
  invoice_no: string;
  subtotal: any;
  tax: any;
  discount: any;
  total: any;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  invoice_items: InvoiceItem[];
}

interface InvoicesClientProps {
  initialInvoices: Invoice[];
}

const statusColors: Record<string, string> = {
  PAID: "bg-success/10 text-success border-success/20",
  UNPAID: "bg-danger/10 text-danger border-danger/20",
  PARTIAL: "bg-warning/10 text-warning border-warning/20",
  REFUNDED: "bg-muted/15 text-muted border-muted/30",
};

const statusIcons: Record<string, any> = {
  PAID: CheckCircle2,
  UNPAID: XCircle,
  PARTIAL: Clock,
  REFUNDED: XCircle,
};

export default function InvoicesClient({ initialInvoices }: InvoicesClientProps) {
  const [invoices] = useState(initialInvoices);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedInvoiceId(expandedInvoiceId === id ? null : id);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoice_no.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || invoice.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by Invoice No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted bg-input border border-input-border rounded-xl px-3 py-2 shrink-0 w-full sm:w-auto">
          <span>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-heading font-bold focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">All Invoices</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
          <Receipt className="w-12 h-12 text-muted/40" />
          <p className="text-sm font-medium">No invoices found.</p>
          <p className="text-xs">Any billing records from the front desk will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const StatusIcon = statusIcons[invoice.payment_status] || HelpCircle;
            const isExpanded = expandedInvoiceId === invoice.id;

            return (
              <div
                key={invoice.id}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow transition-shadow"
              >
                {/* Expandable Header */}
                <div
                  onClick={() => toggleExpand(invoice.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-hover/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-heading text-sm md:text-base">
                        Invoice #{invoice.invoice_no}
                      </p>
                      <p className="text-xs text-muted flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(invoice.created_at).toLocaleDateString([], {
                            dateStyle: "medium",
                          })}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <p className="text-sm md:text-base font-extrabold text-heading">
                        ${Number(invoice.total).toFixed(2)}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 rounded-full text-[10px] font-bold border ${
                          statusColors[invoice.payment_status]
                        }`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{invoice.payment_status}</span>
                      </span>
                    </div>

                    <div className="text-muted p-1 hover:bg-hover rounded-lg transition-colors">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Collapsed Detailed Items View */}
                {isExpanded && (
                  <div className="border-t border-border bg-hover/10 p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                        Billing Itemization
                      </h4>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-semibold transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Invoice</span>
                      </button>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto border border-border/80 rounded-xl bg-card">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-hover border-b border-border text-muted font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-4">Type</th>
                            <th className="py-2.5 px-4">Description</th>
                            <th className="py-2.5 px-4 text-center">Qty</th>
                            <th className="py-2.5 px-4 text-right">Unit Price</th>
                            <th className="py-2.5 px-4 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {invoice.invoice_items.map((item) => (
                            <tr key={item.id} className="text-heading font-medium">
                              <td className="py-3 px-4">
                                <span className="px-1.5 py-0.5 bg-hover rounded text-[10px] font-bold">
                                  {item.item_type}
                                </span>
                              </td>
                              <td className="py-3 px-4">{item.description}</td>
                              <td className="py-3 px-4 text-center">{item.quantity}</td>
                              <td className="py-3 px-4 text-right">${Number(item.unit_price).toFixed(2)}</td>
                              <td className="py-3 px-4 text-right">${Number(item.total_price).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Calculations */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                      {/* Payment Mode details */}
                      <div className="text-xs text-muted flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <span>
                          Payment Method:{" "}
                          <strong className="text-heading">
                            {invoice.payment_method || "Not Paid / Unspecified"}
                          </strong>
                        </span>
                      </div>

                      {/* Calculations breakdown */}
                      <div className="w-full sm:w-64 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted">Subtotal:</span>
                          <span className="font-semibold text-heading">${Number(invoice.subtotal).toFixed(2)}</span>
                        </div>
                        {Number(invoice.discount) > 0 && (
                          <div className="flex justify-between text-success">
                            <span>Discount:</span>
                            <span>-${Number(invoice.discount).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted">Tax:</span>
                          <span className="font-semibold text-heading">${Number(invoice.tax).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between font-extrabold text-sm text-heading">
                          <span>Total Amount:</span>
                          <span>${Number(invoice.total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
