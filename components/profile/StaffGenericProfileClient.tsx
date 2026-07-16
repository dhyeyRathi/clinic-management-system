"use client";

import React, { useState, useTransition } from "react";
import { User, Phone, Mail, Camera, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateStaffProfileAction } from "@/app/actions/staff";

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

interface StaffGenericProfileClientProps {
  profile: StaffProfile;
}

export default function StaffGenericProfileClient({
  profile,
}: StaffGenericProfileClientProps) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  // Dirty state: true when the form has unsaved changes
  const isDirty =
    name !== profile.name ||
    phone !== (profile.phone || "") ||
    avatarFile !== null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Name is a required field.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    startTransition(async () => {
      const res = await updateStaffProfileAction(formData);
      if (res.success) {
        toast.success("Profile settings updated successfully!");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to update profile settings.");
      }
    });
  };

  return (
    <div className="bg-card border border-border shadow-sm rounded-3xl p-6 md:p-8 max-w-2xl">
      

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Stream Header */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border/60">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/25 flex items-center justify-center shrink-0 group">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-primary" />
            )}

            <label className="absolute inset-0 bg-overlay/50 backdrop-blur-xs flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-200">
              <Camera className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isPending}
                className="hidden"
              />
            </label>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold text-heading">{name || "Staff Member"}</h3>
            <p className="text-xs text-muted mt-0.5">{profile.email}</p>
            <p className="text-[10px] bg-primary/10 text-primary font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-2">
              Clinic Account
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-heading uppercase mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                placeholder="e.g. John Doe"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-heading uppercase mb-1.5">
              Contact Phone
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isPending}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-heading uppercase mb-1.5">
              Account Email (Read-Only)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                readOnly
                value={profile.email}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-hover border border-border text-muted cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
          {isDirty && !isPending && (
            <p className="text-xs text-warning font-medium">
              You have unsaved changes.
            </p>
          )}
          <button
            type="submit"
            disabled={!isDirty || isPending}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
      </form>
    </div>
  );
}
