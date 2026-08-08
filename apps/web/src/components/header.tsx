import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { NavLink } from "./nav-link";
import { KodanLogo } from "./kodan-logo";

const HEADER_LINKS = [
  { href: "/desafios", label: "Desafios" },
] as const;

export default function Header() {
  return (
    <header data-app-header="true" className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/30 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-5">
        {/* Brand Logo */}
        <Link
          href="/"
          className="text-foreground transition-opacity hover:opacity-85"
        >
          <KodanLogo size="sm" />
        </Link>
        {/* Thin vertical divider */}
        <div className="h-4 w-[1px] bg-border/40" />
        {/* Navigation Links */}
        <nav className="flex items-center gap-6 font-mono text-[13px] tracking-wide select-none">
          {HEADER_LINKS.map(({ href, label }) => (
            <NavLink key={href} href={href}>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

