import React from "react";
import LoginForm from "./components/LoginForm";
import { HeartPulse } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Login - Clinic Management System",
  description: "Sign in to the Clinic Management System to access your health portal.",
};

const LoginPage = () => {
  return (
    <main className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Ambient background blur blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse duration-[8000ms]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-secondary/15 rounded-full blur-[120px] -z-10 animate-pulse duration-[6000ms]"></div>

      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="w-12 h-12 bg-primary text-white dark:text-background rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
          <HeartPulse className="w-7 h-7" />
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

      {/* Login Form Wrapper */}
      <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <LoginForm />
      </div>
    </main>
  );
};

export default LoginPage;