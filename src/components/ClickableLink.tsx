import Link from "next/link";
import { ReactNode } from "react";

interface ClickableLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  [key: string]: any;
}

export default function ClickableLink({ href, className, children, ...props }: ClickableLinkProps) {
  return (
    <Link 
      href={href} 
      className={className}
      style={{ cursor: 'pointer' }}
      {...props}
    >
      {children}
    </Link>
  );
}