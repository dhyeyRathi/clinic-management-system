import React from "react";
import RegistrationForm from "./components/RegistrationForm";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Register - Clinic Management System",
  description: "Join the Clinic Management System to schedule appointments and manage your health records.",
};

const RegisterPage = () => {
  return (
    <main className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Background Decorative Blob Elements for Glassmorphic glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse duration-[8000ms]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-secondary/15 rounded-full blur-[120px] -z-10 animate-pulse duration-[6000ms]"></div>

      {/* Brand Logo Header */}
      <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 font-extrabold text-2xl">
          C
        </div>
        <div>
          <h1 className="text-xl font-bold text-heading leading-tight tracking-tight">
            ClinicFlow
          </h1>
          <span className="text-muted text-xs font-semibold uppercase tracking-wider">
            Medical Portal
          </span>
        </div>
      </div>

      {/* Registration Form Component */}
      <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <RegistrationForm />
      </div>
    </main>
  );
};

export default RegisterPage;