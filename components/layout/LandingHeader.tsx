"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { Menu, X } from "lucide-react";

interface LandingHeaderProps {
  userDashboard: string | null;
  userName: string;
  currentPath: string;
}

export function LandingHeader({
  userDashboard,
  userName,
  currentPath,
}: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to check if link is active
  const isActive = (path: string) => currentPath === path;

  // Render navigation links dynamically
  const navLinks = [
    { name: "Home", href: currentPath === "/about" ? "/" : "/" },
    { name: "Our Services", href: currentPath === "/about" ? "/#services" : "#services" },
    { name: "Specialists", href: currentPath === "/about" ? "/#specialists" : "#specialists" },
    { name: "Diagnostics", href: currentPath === "/about" ? "/#diagnostics" : "#diagnostics" },
    { name: "About Us", href: "/about" },
  ];

  return (
    <>
      {/* ── DESKTOP HEADER ────────────────────────────────── */}
      <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary flex items-center justify-center shrink-0 font-extrabold text-white text-lg sm:text-xl">
              C
            </div>
            <div>
              <span className="font-bold text-lg sm:text-xl text-heading tracking-tight block leading-none">
                ClinicFlow
              </span>
              <span className="text-[11px] font-medium text-muted uppercase tracking-wider hidden sm:block mt-1">
                Medical Center
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-semibold transition-colors ${
                  isActive(link.href)
                    ? "text-primary"
                    : "text-muted hover:text-primary"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Actions & Hamburger Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-4 lg:gap-5">
            <ThemeToggle />

            {/* User Session Actions */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-4">
              {userDashboard ? (
                <>
                  <span className="text-sm text-muted hidden xl:inline whitespace-nowrap">
                    Welcome back, <strong className="text-heading font-semibold">{userName}</strong>
                  </span>
                  <Link
                    href={userDashboard}
                    className="bg-primary hover:bg-primary-hover text-white px-3.5 py-2 rounded-md text-xs sm:text-sm sm:px-5 sm:py-2.5 font-semibold transition-colors shadow-sm whitespace-nowrap"
                  >
                    Dashboard
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <Link
                  href="/register"
                  className="text-sm font-semibold text-heading hover:text-primary transition-colors px-3 py-2"
                >
                  Sign up
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg border border-border bg-card/60 hover:bg-hover active:scale-95 transition-all flex items-center justify-center text-heading cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE SIDEBAR DRAWER ─────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="absolute inset-0 bg-overlay backdrop-blur-sm"
        />

        {/* Sliding Panel */}
        <aside
          className={`absolute top-0 right-0 h-full w-72 max-w-full bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between transition-transform duration-300 transform ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Top Panel Header */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg text-heading">Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg border border-border bg-hover flex items-center justify-center text-muted hover:text-heading cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Vertical Link Navigation */}
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base font-semibold py-2 px-3 rounded-lg hover:bg-hover transition-colors ${
                    isActive(link.href)
                      ? "text-primary bg-primary/5"
                      : "text-muted hover:text-heading"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom Actions Area */}
          <div className="border-t border-border pt-6 mt-auto space-y-4">
            {userDashboard ? (
              <div className="flex flex-col gap-3">
                <span className="text-xs text-muted">
                  Logged in as <strong className="text-heading block truncate mt-0.5">{userName}</strong>
                </span>
                <Link
                  href={userDashboard}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-md text-sm font-semibold transition-colors shadow-sm text-center"
                >
                  Dashboard
                </Link>
                <div className="w-full flex justify-center border-t border-border/50 pt-2">
                  <LogoutButton />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-hover text-heading py-2.5 rounded-md text-sm font-semibold transition-colors text-center border border-border"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-md text-sm font-semibold transition-colors text-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
