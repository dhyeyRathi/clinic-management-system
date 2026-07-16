import Link from "next/link";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { createClient } from "@/lib/supabase/server";
import {
  Stethoscope,
  Microscope,
  CheckCircle2,
  Award,
  Users,
  Building
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | ClinicFlow Medical Center",
  description: "Learn about ClinicFlow's mission, our values, our state-of-the-art facilities, and our dedication to delivering exceptional patient-centric healthcare.",
};

export default async function AboutPage() {
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

  return (
    <div className="min-h-screen bg-background text-body flex flex-col font-sans selection:bg-primary selection:text-white relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="glow-bg glow-1"></div>
      <div className="glow-bg glow-2"></div>

      {/* ── HEADER ────────────────────────────────────────── */}
      <LandingHeader userDashboard={userDashboard} userName={userName} currentPath="/about" />

      <main className="flex-grow">
        {/* ── HERO SECTION ───────────────────────────────────── */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-20 md:py-28 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent -z-10" />
          
          <h1 id="about-heading" className="text-4xl md:text-5xl font-extrabold text-heading tracking-tight max-w-3xl leading-tight mb-6">
            Empowering Healthier Communities Through <span className="text-primary bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">Excellence & Care</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl leading-relaxed mb-8">
            At ClinicFlow, we blend state-of-the-art medical diagnostics with patient-first compassion. Our goal is to streamline healthcare workflows so that patients get the attention they deserve when they need it most.
          </p>
        </section>

        {/* ── STATS SECTION ──────────────────────────────────── */}
        <section className="bg-surface border-y border-border py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-extrabold text-heading">15,000+</div>
                <div className="text-sm font-semibold text-muted uppercase tracking-wider">Patients Served</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-extrabold text-heading">45+</div>
                <div className="text-sm font-semibold text-muted uppercase tracking-wider">Medical Specialists</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-extrabold text-heading">99.8%</div>
                <div className="text-sm font-semibold text-muted uppercase tracking-wider">Diagnostic Accuracy</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-extrabold text-heading">10+ Years</div>
                <div className="text-sm font-semibold text-muted uppercase tracking-wider">Community Service</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CORE VALUES ────────────────────────────────────── */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-heading mb-4">Our Core Pillars</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              These principles guide every patient interaction, diagnostic scan, and care decision we make.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border border-border p-8 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-heading mb-3">Clinical Integrity</h3>
              <p className="text-muted leading-relaxed">
                We maintain the highest standards of diagnostic quality, medical safety, and evidence-based treatment plans.
              </p>
            </div>

            <div className="bg-card border border-border p-8 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-heading mb-3">Patient Compassion</h3>
              <p className="text-muted leading-relaxed">
                Healthcare is personal. We treat every individual with empathy, dignity, and personalized, respectful care.
              </p>
            </div>

            <div className="bg-card border border-border p-8 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Microscope className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-heading mb-3">Modern Technology</h3>
              <p className="text-muted leading-relaxed">
                By integrating smart portals and modern lab integrations, we reduce administration overhead so doctors can focus on patients.
              </p>
            </div>
          </div>
        </section>

        {/* ── FACILITY SECTION ───────────────────────────────── */}
        <section className="bg-surface border-y border-border py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                <Building className="w-3.5 h-3.5" />
                State-of-the-Art Care
              </div>
              <h2 className="text-3xl font-bold text-heading leading-tight">
                Our Certified Modern Healthcare Facility
              </h2>
              <p className="text-muted leading-relaxed">
                Our clinic houses on-site pathology laboratories, custom cardiology diagnostics, specialist screening wings, and emergency observation spaces. Every area is designed to maximize patient comfort and care efficiency.
              </p>
              <ul className="space-y-3.5">
                <li className="flex items-center gap-3 text-muted text-sm">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  ISO 9001 Certified Laboratories
                </li>
                <li className="flex items-center gap-3 text-muted text-sm">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  Fully-integrated electronic health records (EHR) system
                </li>
                <li className="flex items-center gap-3 text-muted text-sm">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  24/7 Digital scheduling and notification services
                </li>
              </ul>
            </div>
            
            <div className="relative aspect-video rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 border border-border p-6 flex flex-col justify-between overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] -z-10" />
              <div className="flex justify-between items-start">
                <Award className="w-12 h-12 text-primary" />
                <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-1 rounded border border-primary/20">
                  ESTD. 2016
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-heading text-lg mb-1 text-base">ClinicFlow HQ</h3>
                <p className="text-xs text-muted">100 Health Science Parkway, Suite A, Medical Center</p>
              </div>
            </div>
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
                <li><Link href="/#services" className="text-muted hover:text-primary transition-colors">Our Services</Link></li>
                <li><Link href="/#specialists" className="text-muted hover:text-primary transition-colors">Find a Doctor</Link></li>
                <li><Link href="/#diagnostics" className="text-muted hover:text-primary transition-colors">Lab Tests</Link></li>
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
            "name": "ClinicFlow Medical Center - About Us",
            "url": "https://clinicflow.vercel.app/about",
            "logo": "https://clinicflow.vercel.app/favicon.png",
            "description": "Excellence in clinic management workflows and modern clinical diagnostics.",
            "medicalSpecialty": ["GeneralPractice", "DiagnosticServices"]
          }),
        }}
      />
    </div>
  );
}
