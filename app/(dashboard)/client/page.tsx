import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview | Client Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import {
  CalendarDays,
  Receipt,
  FlaskConical,
  User,
  Shield,
  ArrowRight,
  AlertCircle,
  Stethoscope,
  FileText,
} from "lucide-react";
import Link from "next/link";

async function getClientDashboardData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch profile and client profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, avatar_url")
    .eq("id", user.id)
    .single();

  let { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("id, client_code, gender, address")
    .eq("user_id", user.id)
    .single();

  // Self-heal: create the client_profiles row if it somehow doesn't exist
  // (e.g. accounts created before the auth trigger was applied)
  if (!clientProfile) {
    await supabase.from("client_profiles").insert({ user_id: user.id, gender: "OTHER" });
    const { data: healed } = await supabase
      .from("client_profiles")
      .select("id, client_code, gender, address")
      .eq("user_id", user.id)
      .single();
    clientProfile = healed;
  }

  if (!clientProfile) return null;

  // 2. Fetch upcoming appointments count and next appointment
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      status,
      mode,
      reason,
      doctor_profiles (
        profiles (
          name,
          avatar_url
        )
      )
    `)
    .eq("client_id", clientProfile.id)
    .in("status", ["PENDING", "CONFIRMED"])
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true });

  // 3. Fetch invoices for unpaid totals
  const { data: invoices } = await supabase
    .from("invoices")
    .select("total, payment_status")
    .eq("client_id", clientProfile.id);

  // 4. Fetch reports count
  const { count: reportsCount } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientProfile.id);

  const unpaidInvoices = invoices?.filter(i => i.payment_status === "UNPAID") || [];
  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

  // Flatten next appointment's doctor profile
  let nextAppFormatted: any = null;
  if (appointments && appointments.length > 0) {
    const rawApp = appointments[0];
    const docProfile = Array.isArray(rawApp.doctor_profiles)
      ? rawApp.doctor_profiles[0]
      : rawApp.doctor_profiles;

    const innerProfile = docProfile
      ? (Array.isArray(docProfile.profiles) ? docProfile.profiles[0] : docProfile.profiles)
      : null;

    nextAppFormatted = {
      ...rawApp,
      doctor_profiles: docProfile
        ? {
            profiles: innerProfile
              ? {
                  name: innerProfile.name,
                  avatar_url: innerProfile.avatar_url,
                }
              : null,
          }
        : null,
    };
  }

  return {
    profile,
    clientProfile,
    upcomingCount: appointments?.length || 0,
    nextAppointment: nextAppFormatted,
    unpaidTotal,
    unpaidCount: unpaidInvoices.length,
    reportsCount: reportsCount || 0,
  };
}

export default async function ClientPage() {
  const data = await getClientDashboardData();

  if (!data) {
    return (
      <div className="p-6 text-center text-muted">
        Loading client details...
      </div>
    );
  }

  const {
    profile,
    clientProfile,
    upcomingCount,
    nextAppointment,
    unpaidTotal,
    unpaidCount,
    reportsCount,
  } = data;

  const statCards = [
    {
      label: "Client ID (MRN)",
      value: clientProfile.client_code,
      desc: "Unique registration code",
      icon: Shield,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Upcoming Visits",
      value: upcomingCount,
      desc: upcomingCount === 1 ? "1 scheduled visit" : `${upcomingCount} scheduled visits`,
      icon: CalendarDays,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Outstanding Balance",
      value: `$${unpaidTotal.toFixed(2)}`,
      desc: unpaidCount === 1 ? "1 unpaid invoice" : `${unpaidCount} unpaid invoices`,
      icon: Receipt,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Medical Reports",
      value: reportsCount,
      desc: reportsCount === 1 ? "1 uploaded report" : `${reportsCount} uploaded reports`,
      icon: FileText,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
  ];

  const quickLinks = [
    {
      title: "Find a Doctor",
      desc: "Browse our doctors and book a consultation instantly",
      href: "/client/doctors",
      icon: Stethoscope,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
    },
    {
      title: "My Appointments",
      desc: "View upcoming visits and manage your scheduled slots",
      href: "/client/appointments",
      icon: CalendarDays,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "View Invoices",
      desc: "Check billing status, past payments, and details",
      href: "/client/invoices",
      icon: Receipt,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "My Reports",
      desc: "Access your clinic medical files and laboratory test PDFs",
      href: "/client/reports",
      icon: FileText,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Lab Catalog",
      desc: "Browse tests offered, test prep requirements, and pricing",
      href: "/client/lab-tests",
      icon: FlaskConical,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Edit My Profile",
      desc: "Update contact details, address, and upload photos",
      href: "/client/profile",
      icon: User,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="w-16 h-16 rounded-full object-cover border border-border shadow-sm shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl uppercase shrink-0">
              {profile?.name?.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-heading">
              Welcome back, {profile?.name}!
            </h1>
            <p className="text-muted text-sm mt-1">
              {profile?.email} • Client Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted">
                  {card.label}
                </span>
                <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-heading truncate">{card.value}</p>
                <p className="text-xs text-muted mt-1">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next Appointment Card */}
        <div className="lg:col-span-1 bg-card border border-border rounded-3xl p-6 flex flex-col justify-between shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-semibold text-heading mb-4">
              Next Scheduled Appointment
            </h2>
            {nextAppointment ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {nextAppointment.doctor_profiles?.profiles?.avatar_url ? (
                    <img
                      src={nextAppointment.doctor_profiles.profiles.avatar_url}
                      alt="Doctor avatar"
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase shrink-0">
                      D
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-heading">
                      Dr. {nextAppointment.doctor_profiles?.profiles?.name}
                    </p>
                    <p className="text-xs text-muted">
                      {nextAppointment.mode === "VIRTUAL" ? "Virtual Consultation" : "In-Person Consultation"}
                    </p>
                  </div>
                </div>

                <div className="bg-hover/30 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted">Date & Time:</span>
                    <span className="font-semibold text-heading">
                      {new Date(nextAppointment.scheduled_at).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted">Reason:</span>
                    <span className="font-medium text-heading truncate max-w-[150px]">
                      {nextAppointment.reason}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted">Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      nextAppointment.status === "CONFIRMED" 
                        ? "bg-success/15 text-success" 
                        : "bg-warning/15 text-warning"
                    }`}>
                      {nextAppointment.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-8 h-8 text-muted/50" />
                <span>No upcoming appointments scheduled.</span>
              </div>
            )}
          </div>

          <Link
            href="/client/appointments"
            className="flex items-center justify-center gap-2 w-full py-3 bg-hover hover:bg-hover-dark text-heading text-sm font-semibold rounded-2xl transition-all"
          >
            <span>Manage Appointments</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Quick Links Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-heading">
            Quick Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.title}
                  href={link.href}
                  className="group bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-divider transition-all flex flex-col gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${link.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-heading group-hover:text-primary transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-xs text-muted mt-1 leading-normal">
                      {link.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}