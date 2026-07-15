"use client";

import { Sidebar, NavItem } from "@/components/layout/Sidebar";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  User,
  Users,
} from "lucide-react";

const doctorNavItems: NavItem[] = [
  { label: "Overview",       href: "/doctor",              icon: LayoutDashboard },
  { label: "Patients",       href: "/doctor/patients",      icon: Users },
  { label: "Appointments",   href: "/doctor/appointments",  icon: CalendarDays },
  { label: "Clinical Reports", href: "/doctor/reports",       icon: FileText },
  { label: "My Profile",     href: "/doctor/profile",       icon: User },
];

interface DoctorSidebarProps {
  userName?: string;
  userEmail?: string;
}

export function DoctorSidebar({ userName, userEmail }: DoctorSidebarProps) {
  return (
    <Sidebar
      navItems={doctorNavItems}
      roleLabel="Doctor"
      roleBadgeColor="bg-sky-500/15 text-sky-500"
      userName={userName}
      userEmail={userEmail}
    />
  );
}
