import { cn } from "@/lib/utils";
import { filingSectionClassName } from "@/lib/filing/action-meta";

type FilingSectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function FilingSection({ title, children, className }: FilingSectionProps) {
  return (
    <div className={cn(filingSectionClassName, className)}>
      <p className="font-medium">{title}</p>
      {children}
    </div>
  );
}
