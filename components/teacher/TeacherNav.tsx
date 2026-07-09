"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutTeacher } from "@/app/teacher/actions";

const links = [
  { href: "/teacher/curriculum", label: "Μαθήματα", match: "/teacher/curriculum" },
  { href: "/teacher", label: "Βαθμολόγιο", match: "/teacher" },
  { href: "/teacher/students", label: "Μαθητές", match: "/teacher/students" },
] as const;

function isActive(pathname: string, match: string) {
  if (match === "/teacher") {
    return pathname === "/teacher";
  }
  return pathname.startsWith(match);
}

export function TeacherNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6 text-sm text-zinc-500">
      {links.map((link) => {
        const active = isActive(pathname, link.match);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={[
              "transition-colors hover:text-zinc-900",
              active ? "text-zinc-900" : "",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
      <form action={logoutTeacher}>
        <button type="submit" className="transition-colors hover:text-zinc-900">
          Έξοδος
        </button>
      </form>
    </nav>
  );
}
