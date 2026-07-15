"use client";

import { Sidebar, NavItem } from "@/components/layout/Sidebar";
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  Boxes,
  Receipt,
  BarChart3,
  ScrollText,
  User,
} from "lucide-react";

const managerNavItems: NavItem[] = [
  { label: "Overview",       href: "/manager",           icon: LayoutDashboard },
  { label: "Staff",          href: "/manager/staff",     icon: Users },
  { label: "Lab Tests",      href: "/manager/lab-tests", icon: FlaskConical },
  { label: "Resources",      href: "/manager/resources", icon: Boxes },
  { label: "Finance",        href: "/manager/finance",   icon: Receipt },
  { label: "Analytics",      href: "/manager/analytics", icon: BarChart3 },
  { label: "Audit Logs",     href: "/manager/logs",      icon: ScrollText },
  { label: "My Profile",     href: "/manager/profile",   icon: User },
];

interface ManagerSidebarProps {
  userName?: string;
  userEmail?: string;
}

export function ManagerSidebar({ userName, userEmail }: ManagerSidebarProps) {
  return (
    <Sidebar
      navItems={managerNavItems}
      roleLabel="Manager"
      roleBadgeColor="bg-violet-500/15 text-violet-500"
      userName={userName}
      userEmail={userEmail}
    />
  );
}
