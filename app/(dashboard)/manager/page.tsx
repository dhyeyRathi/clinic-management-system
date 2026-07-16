import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operations Overview | Manager Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import {
  Users,
  FlaskConical,
  Receipt,
  Activity,
  TrendingUp,
  CalendarCheck,
  UserCheck,
  AlertCircle,
} from "lucide-react";

async function getManagerStats() {
  const supabase = await createClient();

  const [
    { count: totalStaff },
    { count: totalClients },
    { count: totalLabTests },
    { count: unpaidInvoices },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["DOCTOR", "RECEPTIONIST", "LAB_MANAGER"]),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "CLIENT"),
    supabase
      .from("lab_test_types")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE"),
    supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "UNPAID"),
  ]);

  return {
    totalStaff: totalStaff ?? 0,
    totalClients: totalClients ?? 0,
    totalLabTests: totalLabTests ?? 0,
    unpaidInvoices: unpaidInvoices ?? 0,
  };
}

export default async function ManagerPage() {
  const stats = await getManagerStats();

  const statCards = [
    {
      label: "Total Staff",
      value: stats.totalStaff,
      icon: UserCheck,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      change: "Doctors, Receptionists, Lab Managers",
    },
    {
      label: "Registered Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
      change: "All active client accounts",
    },
    {
      label: "Active Lab Tests",
      value: stats.totalLabTests,
      icon: FlaskConical,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      change: "Available in catalog",
    },
    {
      label: "Unpaid Invoices",
      value: stats.unpaidInvoices,
      icon: Receipt,
      color: "text-warning",
      bg: "bg-warning/10",
      change: "Requires collection",
    },
  ];

  const quickLinks = [
    {
      label: "Manage Staff Accounts",
      description: "Create, suspend or remove staff",
      href: "/manager/staff",
      icon: UserCheck,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Lab Test Catalog",
      description: "Add or update available tests",
      href: "/manager/lab-tests",
      icon: FlaskConical,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Finance Overview",
      description: "Review invoices and collections",
      href: "/manager/finance",
      icon: TrendingUp,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Audit Logs",
      description: "Track system activity events",
      href: "/manager/logs",
      icon: Activity,
      color: "text-danger",
      bg: "bg-danger/10",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-heading">Manager Overview</h1>
        <p className="text-muted text-sm mt-1">
          Monitor clinic operations, staff, and analytics from one place.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
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
                <p className="text-3xl font-bold text-heading">{card.value}</p>
                <p className="text-xs text-muted mt-1">{card.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-heading mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="group bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-divider transition-all flex flex-col gap-3"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-heading group-hover:text-primary transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{item.description}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>


    </div>
  );
}