import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { isExternal } from "~/lib/ui";

/** Link that works for both internal routes (set in the dashboard) and external URLs. */
export function SiteLink({
  to,
  className,
  children,
  onClick,
}: {
  to: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  if (!to) return <span className={className}>{children}</span>;
  if (isExternal(to)) {
    const newTab = to.startsWith("http");
    return (
      <a href={to} className={className} onClick={onClick} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return (
    // Paths come from editable settings, so they're not statically typed routes.
    <Link to={to as "/"} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
