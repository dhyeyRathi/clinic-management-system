"use client";

import { useState, useTransition } from "react";
import {
  Users,
  Search,
  Plus,
  X,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { receptionistRegisterClientAction } from "@/app/actions/receptionist";

interface Client {
  id: string;
  client_code: string;
  date_of_birth: string | null;
  gender: string;
  address: string | null;
  emergency_contact: string | null;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  status: string;
}

interface ReceptionistClientsClientProps {
  initialClients: Client[];
}

export default function ReceptionistClientsClient({
  initialClients,
}: ReceptionistClientsClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const [isPending, startTransition] = useTransition();

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.client_code.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !gender) {
      toast.error("Please fill in name, email and gender.");
      return;
    }

    startTransition(async () => {
      const res = await receptionistRegisterClientAction(
        name,
        email,
        phone,
        gender,
        dateOfBirth,
        address,
        emergencyContact
      );

      if (res.success) {
        toast.success("Client account registered successfully!");
        setIsModalOpen(false);
        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setGender("MALE");
        setDateOfBirth("");
        setAddress("");
        setEmergencyContact("");
        // Reload page to fetch code sequence increments
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to register client.");
      }
    });
  };

  return (
    <>
      <Toaster position="top-right" richColors />

      {/* Roster Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search clients by name, code or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Register Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Register Patient</span>
        </button>
      </div>

      {/* Clients Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
          <Users className="w-12 h-12 text-muted/40" />
          <p className="text-sm font-medium">No patients found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex items-center gap-3">
                {c.avatar_url ? (
                  <img
                    src={c.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                    {c.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-heading text-sm leading-tight">
                    {c.name}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-violet-500/10 text-violet-500 border border-violet-500/20 rounded-full text-[9px] font-bold mt-1">
                    MRN: {c.client_code}
                  </span>
                </div>
              </div>

              {/* info items */}
              <div className="space-y-1.5 text-xs text-muted">
                {c.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted/80 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </p>
                )}
                {c.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-muted/80 shrink-0" />
                    <span>{c.phone}</span>
                  </p>
                )}
                {c.date_of_birth && (
                  <p className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted/80 shrink-0" />
                    <span>
                      DOB: {new Date(c.date_of_birth).toLocaleDateString('en-US', { dateStyle: "medium" })}
                    </span>
                  </p>
                )}
                {c.emergency_contact && (
                  <p className="flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-muted/80 shrink-0" />
                    <span className="truncate">Emergency: {c.emergency_contact}</span>
                  </p>
                )}
                {c.address && (
                  <p className="flex items-start gap-2 pt-1 border-t border-border/40 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-muted/80 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.address}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-card border border-border shadow-2xl rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold text-heading">Register New Patient</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-hover text-muted hover:text-heading cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="tel"
                      placeholder="+1 (555) 019-2834"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Emergency contact */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    Emergency Contact (Name & Phone)
                  </label>
                  <div className="relative">
                    <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      placeholder="Jane Doe - +1 (555) 998-1122"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    Residential Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted" />
                    <textarea
                      rows={3}
                      placeholder="123 Health Ave, Apt 3C, New York, NY 10002"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex justify-end gap-3 pt-2">
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
                      <span>Saving Patient...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Register Client</span>
                    </>
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
