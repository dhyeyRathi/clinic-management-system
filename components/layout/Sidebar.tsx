"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
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
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className={`relative flex flex-col h-screen bg-surface border-r border-border transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Collapse Toggle Button */}
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

      {/* Logo / Brand */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b border-border ${
          collapsed ? "justify-center px-2" : ""
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-heading font-semibold text-sm leading-tight truncate">
              ClinicFlow
            </p>
            <p className="text-muted text-xs truncate">Management Portal</p>
          </div>
        )}
      </div>

      {/* Role Badge */}
      {!collapsed && (
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
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-body hover:bg-hover hover:text-heading"
              } ${collapsed ? "justify-center px-2" : ""}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? "text-primary" : "text-muted group-hover:text-heading"
                }`}
              />
              {!collapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="ml-auto text-xs bg-danger/15 text-danger px-1.5 py-0.5 rounded-full font-semibold">
                  {item.badge}
                </span>
              )}
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 w-0.5 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: User + Actions */}
      <div className="border-t border-border p-3 space-y-2">
        {/* Theme Toggle */}
        <div className={`flex ${collapsed ? "justify-center" : "justify-end"}`}>
          <ThemeToggle />
        </div>

        {/* User Info + Logout */}
        <div
          className={`flex items-center gap-2 ${
            collapsed ? "flex-col" : ""
          }`}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-primary font-semibold text-xs uppercase">
              {userName.charAt(0)}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-heading text-xs font-medium truncate">
                {userName}
              </p>
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
    </aside>
  );
}
