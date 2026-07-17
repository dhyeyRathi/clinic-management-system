import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Stethoscope, GraduationCap, DollarSign, Calendar, Clock, ArrowLeft } from "lucide-react";

interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export default async function PublicDoctorProfilePage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const { id } = params;
  const supabase = await createClient();

  // Fetch the doctor profile using doctor_profiles.id
  const { data: docData } = await supabase
    .from("doctor_profiles")
    .select(`
      id,
      specialization,
      qualifications,
      consultation_fee,
      availability,
      biography,
      profiles (
        id,
        name,
        phone,
        email,
        avatar_url
      ),
      doctor_details (
        story
      )
    `)
    .eq("id", id)
    .single();

  // Fallback: search by profiles.id if no match found
  let doctor = docData;
  if (!doctor) {
    const { data: fallbackData } = await supabase
      .from("doctor_profiles")
      .select(`
        id,
        specialization,
        qualifications,
        consultation_fee,
        availability,
        biography,
        profiles (
          id,
          name,
          phone,
          email,
          avatar_url
        ),
        doctor_details (
          story
        )
      `)
      .eq("user_id", id)
      .single();
    doctor = fallbackData;
  }

  if (!doctor) {
    notFound();
  }

  const profile = doctor.profiles as any;
  const storyDetails = Array.isArray(doctor.doctor_details)
    ? doctor.doctor_details[0]
    : doctor.doctor_details;
  const story = (doctor as any).biography || storyDetails?.story || "";
  const availability = (doctor.availability || []) as AvailabilitySlot[];
  const cleanName = profile?.name ? profile.name.replace(/^dr\.?\s+/i, "") : "Practitioner";
  const initials = cleanName.slice(0, 2).toUpperCase();

  // Check auth user state for the header links
  const { data: { user } } = await supabase.auth.getUser();
  let userDashboard: string | null = null;
  let userName = "";

  if (user) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", user.id)
      .single();

    if (userProfile) {
      userName = userProfile.name;
      const ROLE_DASHBOARDS: Record<string, string> = {
        CLIENT: "/client",
        DOCTOR: "/doctor",
        RECEPTIONIST: "/receptionist",
        LAB_MANAGER: "/lab-manager",
        MANAGER: "/manager",
      };
      userDashboard = ROLE_DASHBOARDS[userProfile.role] || "/client";
    }
  }

  return (
    <div className="min-h-screen bg-background text-body flex flex-col font-sans selection:bg-primary selection:text-white relative">
      {/* Ambient background glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="glow-bg glow-1"></div>
        <div className="glow-bg glow-2"></div>
      </div>

      {/* Header */}
      <LandingHeader userDashboard={userDashboard} userName={userName} currentPath="" />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10 md:pt-36 md:pb-16 space-y-10 relative z-10">
        {/* Back Link */}
        <Link href="/#specialists" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to specialists directory
        </Link>

        {/* Doctor Main Header Info */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start shadow-md">
          {/* Avatar frame */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-surface border border-border/40 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={`Dr. ${cleanName}`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl font-black text-primary/40">{initials}</span>
            )}
          </div>

          {/* Name & Credentials */}
          <div className="text-center md:text-left space-y-4 flex-grow">
            <div>
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                {doctor.specialization}
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-heading">Dr. {cleanName}</h1>
              <p className="text-sm text-muted font-medium mt-1 flex items-center justify-center md:justify-start gap-1">
                <GraduationCap className="w-4 h-4 text-primary" /> {doctor.qualifications}
              </p>
            </div>

            {/* Badges strip */}
            <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start text-sm">
              <div className="flex items-center gap-1.5 bg-surface border border-border px-3 py-1.5 rounded-lg text-heading">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold">${Number(doctor.consultation_fee).toFixed(2)}</span>
                <span className="text-xs text-muted">/ consult</span>
              </div>

              <div className="flex items-center gap-1.5 bg-surface border border-border px-3 py-1.5 rounded-lg text-heading">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-semibold">{availability.length} Days</span>
                <span className="text-xs text-muted">scheduled</span>
              </div>
            </div>

            {/* Action */}
            <div className="pt-2">
              <Link href="/register" className="inline-block bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-colors text-center w-full sm:w-auto">
                Schedule Appointment
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left/Main story section */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Story Box */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-4 shadow-sm text-left">
              <h2 className="text-xl font-bold text-heading border-b border-border/30 pb-3 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" /> Professional Story &amp; Philosophy
              </h2>
              {story ? (
                <div className="text-muted leading-relaxed text-sm whitespace-pre-line space-y-4">
                  {story}
                </div>
              ) : (
                <p className="text-muted text-sm italic">
                  Biography story currently being written. Please contact the medical center front desk for more details on Dr. {cleanName}&apos;s background.
                </p>
              )}
            </div>
          </div>

          {/* Right availability scheduling column */}
          <div className="lg:col-span-1">
            <div className="glass-panel rounded-3xl p-6 space-y-6 shadow-sm text-left sticky top-24">
              <div>
                <h3 className="font-bold text-heading text-lg">Weekly Availability</h3>
                <p className="text-xs text-muted mt-1">Standard clinical consultation schedules</p>
              </div>

              {availability.length === 0 ? (
                <p className="text-muted text-xs italic">No weekly slots scheduled. Please book to verify availability.</p>
              ) : (
                <div className="space-y-3">
                  {availability.map((slot, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-surface border border-border/30 rounded-xl">
                      <div className="font-semibold text-xs text-heading uppercase tracking-wide">
                        {slot.day}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <Clock className="w-3.5 h-3.5 text-primary" /> {slot.startTime} - {slot.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
