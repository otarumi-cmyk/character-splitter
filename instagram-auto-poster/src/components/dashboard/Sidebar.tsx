"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  Layout,
  Hash,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    label: "New Post",
    href: "/posts/new",
    icon: PlusCircle,
  },
  {
    label: "Templates",
    href: "/templates",
    icon: Layout,
  },
  {
    label: "Hashtag Sets",
    href: "/hashtags",
    icon: Hash,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 border-r border-border bg-card h-screen sticky top-0 flex flex-col">
      {/* Logo / Brand */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            IG
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground leading-tight">
              Instagram
            </h1>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Auto Poster
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>System Ready</span>
        </div>
      </div>
    </aside>
  );
}
