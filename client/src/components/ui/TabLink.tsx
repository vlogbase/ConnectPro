import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface TabLinkProps {
  href: string;
  isActive?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function TabLink({ href, isActive = false, children, className }: TabLinkProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
          isActive 
            ? "border-primary text-gray-900" 
            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
          className
        )}
      >
        {children}
      </a>
    </Link>
  );
}
