"use client";

import { useState, useTransition, useRef } from "react";
import { Toaster, toast } from "sonner";
import {
  User,
  Phone,
  Mail,
  GraduationCap,
  Stethoscope,
  DollarSign,
  Camera,
  Save,
  Loader2,
  Calendar,
  Plus,
  Trash2,
} from "lucide-react";
import { updateDoctorProfileAction } from "@/app/actions/doctor";

interface AvailabilitySlot {
  day: string; // e.g. "Monday"
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "17:00"
}

interface DoctorProfileClientProps {
  profile: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    avatar_url: string | null;
    doctor_profiles: {
      id: string;
      specialization: string;
      qualifications: string;
      consultation_fee: any;
      availability: AvailabilitySlot[];
    } | null;
  };
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function DoctorProfileClient({ profile }: DoctorProfileClientProps) {
  const docData = profile.doctor_profiles;

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone || "");
  const [specialization, setSpecialization] = useState(docData?.specialization || "");
  const [qualifications, setQualifications] = useState(docData?.qualifications || "");
  const [consultationFee, setConsultationFee] = useState(docData?.consultation_fee ? String(docData.consultation_fee) : "0");

  // Availability template list
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(docData?.availability || []);
  const [newDay, setNewDay] = useState("Monday");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");

  // Avatar image preview
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // Dirty state: true only when values differ from what was last saved
  const originalAvailabilityJson = JSON.stringify(docData?.availability || []);
  const isDirty =
    name !== profile.name ||
    phone !== (profile.phone || "") ||
    specialization !== (docData?.specialization || "") ||
    qualifications !== (docData?.qualifications || "") ||
    consultationFee !== (docData?.consultation_fee ? String(docData.consultation_fee) : "0") ||
    JSON.stringify(availability) !== originalAvailabilityJson ||
    avatarFile !== null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Avatar image size must be under 2MB.");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSlot = () => {
    if (!newStart || !newEnd) return;
    if (newStart >= newEnd) {
      toast.error("Start time must be before end time.");
      return;
    }
    const newSlot: AvailabilitySlot = {
      day: newDay,
      startTime: newStart,
      endTime: newEnd,
    };
    setAvailability((prev) => [...prev, newSlot]);
  };

  const removeSlot = (index: number) => {
    setAvailability((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialization || !qualifications || !consultationFee) {
      toast.error("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("specialization", specialization);
      formData.append("qualifications", qualifications);
      formData.append("consultationFee", consultationFee);
      formData.append("availability", JSON.stringify(availability));
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await updateDoctorProfileAction(formData);
      if (res.success) {
        toast.success("Roster profile updated successfully!");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to update profile.");
      }
    });
  };

  return (
    <>
      <Toaster position="top-right" richColors />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Avatar & basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 text-center shadow-sm flex flex-col items-center">
            <div
              className="relative group cursor-pointer w-28 h-28 mb-4"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt=""
                  className="w-full h-full rounded-full object-cover border border-border shadow-md"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl uppercase border border-border">
                  {name.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 bg-overlay/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <h3 className="font-bold text-heading text-lg">Dr. {name}</h3>
            <p className="text-xs text-muted mt-1">{specialization}</p>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 text-sky-500 border border-sky-500/20 rounded-full text-xs font-bold mt-4">
              Consultant Practitioner
            </span>
          </div>

          {/* system identifiers */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              System credentials
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 text-muted">
                <Mail className="w-4 h-4 text-muted/80 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] uppercase font-bold text-muted/60">Email Address</p>
                  <p className="text-heading font-medium">{profile.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right card: fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Qualifications & Specialties */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="text-base font-semibold text-heading">Professional Roster details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Specialization *
                </label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Qualifications *
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    required
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Consultation Fee ($) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Availability Settings */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="text-base font-semibold text-heading flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span>Weekly Availability Planner</span>
            </h3>

            {/* Existing Slots */}
            <div className="space-y-2">
              {availability.length === 0 ? (
                <p className="text-xs text-muted italic">No availability slots configured.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availability.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-hover/20 text-xs font-medium text-heading"
                    >
                      <span>
                        {slot.day}: {slot.startTime} - {slot.endTime}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSlot(index)}
                        className="text-danger hover:text-danger-hover p-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Slot form */}
            <div className="border-t border-border/40 pt-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Add Availability Slot
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-semibold text-muted mb-1.5">Day</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-input border border-input-border text-foreground cursor-pointer"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-semibold text-muted mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-input border border-input-border text-foreground"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-semibold text-muted mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-input border border-input-border text-foreground"
                  />
                </div>

                <div className="sm:col-span-1">
                  <button
                    type="button"
                    onClick={addSlot}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/15 text-primary rounded-lg text-xs font-bold transition-all cursor-pointer h-9"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Slot</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
              {isDirty && !isPending && (
                <p className="text-xs text-warning font-medium">You have unsaved changes.</p>
              )}
              <button
                type="submit"
                disabled={!isDirty || isPending}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-6 py-3 rounded-xl text-sm font-semibold shadow-sm hover:shadow active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isDirty ? "Save Changes" : "No Changes"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
