import Link from "next/link";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { createClient } from "@/lib/supabase/server";
import {
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
    .select(`id, name, description, price, status, image_url, doctor_order_required`)
    .eq("status", "ACTIVE")
    .limit(6);

  const activeLabTests = dbLabTests || [];

  return (
    <div className="min-h-screen bg-background text-body flex flex-col font-sans selection:bg-primary selection:text-white relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="glow-bg glow-1"></div>
      <div className="glow-bg glow-2"></div>

      {/* ── HEADER ────────────────────────────────────────── */}
      <LandingHeader userDashboard={userDashboard} userName={userName} currentPath="/" />

      <main className="flex-grow">
        {/* ── HERO SECTION ───────────────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-32 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
            {/* Left Info Column */}
            <div className="lg:col-span-6 space-y-6 relative z-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider mb-2">
                Next-Gen Healthcare
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-heading leading-tight tracking-tight">
                Precision Medicine,<br />Transparent Care.
              </h1>
              <p className="text-lg text-muted max-w-lg leading-relaxed">
                Experience a clinical environment designed around clarity and efficiency. We merge advanced diagnostics with personalized treatment plans in a serene, modern setting.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                {userDashboard ? (
                  <Link
                    href={userDashboard}
                    className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-md text-sm font-bold transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    Access Patient Portal
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-md text-sm font-bold transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                      Book Appointment
                    </Link>
                    <Link
                      href="#services"
                      className="glass-panel text-primary px-8 py-3.5 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                      Our Offerings <span className="text-xs">&rarr;</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Column with Image and Floating Cards */}
            <div className="lg:col-span-6 relative z-10 mt-12 lg:mt-0">
              <div className="glass-panel rounded-2xl p-6 w-full aspect-[4/3] relative overflow-hidden flex items-center justify-center shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2070&auto=format&fit=crop"
                  alt="Modern Clinic"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay rounded-2xl"
                />
                
                {/* Floating Glass Cards */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end gap-4 bg-gradient-to-t from-background/40 to-transparent">
                  <div className="glass-panel rounded-xl p-4 flex items-center gap-4 w-11/12 md:w-3/4 shadow-lg border-l-4 border-l-secondary translate-x-1 hover:translate-x-2 transition-transform duration-300">
                    <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-heading text-sm mb-0.5">Advanced Cardiology</h3>
                      <p className="text-xs text-muted">State-of-the-art heart health monitoring.</p>
                    </div>
                  </div>

                  <div className="glass-panel rounded-xl p-4 flex items-center gap-4 w-11/12 md:w-3/4 self-end shadow-lg border-l-4 border-l-primary -translate-x-1 hover:-translate-x-2 transition-transform duration-300">
                    <div className="bg-secondary/10 p-2.5 rounded-lg text-secondary">
                      <Microscope className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-heading text-sm mb-0.5">Neurological Care</h3>
                      <p className="text-xs text-muted">Comprehensive brain and nerve diagnostics.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              <div className="glass-panel p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-heading mb-3">Primary Care</h3>
                <p className="text-muted leading-relaxed">
                  Routine check-ups, preventative care, and management of chronic conditions by our experienced family medicine practitioners.
                </p>
              </div>

              <div className="glass-panel p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Microscope className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-heading mb-3">Diagnostic Laboratory</h3>
                <p className="text-muted leading-relaxed">
                  State-of-the-art laboratory facilities providing accurate and timely test results to aid in precise medical diagnoses.
                </p>
              </div>

              <div className="glass-panel p-8 rounded-xl shadow-sm">
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
                    <div key={doc.id} className="glass-panel w-full sm:w-[280px] rounded-xl p-0 overflow-hidden flex flex-col group">
                      <Link href={`/doctors/${doc.id}`} className="h-48 relative bg-surface overflow-hidden flex items-center justify-center border-b border-border/30 cursor-pointer block">
                        {doc.avatarUrl ? (
                          <img src={doc.avatarUrl} alt={`Dr. ${cleanName}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <span className="text-4xl font-extrabold text-primary/45">{initials}</span>
                        )}
                        <div className="absolute top-4 right-4 bg-card/85 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 font-bold text-[10px] text-primary border border-border/50 shadow-sm">
                          ★ 4.9
                        </div>
                      </Link>
                      <div className="p-6 flex-grow flex flex-col text-left">
                        <span className="text-secondary font-semibold text-xs mb-1.5 block uppercase tracking-wider">{doc.specialization}</span>
                        <Link href={`/doctors/${doc.id}`} className="hover:text-primary transition-colors">
                          <h3 className="font-bold text-lg text-heading mb-2 line-clamp-1" title={`Dr. ${cleanName}`}>Dr. {cleanName}</h3>
                        </Link>
                        <p className="text-xs text-muted mb-4 line-clamp-2">Experienced specialist dedicated to comprehensive clinical care and diagnostics.</p>
                        <div className="flex flex-col gap-2 mt-auto">
                          <Link href={`/doctors/${doc.id}`} className="w-full text-center border border-border text-heading py-2 rounded-lg font-semibold text-xs hover:bg-hover transition-colors">
                            View Profile
                          </Link>
                          <Link href="/register" className="w-full text-center bg-primary text-white py-2 rounded-lg font-semibold text-xs hover:bg-primary-hover transition-colors">
                            Book Appointment
                          </Link>
                        </div>
                      </div>
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
                {activeLabTests.map((test, index) => (
                  <div key={test.id} className={`glass-panel rounded-xl overflow-hidden p-0 border-t-4 transition-all duration-300 flex flex-col group ${
                    index % 4 === 0 ? 'border-t-primary' :
                    index % 4 === 1 ? 'border-t-secondary' :
                    index % 4 === 2 ? 'border-t-warning' :
                    'border-t-info'
                  }`}>
                    {/* Card Image Header */}
                    <div className="h-44 relative bg-surface overflow-hidden flex items-center justify-center border-b border-border/30">
                      {test.image_url ? (
                        <img 
                          src={test.image_url} 
                          alt={test.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Microscope className="w-12 h-12 text-primary/40" />
                        </div>
                      )}
                      {test.doctor_order_required && (
                        <div className="absolute top-3 left-3 bg-danger/15 text-danger border border-danger/25 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase backdrop-blur-sm">
                          Doctor Order Req.
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-grow flex flex-col">
                      <h3 className="font-bold text-heading text-lg leading-tight mb-2 line-clamp-1" title={test.name}>{test.name}</h3>
                      <p className="text-sm text-muted mb-4 line-clamp-2">{test.description}</p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30">
                        <span className="inline-block px-2.5 py-1 bg-surface border border-border text-heading rounded-md font-semibold text-xs">
                          ${test.price.toFixed(2)}
                        </span>
                        {test.doctor_order_required ? (
                          <span className="text-xs font-semibold text-muted flex items-center gap-1">
                            Requires Doctor Order
                          </span>
                        ) : (
                          <Link href="/register" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 group">
                            Book Test <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                          </Link>
                        )}
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
                <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 overflow-hidden">
                  <img src="/favicon.png" alt="ClinicFlow Logo" className="w-full h-full object-contain" />
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
                <li><Link href="/" className="text-muted hover:text-primary transition-colors">Home</Link></li>
                <li><Link href="/about" className="text-muted hover:text-primary transition-colors">About Us</Link></li>
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalBusiness",
            "name": "ClinicFlow Medical Center",
            "url": "https://clinicflow.vercel.app",
            "logo": "https://clinicflow.vercel.app/favicon.png",
            "description": "Secure, role-based, multi-user clinic management workflow platform.",
            "medicalSpecialty": ["GeneralPractice", "DiagnosticServices"],
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "123 Health Ave",
              "addressLocality": "Medical City",
              "addressCountry": "US"
            }
          }),
        }}
      />
    </div>
  );
}
