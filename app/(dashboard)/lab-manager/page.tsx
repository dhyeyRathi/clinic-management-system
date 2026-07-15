import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  FlaskConical,
  Boxes,
  Activity,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

async function getLabManagerDashboardData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single();

  // Fetch lab tests catalog details
  const { data: labTests } = await supabase
    .from("lab_test_types")
    .select("id, status");

  // Fetch resources count
  const { data: resources } = await supabase
    .from("staff_resources")
    .select("id, status");

  const totalTests = labTests?.length || 0;
  const activeTests = labTests?.filter((t) => t.status === "ACTIVE").length || 0;
  const totalResources = resources?.length || 0;
  const activeResources = resources?.filter((r) => r.status === "ACTIVE").length || 0;

  return {
    profile,
    totalTests,
    activeTests,
    totalResources,
    activeResources,
  };
}

export default async function LabManagerDashboard() {
  const data = await getLabManagerDashboardData();

  if (!data) {
    return (
      <div className="p-6 text-center text-muted">
        Loading Lab Manager Console...
      </div>
    );
  }

  const {
    profile,
    totalTests,
    activeTests,
    totalResources,
    activeResources,
  } = data;

  const statCards = [
    {
      label: "Total Lab Services",
      value: totalTests,
      desc: "Cataloged lab test items",
      icon: FlaskConical,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Active Services",
      value: activeTests,
      desc: "Currently bookable tests",
      icon: Activity,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total Resources",
      value: totalResources,
      desc: "Rooms, tools, and equipments",
      icon: Boxes,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Operational Assets",
      value: activeResources,
      desc: "Assets currently available",
      icon: Activity,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-heading">
            Lab Operations Console
          </h1>
          <p className="text-muted text-sm mt-1">
            Welcome back, {profile?.name} • Laboratory & Equipment Planner
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

      {/* Details shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-heading">Lab Status Overview</h2>
          <div className="bg-card border border-border rounded-3xl p-6 text-center text-muted flex flex-col items-center justify-center gap-3">
            <FlaskConical className="w-10 h-10 text-muted/40" />
            <p className="text-sm font-medium">All diagnostic services are operational.</p>
            <p className="text-xs">
              Toggle lab tests online availability under the Lab Test Catalog settings.
            </p>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-base font-semibold text-heading">Operational Shortcuts</h2>
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
            <Link
              href="/lab-manager/tests"
              className="flex items-center justify-between p-4 bg-hover/40 hover:bg-hover hover:border-divider border border-border/50 rounded-2xl transition-all group"
            >
              <div>
                <h4 className="font-bold text-heading text-sm group-hover:text-primary transition-colors">
                  Lab Test Catalog
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  Toggle online diagnostic status settings
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0" />
            </Link>

            <Link
              href="/lab-manager/resources"
              className="flex items-center justify-between p-4 bg-hover/40 hover:bg-hover hover:border-divider border border-border/50 rounded-2xl transition-all group"
            >
              <div>
                <h4 className="font-bold text-heading text-sm group-hover:text-primary transition-colors">
                  Inventory Inspector
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  View room availability & clinic assets
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