"use client";

import { Sidebar, NavItem } from "@/components/layout/Sidebar";
import {
  LayoutDashboard,
  FlaskConical,
  Boxes,
  User,
  FileText,
} from "lucide-react";

const labManagerNavItems: NavItem[] = [
  { label: "Overview",       href: "/lab-manager",           icon: LayoutDashboard },
  { label: "Lab Test Catalog", href: "/lab-manager/tests",     icon: FlaskConical },
  { label: "Resources",      href: "/lab-manager/resources", icon: Boxes },
  { label: "Lab Reports",      href: "/lab-manager/reports",   icon: FileText },
  { label: "My Profile",     href: "/lab-manager/profile",   icon: User },
];

interface LabManagerSidebarProps {
  userName?: string;
  userEmail?: string;
}

export function LabManagerSidebar({ userName, userEmail }: LabManagerSidebarProps) {
  return (
    <Sidebar
      navItems={labManagerNavItems}
      roleLabel="Lab Manager"
      roleBadgeColor="bg-sky-500/15 text-sky-500"
      userName={userName}
      userEmail={userEmail}
    />
  );
}
