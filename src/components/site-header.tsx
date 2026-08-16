import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import { AccountChip } from "@/components/account-chip";
import { cn } from "@/lib/utils";

const links = [
  { to: "/atlas" as const, label: "Atlas" },
  { to: "/studio" as const, label: "Research" },
  { to: "/adapter" as const, label: "Operations" },
  { to: "/method" as const, label: "Method" },
];

export function SiteHeader({ solid = false }: { solid?: boolean }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-line/80",
        solid ? "bg-bg" : "bg-bg/80 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="text-fg">
          <BrandMark />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-muted transition-colors hover:text-fg"
              activeProps={{ className: "text-fg" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/atlas"
            className="hidden h-9 items-center rounded-sm bg-accent px-3 text-sm font-medium text-accent-fg sm:inline-flex"
          >
            Open Atlas
          </Link>
          <AccountChip />
        </div>
      </div>
    </header>
  );
}
