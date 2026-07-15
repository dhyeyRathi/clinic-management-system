"use client";

import { Sidebar, NavItem } from "@/components/layout/Sidebar";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Receipt,
  Boxes,
  User,
} from "lucide-react";

const receptionistNavItems: NavItem[] = [
  { label: "Overview",       href: "/receptionist",              icon: LayoutDashboard },
  { label: "Clients",        href: "/receptionist/clients",       icon: Users },
  { label: "Appointments",   href: "/receptionist/appointments",  icon: CalendarDays },
  { label: "Billing Desk",   href: "/receptionist/invoices",      icon: Receipt },
  { label: "Resources",      href: "/receptionist/resources",     icon: Boxes },
  { label: "My Profile",     href: "/receptionist/profile",      icon: User },
];

interface ReceptionistSidebarProps {
  userName?: string;
  userEmail?: string;
}

export function ReceptionistSidebar({ userName, userEmail }: ReceptionistSidebarProps) {
  return (
    <Sidebar
      navItems={receptionistNavItems}
      roleLabel="Receptionist"
      roleBadgeColor="bg-emerald-500/15 text-emerald-500"
      userName={userName}
      userEmail={userEmail}
    />
  );
}
