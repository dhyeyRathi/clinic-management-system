"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Boxes, Users, Receipt } from "lucide-react";

interface AnalyticsClientProps {
  data: {
    invoices: any[];
    staff: any[];
    resources: any[];
  };
}

export default function AnalyticsClient({ data }: AnalyticsClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center text-muted">
        Loading charts environment...
      </div>
    );
  }

  // 1. Process Monthly Revenue Data
  const monthlyRevenueMap: Record<string, { billed: number; collected: number }> = {};
  data.invoices.forEach((inv) => {
    const date = new Date(inv.created_at);
    const month = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const amount = parseFloat(inv.total) || 0;

    if (!monthlyRevenueMap[month]) {
      monthlyRevenueMap[month] = { billed: 0, collected: 0 };
    }

    monthlyRevenueMap[month].billed += amount;
    if (inv.payment_status === "PAID") {
      monthlyRevenueMap[month].collected += amount;
    }
  });

  const revenueChartData = Object.entries(monthlyRevenueMap).map(([month, val]) => ({
    name: month,
    Billed: parseFloat(val.billed.toFixed(2)),
    Collected: parseFloat(val.collected.toFixed(2)),
  }));

  // Fallback if no invoices exist
  const displayRevenueData =
    revenueChartData.length > 0
      ? revenueChartData
      : [
          { name: "Jul 26", Billed: 0, Collected: 0 },
        ];

  // 2. Process Resource Categories Count
  const resourceCategoryMap: Record<string, number> = {};
  data.resources.forEach((res) => {
    resourceCategoryMap[res.category] = (resourceCategoryMap[res.category] || 0) + 1;
  });

  const resourceChartData = Object.entries(resourceCategoryMap).map(([category, count]) => ({
    name: category.replace("_", " "),
    value: count,
  }));

  const COLORS = ["#2563eb", "#60a5fa", "#10b981", "#f59e0b", "#ef4444"];

  // 3. Process Staff Roles Count
  const staffRoleMap: Record<string, number> = {};
  data.staff.forEach((s) => {
    staffRoleMap[s.role] = (staffRoleMap[s.role] || 0) + 1;
  });

  const staffStats = [
    { label: "Doctors", value: staffRoleMap["DOCTOR"] || 0 },
    { label: "Receptionists", value: staffRoleMap["RECEPTIONIST"] || 0 },
    { label: "Lab Managers", value: staffRoleMap["LAB_MANAGER"] || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xxs font-bold text-muted uppercase tracking-wider">Revenue Collections Rate</p>
            <p className="text-xl font-extrabold text-heading mt-0.5">
              {data.invoices.length > 0
                ? (
                    (data.invoices.filter((i) => i.payment_status === "PAID").length /
                      data.invoices.length) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xxs font-bold text-muted uppercase tracking-wider">Total Active Resources</p>
            <p className="text-xl font-extrabold text-heading mt-0.5">
              {data.resources.filter((r) => r.status === "ACTIVE").length} / {data.resources.length}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xxs font-bold text-muted uppercase tracking-wider">Staff Roster</p>
            <p className="text-xl font-extrabold text-heading mt-0.5">{data.staff.length} Active</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-heading text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <span>Billing & Collections Overview</span>
            </h3>
            <p className="text-xxs text-muted mt-0.5">Monthly summary of total amount billed vs paid collections.</p>
          </div>
          <div className="h-80 w-full text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted)" />
                <YAxis stroke="var(--color-muted)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                    borderRadius: "12px",
                  }}
                />
                <Legend />
                <Bar dataKey="Billed" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Allocation Pie Chart */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-heading text-base flex items-center gap-2">
              <Boxes className="w-4 h-4 text-primary" />
              <span>Resource Allocation</span>
            </h3>
            <p className="text-xxs text-muted mt-0.5">Asset distributions registered in clinical catalog.</p>
          </div>
          {resourceChartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted text-xs">
              No resource statistics to show.
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resourceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {resourceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-heading)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="w-full grid grid-cols-2 gap-2 text-xxs font-semibold text-body">
                {resourceChartData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className="truncate">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Staff Roll Call Grid */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-heading text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>Staff Composition</span>
          </h3>
          <p className="text-xxs text-muted mt-0.5">Staff roster count by department/system roles.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {staffStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-hover/30 border border-border rounded-xl p-4 flex flex-col gap-1 text-center"
            >
              <span className="text-xxs font-bold text-muted uppercase tracking-wider">{stat.label}</span>
              <span className="text-2xl font-black text-heading">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
