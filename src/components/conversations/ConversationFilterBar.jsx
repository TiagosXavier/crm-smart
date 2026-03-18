import React from "react";
import { cn } from "@/lib/utils";
import { Mail, MessagesSquare, Clock, Star } from "lucide-react";

const filters = [
  { id: "unread", label: "Não lidos", icon: Mail },
  { id: "all", label: "Todos", icon: MessagesSquare },
  { id: "recents", label: "Recentes", icon: Clock },
  { id: "starred", label: "Favoritados", icon: Star },
];

export default function ConversationFilterBar({
  activeFilter,
  onFilterChange,
}) {
  return (
    <div className="bg-background border-b border-border">
      <nav className="flex space-x-2" aria-label="Filters">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "flex flex-col items-center justify-center h-16 w-24 px-1 text-muted-foreground hover:text-primary focus:outline-none transition-colors duration-200",
                isActive ? "text-primary" : "",
              )}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{filter.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-full h-0.5 bg-primary"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
