import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  Clock,
  UserCheck,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Video,
  MapPin,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

async function getDoctorDashboardData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url, email")
    .eq("id", user.id)
    .single();

  const { data: doctorProfile } = await supabase
    .from("doctor_profiles")
    .select("id, specialization, consultation_fee")
    .eq("user_id", user.id)
    .single();

  if (!doctorProfile) return null;

  // Retrieve today's appointments for this doctor
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      completed_at,
      status,
      mode,
      reason,
      client_profiles (
        profiles (
          name,
          avatar_url
        )
      )
    `)
    .eq("doctor_id", doctorProfile.id)
    .order("scheduled_at", { ascending: true });

  const todayApps = appointments?.filter(app => {
    const d = new Date(app.scheduled_at);
    return d >= todayStart && d <= todayEnd;
  }) || [];

  const pendingCount = todayApps.filter(a => a.status === "PENDING" || a.status === "CONFIRMED").length;
  const checkedInCount = todayApps.filter(a => a.status === "CHECKED_IN").length;
  
  // Completed today is based on completed_at date
  const completedToday = appointments?.filter(a => {
    if (a.status !== "COMPLETED" || !a.completed_at) return false;
    const d = new Date(a.completed_at);
    return d >= todayStart && d <= todayEnd;
  }).length || 0;

  // Calculate today's revenue based on completed appointments
  const revenueToday = completedToday * Number(doctorProfile.consultation_fee);

  return {
    profile,
    doctorProfile,
    todayApps,
    pendingCount,
    checkedInCount,
    completedToday,
    revenueToday,
    totalAssignedCount: appointments?.filter(a => a.status !== "COMPLETED").length || 0,
    appointments: appointments?.filter(a => a.status !== "COMPLETED") || [],
  };
}

export default async function DoctorDashboard() {
  const data = await getDoctorDashboardData();

  if (!data) {
    return (
      <div className="p-6 text-center text-muted">
        Loading doctor dashboard console...
      </div>
    );
  }

  const {
    profile,
    doctorProfile,
    todayApps,
    pendingCount,
    checkedInCount,
    completedToday,
    revenueToday,
    totalAssignedCount,
    appointments,
  } = data;

  const statCards = [
    {
      label: "All Appointments",
      value: totalAssignedCount,
      desc: "Total booked slots all time",
      icon: CalendarDays,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Schedule Today",
      value: todayApps.length,
      desc: "Total booked slots today",
      icon: CalendarDays,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Checked In (Waiting)",
      value: checkedInCount,
      desc: "Patients checked in at desk",
      icon: UserCheck,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Completed Visits",
      value: completedToday,
      desc: "Consultations finished today",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Today's Billings",
      value: `$${revenueToday.toFixed(2)}`,
      desc: `Fee: $${Number(doctorProfile.consultation_fee).toFixed(2)} / visit`,
      icon: TrendingUp,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-16 h-16 rounded-full object-cover border border-border shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl uppercase shrink-0">
              D
            </div>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-heading">
              Good day, Dr. {profile?.name}
            </h1>
            <p className="text-muted text-sm mt-1">
              Specialization: {doctorProfile.specialization} • Doctor Portal
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
        {/* Left Column: Schedules */}
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Agenda */}
          <div className="space-y-4">
          <h2 className="text-base font-semibold text-heading">Today's Appointment Schedule</h2>
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
                          {innerClientUser?.name?.charAt(0) || "P"}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-heading text-sm">
                          {innerClientUser?.name || "Unknown Patient"}
                        </h4>
                        <p className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(app.scheduled_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          {app.mode === "VIRTUAL" ? (
                            <span className="flex items-center gap-1">
                              <Video className="w-3 h-3 text-primary" /> Virtual
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-500" /> In Person
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : app.status === "CHECKED_IN"
                          ? "bg-warning/10 text-warning animate-pulse"
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
        
          {/* All Appointments Schedule */}
          <div className="space-y-4">
          <h2 className="text-base font-semibold text-heading">All Appointments Schedule</h2>
          {!appointments || appointments.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
              <CalendarDays className="w-10 h-10 text-muted/40" />
              <p className="text-sm font-medium">No appointments scheduled.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {appointments.map((app) => {
                const clientProfile = app.client_profiles;
                const clientInfo = Array.isArray(clientProfile) ? clientProfile[0] : clientProfile;
                const clientUser = clientInfo?.profiles;
                const innerClientUser = Array.isArray(clientUser) ? clientUser[0] : clientUser;

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
                          {innerClientUser?.name?.charAt(0) || "P"}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-heading text-sm">
                          {innerClientUser?.name || "Unknown Patient"}
                        </h4>
                        <p className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>
                            {new Date(app.scheduled_at).toLocaleDateString('en-US', {
                              month: "short",
                              day: "numeric",
                            })} - {new Date(app.scheduled_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          {app.mode === "VIRTUAL" ? (
                            <span className="flex items-center gap-1">
                              <Video className="w-3 h-3 text-primary" /> Virtual
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-500" /> In Person
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : app.status === "CHECKED_IN"
                          ? "bg-warning/10 text-warning animate-pulse"
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
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-base font-semibold text-heading">Consultation Shortcuts</h2>
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
            <Link
              href="/doctor/appointments"
              className="flex items-center justify-between p-4 bg-hover/40 hover:bg-hover hover:border-divider border border-border/50 rounded-2xl transition-all group"
            >
              <div>
                <h4 className="font-bold text-heading text-sm group-hover:text-primary transition-colors">
                  Consultation Console
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  Check-in patients, take notes, complete visits
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0" />
            </Link>

            <Link
              href="/doctor/reports"
              className="flex items-center justify-between p-4 bg-hover/40 hover:bg-hover hover:border-divider border border-border/50 rounded-2xl transition-all group"
            >
              <div>
                <h4 className="font-bold text-heading text-sm group-hover:text-primary transition-colors">
                  Clinical Reports
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  Write clinical summaries & recommend lab tests
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0" />
            </Link>

            <Link
              href="/doctor/profile"
              className="flex items-center justify-between p-4 bg-hover/40 hover:bg-hover hover:border-divider border border-border/50 rounded-2xl transition-all group"
            >
              <div>
                <h4 className="font-bold text-heading text-sm group-hover:text-primary transition-colors">
                  Availability Planner
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  Manage fees, specialization and schedules
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