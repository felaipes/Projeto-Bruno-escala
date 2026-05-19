"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, ChevronRight } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/equipe", label: "Equipe", icon: Users },
  { href: "/escalas", label: "Escalas", icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-[#0D0D0D] border-r border-[#1E1E1E] flex flex-col shrink-0">
      <div className="px-5 py-6 border-b border-[#1E1E1E]">
        <span className="text-xl font-extrabold text-white tracking-tight">
          Escala Certa<span className="text-[#FF4D1C]">.net</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                active
                  ? "bg-[#FF4D1C]/10 text-[#FF4D1C] border border-[#FF4D1C]/20"
                  : "text-[#A1A1A1] hover:bg-[#1A1A1A] hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-[#1E1E1E]">
        <p className="text-xs text-[#555]">v2.0 · Motor de Escalas</p>
      </div>
    </aside>
  );
}
