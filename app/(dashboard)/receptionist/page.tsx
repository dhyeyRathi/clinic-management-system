import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reception Overview | Receptionist Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  Users,
  Receipt,
  UserCheck,
  Plus,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

async function getReceptionistDashboardData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Retrieve basic statistics
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Today's appointments count
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      status,
      mode,
      reason,
      client_profiles (
        profiles (
          name,
          avatar_url
        )
      ),
      doctor_profiles (
        profiles (
          name
        )
      )
    `)
    .order("scheduled_at", { ascending: true });

  const todayApps = appointments?.filter(app => {
    const d = new Date(app.scheduled_at);
    return d >= todayStart && d <= todayEnd;
  }) || [];

  const waitingCount = todayApps.filter(a => a.status === "CHECKED_IN").length;
  const pendingConfirmation = appointments?.filter(a => a.status === "PENDING")?.length || 0;

  // Invoices count
  const { count: outstandingInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("payment_status", "UNPAID");

  // Patients count
  const { count: clientCount } = await supabase
    .from("client_profiles")
    .select("*", { count: "exact", head: true });

  return {
    todayApps,
    waitingCount,
    pendingConfirmation,
    outstandingInvoicesCount: outstandingInvoices || 0,
    clientCount: clientCount || 0,
  };
}

export default async function ReceptionistDashboard() {
  const data = await getReceptionistDashboardData();

  if (!data) {
    return (
      <div className="p-6 text-center text-muted">
        Loading receptionist desk console...
      </div>
    );
  }

  const {
    todayApps,
    waitingCount,
    pendingConfirmation,
    outstandingInvoicesCount,
    clientCount,
  } = data;

  const statCards = [
    {
      label: "Today's Schedule",
      value: todayApps.length,
      desc: `${todayApps.filter(a => a.status === "COMPLETED").length} completed visits`,
      icon: CalendarDays,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Waiting Room",
      value: waitingCount,
      desc: "Checked in patients",
      icon: UserCheck,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Pending Confirmations",
      value: pendingConfirmation,
      desc: "Online visit requests",
      icon: Clock,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Outstanding Bills",
      value: outstandingInvoicesCount,
      desc: "Unpaid invoices on ledger",
      icon: Receipt,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-heading">
            Front Desk Overview
          </h1>
          <p className="text-muted text-sm mt-1">
            Welcome back! Active clients: {clientCount} • Front Desk Console
          </p>
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

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's appointments checklist */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-heading">Waiting Room Queue</h2>
          {todayApps.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
              <CalendarDays className="w-10 h-10 text-muted/40" />
              <p className="text-sm font-medium">No appointments scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayApps.map((app) => {
                const clientProfile = app.client_profiles;
                const clientInfo = Array.isArray(clientProfile) ? clientProfile[0] : clientProfile;
                const clientUser = clientInfo?.profiles;
                const innerClientUser = Array.isArray(clientUser) ? clientUser[0] : clientUser;

                const docProfile = app.doctor_profiles;
                const docInfo = Array.isArray(docProfile) ? docProfile[0] : docProfile;
                const docUser = docInfo?.profiles;
                const innerDocUser = Array.isArray(docUser) ? docUser[0] : docUser;

                return (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      {innerClientUser?.avatar_url ? (
                        <img
                          src={innerClientUser.avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                          {innerClientUser?.name?.charAt(0) || "C"}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-heading text-sm">
                          {innerClientUser?.name || "Unknown Patient"}
                        </h4>
                        <p className="text-[11px] text-muted mt-0.5">
                          Assigned: Dr. {innerDocUser?.name || "Practitioner"} •{" "}
                          {new Date(app.scheduled_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : app.status === "CHECKED_IN"
                          ? "bg-warning/15 text-warning animate-pulse"
                          : app.status === "CONFIRMED"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/15 text-muted"
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-base font-semibold text-heading">Front Desk Actions</h2>
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
            <Link
              href="/receptionist/clients"
              className="flex items-center justify-between p-4 bg-hover/40 hover:bg-hover hover:border-divider border border-border/50 rounded-2xl transition-all group"
            >
              <div>
                <h4 className="font-bold text-heading text-sm group-hover:text-primary transition-colors">
                  Patient Register
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  Sign up new clients and MRN folders
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0" />
            </Link>

            <Link
              href="/receptionist/appointments"
              className="flex items-center justify-between p-4 bg-hover/40 hover:bg-hover hover:border-divider border border-border/50 rounded-2xl transition-all group"
            >
              <div>
                <h4 className="font-bold text-heading text-sm group-hover:text-primary transition-colors">
                  Appointment Bookings
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  Accept visit request and check in patients
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0" />
            </Link>

            <Link
              href="/receptionist/invoices"
              className="flex items-center justify-between p-4 bg-hover/40 hover:bg-hover hover:border-divider border border-border/50 rounded-2xl transition-all group"
            >
              <div>
                <h4 className="font-bold text-heading text-sm group-hover:text-primary transition-colors">
                  Billing Desk
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  Issue medical invoices and record payments
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}