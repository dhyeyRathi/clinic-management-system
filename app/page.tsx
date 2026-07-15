import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import {
  HeartPulse,
  Stethoscope,
  Microscope,
  CalendarCheck,
  ClipboardList,
  Clock,
  CheckCircle2
} from "lucide-react";

export const metadata = {
  title: "ClinicFlow | Exceptional Healthcare & Medical Services",
  description: "ClinicFlow provides comprehensive medical services, top specialists, and a modern patient portal for easy appointment booking and health record management.",
};

export default async function Home() {
  const supabase = await createClient();

  // Get active session user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userDashboard: string | null = null;
  let userName = "";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", user.id)
      .single();

    if (profile) {
      userName = profile.name;
      const ROLE_DASHBOARDS: Record<string, string> = {
        CLIENT: "/client",
        DOCTOR: "/doctor",
        RECEPTIONIST: "/receptionist",
        LAB_MANAGER: "/lab-manager",
        MANAGER: "/manager",
      };
      userDashboard = ROLE_DASHBOARDS[profile.role] || "/client";
    }
  }

  // Fetch active doctors dynamically from the DB to show as "Our Specialists"
  const { data: dbDoctors } = await supabase
    .from("doctor_profiles")
    .select(`
      id,
      specialization,
      profiles (
        name,
        avatar_url
      )
    `)
    .limit(4);

  const activeDoctors = (dbDoctors || []).map((doc: any) => {
    const profile = Array.isArray(doc.profiles) ? doc.profiles[0] : doc.profiles;
    return {
      id: doc.id,
      name: profile?.name || "Practitioner",
      specialization: doc.specialization || "General Medicine",
      avatarUrl: profile?.avatar_url || null,
    };
  });

  // Fetch active lab test types dynamically from the DB
  const { data: dbLabTests } = await supabase
    .from("lab_test_types")
    .select(`id, name, description, price, status, image_url`)
    .eq("status", "ACTIVE")
    .limit(6);

  const activeLabTests = dbLabTests || [];

  return (
    <div className="min-h-screen bg-background text-body flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* ── HEADER ────────────────────────────────────────── */}
      <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl text-heading tracking-tight block leading-none">
                ClinicFlow
              </span>
              <span className="text-[11px] font-medium text-muted uppercase tracking-wider block mt-1">
                Medical Center
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#services" className="text-sm font-semibold text-muted hover:text-primary transition-colors">
              Our Services
            </Link>
            <Link href="#specialists" className="text-sm font-semibold text-muted hover:text-primary transition-colors">
              Specialists
            </Link>
            <Link href="#diagnostics" className="text-sm font-semibold text-muted hover:text-primary transition-colors">
              Diagnostics
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {userDashboard ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted hidden sm:inline">
                  Welcome back, <strong className="text-heading font-semibold">{userName}</strong>
                </span>
                <Link
                  href={userDashboard}
                  className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-md text-sm font-semibold transition-colors shadow-sm"
                >
                  Dashboard
                </Link>
                <LogoutButton />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/register"
                  className="text-sm font-semibold text-heading hover:text-primary transition-colors px-3 py-2"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* ── HERO SECTION ───────────────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-32 max-w-7xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-heading tracking-tight max-w-4xl leading-tight mb-6">
            Exceptional Healthcare, <br className="hidden md:block" /> Centered Around You
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mb-10 leading-relaxed">
            Experience comprehensive medical services backed by leading specialists. Schedule appointments, access health records, and manage your care securely through our patient portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {userDashboard ? (
              <Link
                href={userDashboard}
                className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-md text-base font-semibold transition-colors shadow-sm w-full sm:w-auto flex justify-center items-center gap-2"
              >
                Access Patient Portal
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-md text-base font-semibold transition-colors shadow-sm w-full sm:w-auto flex justify-center items-center gap-2"
                >
                  Book an Appointment
                </Link>
                <Link
                  href="/login"
                  className="bg-card border border-border text-heading hover:bg-hover px-8 py-3.5 rounded-md text-base font-semibold transition-colors shadow-sm w-full sm:w-auto flex justify-center items-center gap-2"
                >
                  Patient Portal Login
                </Link>
              </>
            )}
          </div>
        </section>

        {/* ── OUR SERVICES ────────────────────────────────────── */}
        <section id="services" className="bg-surface border-y border-border py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">Comprehensive Care Offerings</h2>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                We provide a wide range of medical services tailored to meet the needs of our patients with compassion and expertise.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card border border-border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-heading mb-3">Primary Care</h3>
                <p className="text-muted leading-relaxed">
                  Routine check-ups, preventative care, and management of chronic conditions by our experienced family medicine practitioners.
                </p>
              </div>

              <div className="bg-card border border-border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Microscope className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-heading mb-3">Diagnostic Laboratory</h3>
                <p className="text-muted leading-relaxed">
                  State-of-the-art laboratory facilities providing accurate and timely test results to aid in precise medical diagnoses.
                </p>
              </div>

              <div className="bg-card border border-border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <CalendarCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-heading mb-3">Specialist Consultations</h3>
                <p className="text-muted leading-relaxed">
                  Direct access to leading specialists across various medical fields for advanced treatments and expert medical opinions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── OUR SPECIALISTS ─────────────────────────────────── */}
        <section id="specialists" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 flex flex-col items-center">
              <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">Our Medical Specialists</h2>
              <p className="text-muted text-lg max-w-2xl mx-auto mb-4">
                Meet our team of dedicated healthcare professionals committed to your well-being.
              </p>
              {!userDashboard && (
                <Link href="/register" className="text-primary font-semibold hover:underline flex items-center gap-1">
                  Book a consultation &rarr;
                </Link>
              )}
            </div>

            {activeDoctors.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-12 text-center text-muted">
                Our specialist directory is currently being updated. Please check back later.
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-6">
                {activeDoctors.map((doc) => {
                  // Format name nicely, removing any existing "Dr." prefix to avoid double prefixing
                  const cleanName = doc.name.replace(/^dr\.?\s+/i, "");
                  const initials = cleanName.slice(0, 2).toUpperCase();
                  
                  return (
                    <div key={doc.id} className="w-full sm:w-[280px] bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center shadow-sm hover:border-primary/50 transition-colors">
                      <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center mb-5 overflow-hidden">
                        {doc.avatarUrl ? (
                          <img src={doc.avatarUrl} alt={`Dr. ${cleanName}`} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-primary">{initials}</span>
                        )}
                      </div>
                      <h4 className="font-bold text-lg text-heading mb-1 line-clamp-1" title={`Dr. ${cleanName}`}>Dr. {cleanName}</h4>
                      <p className="text-sm font-medium text-primary mb-4 line-clamp-1" title={doc.specialization}>{doc.specialization}</p>
                      <Link href="/register" className="mt-auto pt-2 text-primary font-semibold text-sm hover:underline flex items-center gap-1 group">
                        Book Appointment <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── DIAGNOSTICS & LABS ─────────────────────────────── */}
        <section id="diagnostics" className="bg-surface border-y border-border py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">Laboratory & Diagnostics</h2>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                We offer a comprehensive suite of diagnostic tests processed in our certified on-site facilities.
              </p>
            </div>

            {activeLabTests.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-12 text-center text-muted">
                Our diagnostic directory is currently being updated. Please check back later.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeLabTests.map((test) => (
                  <div key={test.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                    {/* Image Header */}
                    <div className="h-48 bg-muted relative overflow-hidden flex items-center justify-center">
                      {test.image_url ? (
                        <img 
                          src={test.image_url} 
                          alt={test.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Microscope className="w-12 h-12 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border text-xs font-bold text-heading shadow-sm">
                        ${test.price.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-heading text-lg leading-tight">{test.name}</h4>
                      </div>
                      <p className="text-sm text-muted mb-6 line-clamp-2">{test.description}</p>
                      
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-1.5 text-success text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">Available</span>
                        </div>
                        <Link href="/register" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                          Book Test &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-card border-t border-border pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
                  <HeartPulse className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-heading tracking-tight">ClinicFlow</span>
              </div>
              <p className="text-muted max-w-sm leading-relaxed mb-6">
                Delivering excellence in healthcare through modern technology, experienced professionals, and a patient-first approach.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-heading mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li><Link href="#services" className="text-muted hover:text-primary transition-colors">Our Services</Link></li>
                <li><Link href="#specialists" className="text-muted hover:text-primary transition-colors">Find a Doctor</Link></li>
                <li><Link href="#diagnostics" className="text-muted hover:text-primary transition-colors">Lab Tests</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-heading mb-4">Portal Access</h4>
              <ul className="space-y-3">
                <li><Link href="/login" className="text-muted hover:text-primary transition-colors">Patient Login</Link></li>
                <li><Link href="/register" className="text-muted hover:text-primary transition-colors">Register Account</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted">
            <p>&copy; {new Date().getFullYear()} ClinicFlow Medical Center. All rights reserved.</p>
            <div className="flex gap-6">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
