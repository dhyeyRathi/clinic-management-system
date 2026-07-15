"use client";

import { useState, useTransition } from "react";
import {
  Receipt,
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Printer,
  FileText,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { receptionistCreateInvoiceAction } from "@/app/actions/receptionist";
import { updateInvoiceStatusAction } from "@/app/actions/finance";

interface Client {
  id: string;
  client_code: string;
  name: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface InvoiceItem {
  id?: string;
  item_type: "CONSULTATION" | "LAB_TEST" | "MEDICINE" | "OTHER";
  description: string;
  unit_price: number;
  quantity: number;
  total_price: number;
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
  pdf_url?: string | null;
  client: {
    id: string;
    client_code: string;
    name: string;
  };
  invoice_items: InvoiceItem[];
}

interface ReceptionistInvoicesClientProps {
  invoices: Invoice[];
  clients: Client[];
  doctors: Doctor[];
}

const statusColors: Record<string, string> = {
  PAID: "bg-success/10 text-success border-success/20",
  UNPAID: "bg-danger/10 text-danger border-danger/20",
  NOT_STARTED: "bg-danger/10 text-danger border-danger/20",
  PENDING_APPROVAL: "bg-warning/10 text-warning border-warning/20",
  PARTIAL: "bg-warning/10 text-warning border-warning/20",
  REFUNDED: "bg-muted/15 text-muted border-muted/30",
};

const statusIcons: Record<string, any> = {
  PAID: CheckCircle2,
  UNPAID: XCircle,
  NOT_STARTED: XCircle,
  PENDING_APPROVAL: Clock,
  PARTIAL: Clock,
  REFUNDED: XCircle,
};

export default function ReceptionistInvoicesClient({
  invoices: initialInvoices,
  clients,
  doctors,
}: ReceptionistInvoicesClientProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Form states
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "NOT_STARTED">("NOT_STARTED");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "ONLINE" | "INSURANCE">("CASH");
  const [discountStr, setDiscountStr] = useState("0");

  // Dynamic invoice items list
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newItemType, setNewItemType] = useState<"CONSULTATION" | "LAB_TEST" | "MEDICINE" | "OTHER">("CONSULTATION");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");

  const [isPending, startTransition] = useTransition();

  const handleCollectPayment = (invoiceId: string, method: "CASH" | "CARD" | "ONLINE" | "INSURANCE") => {
    startTransition(async () => {
      const res = await updateInvoiceStatusAction(invoiceId, "PAID", method);
      if (res.success) {
        toast.success("Payment collected and approved successfully!");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to collect payment.");
      }
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedInvoiceId(expandedInvoiceId === id ? null : id);
  };

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.invoice_no.toLowerCase().includes(q) ||
      inv.client.name.toLowerCase().includes(q) ||
      inv.client.client_code.toLowerCase().includes(q)
    );
  });

  const handleAddItem = () => {
    if (!newItemDesc || !newItemPrice || Number(newItemPrice) <= 0) {
      toast.error("Please provide valid item description and price.");
      return;
    }
    const price = parseFloat(newItemPrice);
    const qty = parseInt(newItemQty) || 1;
    const total_price = price * qty;

    const newItem: InvoiceItem = {
      item_type: newItemType,
      description: newItemDesc,
      unit_price: price,
      quantity: qty,
      total_price,
    };

    setItems((prev) => [...prev, newItem]);
    // Reset inputs
    setNewItemDesc("");
    setNewItemPrice("");
    setNewItemQty("1");
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const discount = parseFloat(discountStr) || 0;
  const taxRate = 0.08; // 8% standard tax
  const calculatedTax = (subtotal - discount) * taxRate;
  const tax = calculatedTax > 0 ? calculatedTax : 0;
  const total = subtotal - discount + tax > 0 ? subtotal - discount + tax : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || items.length === 0) {
      toast.error("Please choose a patient and add at least one line item.");
      return;
    }

    startTransition(async () => {
      const res = await receptionistCreateInvoiceAction(
        selectedClient,
        subtotal,
        tax,
        discount,
        total,
        paymentStatus,
        paymentStatus === "PAID" ? paymentMethod : null,
        items,
        selectedDoctor || undefined
      );

      if (res.success) {
        toast.success("Medical invoice generated successfully!");
        setIsModalOpen(false);
        // Reset forms
        setSelectedClient("");
        setSelectedDoctor("");
        setItems([]);
        setDiscountStr("0");
        setPaymentStatus("NOT_STARTED");
        // Reload list
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to create invoice.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <Toaster position="top-right" richColors />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm print:hidden">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search invoices by code or patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Generate Invoice */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Invoice</span>
        </button>
      </div>

      {/* Invoices List */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
          <Receipt className="w-12 h-12 text-muted/40" />
          <p className="text-sm font-medium">No billing records found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => {
            const StatusIcon = statusIcons[invoice.payment_status] || HelpCircle;
            const isExpanded = expandedInvoiceId === invoice.id;

            return (
              <div
                key={invoice.id}
                className={`bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow transition-shadow ${
                  !isExpanded ? "print:hidden" : "print:border-0 print:shadow-none"
                }`}
              >
                {/* Header */}
                <div
                  onClick={() => toggleExpand(invoice.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-hover/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 print:hidden">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-heading text-sm md:text-base">
                        Invoice #{invoice.invoice_no}
                      </p>
                      <p className="text-[11px] text-muted font-medium mt-1">
                        Patient: <span className="text-heading font-semibold">{invoice.client.name} ({invoice.client.client_code})</span>
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
                        <StatusIcon className="w-3 h-3 print:hidden" />
                        <span>{invoice.payment_status}</span>
                      </span>
                    </div>

                    <div className="text-muted p-1 hover:bg-hover rounded-lg transition-colors print:hidden">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="border-t border-border bg-hover/10 p-5 space-y-4 animate-in slide-in-from-top-2 duration-200 print:border-t-0 print:bg-transparent">
                    <div className="flex justify-between items-center print:hidden">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                        Itemized breakdown
                      </h4>
                      <div className="flex items-center gap-3">
                        {invoice.pdf_url && (
                          <a
                            href={invoice.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-600 font-semibold transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                        )}
                        <button
                          onClick={() => window.print()}
                          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-semibold transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Invoice</span>
                        </button>
                      </div>
                    </div>

                    {/* Table */}
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
                          {invoice.invoice_items.map((item, idx) => (
                            <tr key={idx} className="text-heading font-medium">
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

                    {/* calculations */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                      <div className="text-xs text-muted flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-primary" />
                          <span>
                            Payment Mode:{" "}
                            <strong className="text-heading font-bold">
                              {invoice.payment_method || "N/A / Pending"}
                            </strong>
                          </span>
                        </div>
                        {(invoice.payment_status === "UNPAID" || invoice.payment_status === "NOT_STARTED") && (
                          <div className="flex items-center gap-2 mt-2 print:hidden">
                            <select
                              id={`pay-method-${invoice.id}`}
                              className="px-2 py-1 text-xs rounded bg-input border border-input-border text-foreground cursor-pointer focus:outline-none focus:border-primary"
                              defaultValue="CASH"
                            >
                              <option value="CASH">Cash</option>
                              <option value="CARD">Card</option>
                              <option value="ONLINE">Online</option>
                              <option value="INSURANCE">Insurance</option>
                            </select>
                            <button
                              onClick={() => {
                                const methodEl = document.getElementById(`pay-method-${invoice.id}`) as HTMLSelectElement;
                                handleCollectPayment(invoice.id, methodEl?.value as any);
                              }}
                              disabled={isPending}
                              className="px-3 py-1 bg-success hover:bg-success-hover text-white dark:text-background rounded font-semibold text-[11px] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            >
                              Collect Payment
                            </button>
                          </div>
                        )}
                        
                        {invoice.payment_status === "PENDING_APPROVAL" && (
                          <div className="flex items-center gap-2 mt-2 print:hidden">
                            <button
                              onClick={() => {
                                handleCollectPayment(invoice.id, invoice.payment_method as any || "ONLINE");
                              }}
                              disabled={isPending}
                              className="px-3 py-1 bg-success hover:bg-success-hover text-white dark:text-background rounded font-semibold text-[11px] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            >
                              Approve Payment
                            </button>
                          </div>
                        )}
                      </div>

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
                          <span className="text-muted">Tax (8%):</span>
                          <span className="font-semibold text-heading">${Number(invoice.tax).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between font-extrabold text-sm text-heading">
                          <span>Total:</span>
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

      {/* Invoice Generator Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-card border border-border shadow-2xl rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold text-heading">Generate Patient Invoice</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-hover text-muted hover:text-heading cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Select Client */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Select Patient *
                </label>
                <select
                  required
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="">-- Choose Patient --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.client_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Doctor */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Assigned Doctor (Optional)
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="">-- Choose Doctor (if applicable) --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items builder row */}
              <div className="border border-border/80 rounded-2xl p-4 space-y-3 bg-hover/10">
                <h4 className="text-xs font-bold text-heading">Billing Item Console</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted mb-1">Item Type</label>
                    <select
                      value={newItemType}
                      onChange={(e) => setNewItemType(e.target.value as any)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg bg-input border border-input-border text-foreground cursor-pointer"
                    >
                      <option value="CONSULTATION">Consultation</option>
                      <option value="LAB_TEST">Lab Test</option>
                      <option value="MEDICINE">Medicine</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-muted mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. General checkup fee, Blood count"
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-input border border-input-border text-foreground placeholder:text-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted mb-1">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-input border border-input-border text-foreground placeholder:text-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-input border border-input-border text-foreground"
                    />
                  </div>
                  <div className="sm:col-span-4 flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List Table */}
              {items.length > 0 && (
                <div className="border border-border/85 rounded-xl overflow-hidden text-xs bg-card">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-hover/80 text-muted font-bold border-b border-border">
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Price</th>
                        <th className="py-2 px-3 text-right">Total</th>
                        <th className="py-2 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {items.map((item, idx) => (
                        <tr key={idx} className="text-heading font-medium">
                          <td className="py-2 px-3">{item.item_type}</td>
                          <td className="py-2 px-3">{item.description}</td>
                          <td className="py-2 px-3 text-center">{item.quantity}</td>
                          <td className="py-2 px-3 text-right">${item.unit_price.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right">${item.total_price.toFixed(2)}</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-danger hover:text-danger-hover p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Calculations drawer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/40 pt-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Payment Status
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentStatus("NOT_STARTED")}
                        className={`flex-1 py-2 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                          paymentStatus === "NOT_STARTED"
                            ? "border-danger bg-danger/5 text-danger"
                            : "border-border hover:bg-hover text-muted"
                        }`}
                      >
                        Not Started
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentStatus("PAID")}
                        className={`flex-1 py-2 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                          paymentStatus === "PAID"
                            ? "border-success bg-success/5 text-success"
                            : "border-border hover:bg-hover text-muted"
                        }`}
                      >
                        Paid
                      </button>
                    </div>
                  </div>

                  {paymentStatus === "PAID" && (
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-input border border-input-border text-foreground cursor-pointer"
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="ONLINE">Online Transfer</option>
                        <option value="INSURANCE">Insurance Claim</option>
                      </select>
                    </div>
                  )}

                </div>

                {/* Financial aggregates */}
                <div className="space-y-2 border-l border-border/40 pl-0 sm:pl-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Subtotal:</span>
                    <span className="font-semibold text-heading">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-muted shrink-0">Discount ($):</span>
                    <input
                      type="number"
                      step="0.01"
                      value={discountStr}
                      onChange={(e) => setDiscountStr(e.target.value)}
                      className="w-20 px-2 py-1 text-right text-xs rounded border border-border bg-input text-heading"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Tax (8%):</span>
                    <span className="font-semibold text-heading">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border/80 pt-2 flex justify-between font-extrabold text-sm text-heading mt-2">
                    <span>Total Amount:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
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
                      <span>Generating Bill...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Create Invoice</span>
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
