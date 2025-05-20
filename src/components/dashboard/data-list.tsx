import { cn } from "@/lib/utils";

interface DataListProps {
  items: Array<{ label: string; value: React.ReactNode }>;
  className?: string;
}

export function DataList({ items, className }: DataListProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="flex justify-between items-center pb-2 border-b last:border-0"
        >
          <span className="text-sm text-muted-foreground">{item.label}</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

interface DataListCardProps {
  title: string;
  items: Array<{ label: string; value: React.ReactNode }>;
  className?: string;
}

export function DataListCard({ title, items, className }: DataListCardProps) {
  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <div className="bg-muted px-4 py-3 border-b">
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="p-4">
        <DataList items={items} />
      </div>
    </div>
  );
}
