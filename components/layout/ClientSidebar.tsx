"use client";

import { Sidebar, NavItem } from "@/components/layout/Sidebar";
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  FlaskConical,
  User,
  Stethoscope,
  FileText,
} from "lucide-react";

const clientNavItems: NavItem[] = [
  { label: "Overview",         href: "/client",              icon: LayoutDashboard },
  { label: "Book a Doctor",    href: "/client/doctors",      icon: Stethoscope },
  { label: "Appointments",     href: "/client/appointments", icon: CalendarDays },
  { label: "Invoices",         href: "/client/invoices",     icon: Receipt },
  { label: "My Reports",       href: "/client/reports",      icon: FileText },
  { label: "Lab Tests",        href: "/client/lab-tests",    icon: FlaskConical },
  { label: "My Profile",       href: "/client/profile",      icon: User },
];

interface ClientSidebarProps {
  userName?: string;
  userEmail?: string;
}

export function ClientSidebar({ userName, userEmail }: ClientSidebarProps) {
  return (
    <Sidebar
      navItems={clientNavItems}
      roleLabel="Patient"
      roleBadgeColor="bg-primary/15 text-primary"
      userName={userName}
      userEmail={userEmail}
    />
  );
}
