"use client";

import { useState, useTransition, useRef } from "react";
import { Toaster, toast } from "sonner";
import { User, Phone, Calendar, Mail, MapPin, ShieldAlert, Camera, Save, Loader2 } from "lucide-react";
import { updateClientProfileAction } from "@/app/actions/clientProfile";

interface ProfileClientProps {
  profile: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    avatar_url: string | null;
    client_profiles: {
      id: string;
      client_code: string;
      date_of_birth: string | null;
      gender: "MALE" | "FEMALE" | "OTHER";
      address: string | null;
      emergency_contact: string | null;
    } | null;
  };
}

export default function ProfileClient({ profile }: ProfileClientProps) {
  const clientData = profile.client_profiles;

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(clientData?.date_of_birth || "");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">(clientData?.gender || "OTHER");
  const [address, setAddress] = useState(clientData?.address || "");
  const [emergencyContact, setEmergencyContact] = useState(clientData?.emergency_contact || "");
  
  // Image preview state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // Image change handler
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("dateOfBirth", dateOfBirth);
      formData.append("gender", gender);
      formData.append("address", address);
      formData.append("emergencyContact", emergencyContact);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await updateClientProfileAction(formData);
      if (res.success) {
        toast.success("Profile updated successfully!");
        // Reload to update header/sidebar context
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
        {/* Left Column: Avatar & Read-only Account Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 text-center shadow-sm flex flex-col items-center">
            {/* Avatar block */}
            <div className="relative group cursor-pointer w-28 h-28 mb-4" onClick={triggerFileInput}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={name}
                  className="w-full h-full rounded-full object-cover border border-border shadow-md"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl uppercase border border-border">
                  {name.charAt(0)}
                </div>
              )}
              {/* Overlay camera */}
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

            <h3 className="font-bold text-heading text-lg">{name}</h3>
            <p className="text-xs text-muted mt-1">{profile.email}</p>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 text-violet-500 rounded-full text-xs font-bold border border-violet-500/20 mt-4">
              Client MRN: {clientData?.client_code || "PAT-XXXXXX"}
            </span>
          </div>

          {/* Account credentials */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              System Settings
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 text-muted">
                <Mail className="w-4 h-4 text-muted/80 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] uppercase font-bold text-muted/60">Email Address</p>
                  <p className="text-heading font-medium">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-muted border-t border-border/40 pt-3">
                <ShieldAlert className="w-4 h-4 text-muted/80 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted/60">Account Security</p>
                  <p className="text-heading font-medium">Password managed externally</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="text-base font-semibold text-heading">
              Personal Information & Demographics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
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
                    placeholder="John Doe"
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* DOB */}
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
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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

              {/* Emergency Contact */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Emergency Contact (Name & Phone)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Jane Doe - +1 (555) 987-6543"
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
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, Apartment 4B, New York, NY 10001"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-6 py-3 rounded-xl text-sm font-semibold shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile</span>
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
