"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface SidebarProps {
  navItems: NavItem[];
  roleLabel: string;
  roleBadgeColor?: string;
  userName?: string;
  userEmail?: string;
}

export function Sidebar({
  navItems,
  roleLabel,
  roleBadgeColor = "bg-primary/15 text-primary",
  userName = "Admin",
  userEmail,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const navContent = (isMobile = false) => (
    <>
      {/* Logo / Brand */}
      <Link
        href="/"
        className={`flex items-center gap-3 px-4 py-5 border-b border-border hover:bg-hover/30 transition-colors ${
          !isMobile && collapsed ? "justify-center px-2" : ""
        }`}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/favicon.png" alt="ClinicFlow Logo" className="w-full h-full object-contain" />
        </div>
        {(isMobile || !collapsed) && (
          <div className="overflow-hidden flex-1">
            <p className="text-heading font-semibold text-sm leading-tight truncate">
              ClinicFlow
            </p>
            <p className="text-muted text-xs truncate">Management Portal</p>
          </div>
        )}
        {isMobile && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMobileOpen(false);
            }}
            className="ml-auto p-1 rounded-lg hover:bg-hover text-muted hover:text-heading transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </Link>

      {/* Role Badge */}
      {(isMobile || !collapsed) && (
        <div className="px-4 pt-4">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleBadgeColor}`}
          >
            {roleLabel}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isBaseDashboard =
            item.href === "/manager" ||
            item.href === "/client" ||
            item.href === "/doctor" ||
            item.href === "/receptionist" ||
            item.href === "/lab-manager";

          const isActive = isBaseDashboard
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={!isMobile && collapsed ? item.label : undefined}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-body hover:bg-hover hover:text-heading"
              } ${!isMobile && collapsed ? "justify-center px-2" : ""}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? "text-primary" : "text-muted group-hover:text-heading"
                }`}
              />
              {(isMobile || !collapsed) && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {(isMobile || !collapsed) && item.badge && (
                <span className="ml-auto text-xs bg-danger/15 text-danger px-1.5 py-0.5 rounded-full font-semibold">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute left-0 w-0.5 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: User + Actions */}
      <div className="border-t border-border p-3 space-y-2">
        <div className={`flex ${!isMobile && collapsed ? "justify-center" : "justify-end"}`}>
          <ThemeToggle />
        </div>
        <div
          className={`flex items-center gap-2 ${
            !isMobile && collapsed ? "flex-col" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-primary font-semibold text-xs uppercase">
              {userName.charAt(0)}
            </span>
          </div>
          {(isMobile || !collapsed) && (
            <div className="flex-1 min-w-0">
              <p className="text-heading text-xs font-medium truncate">{userName}</p>
              {userEmail && (
                <p className="text-muted text-xs truncate">{userEmail}</p>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-8 h-8 rounded-lg hover:bg-danger/10 flex items-center justify-center text-muted hover:text-danger transition-colors shrink-0 cursor-pointer"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── MOBILE TOP BAR ─────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-surface border-b border-border print:hidden">
        <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="text-heading font-semibold text-sm">ClinicFlow</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-hover text-muted hover:text-heading transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── MOBILE DRAWER OVERLAY ──────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onClick={() => setMobileOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-overlay/60 backdrop-blur-sm" />
          {/* Drawer */}
          <aside
            className="relative flex flex-col w-72 max-w-[85vw] h-full bg-surface border-r border-border shadow-2xl animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent(true)}
          </aside>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ────────────────────────────────── */}
      <aside
        className={`hidden md:flex relative flex-col h-screen bg-surface border-r border-border transition-all duration-300 ease-in-out shrink-0 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm hover:bg-hover transition-colors cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-muted" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-muted" />
          )}
        </button>

        {navContent(false)}
      </aside>
    </>
  );
}

