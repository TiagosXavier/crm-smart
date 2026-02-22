import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Kanban,
  FileText,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Conversas', icon: MessageSquare, page: 'Conversations', showBadge: true },
  { name: 'Contatos', icon: Users, page: 'Contacts' },
  { name: 'Pipeline', icon: Kanban, page: 'Pipeline' },
  { name: 'Templates', icon: FileText, page: 'Templates', roles: ['admin', 'supervisor'] },
  { name: 'Equipe', icon: UserCog, page: 'Team', roles: ['admin', 'supervisor'] },
  { name: 'AI Agents', icon: Sparkles, page: 'AiAgents' },
  { name: 'Configurações', icon: Settings, page: 'Settings' },
];

export default function Sidebar({ collapsed, setCollapsed, currentPage, userRole }) {
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => api.entities.Contact.list(),
  });

  const unreadCount = contacts.filter(c => c.status === 'novo' || c.status === 'em_atendimento').length;

  const filteredItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">CRM Smart</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {filteredItems.map((item) => {
            const isActive = currentPage === item.page;
            const Icon = item.icon;

            const menuButton = (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="font-medium">{item.name}</span>
                    {item.showBadge && unreadCount > 0 && (
                      <span className="ml-auto bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.showBadge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.page}>
                  <TooltipTrigger asChild>
                    {menuButton}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return menuButton;
          })}
        </TooltipProvider>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
            <p className="text-xs text-muted-foreground">Versão 1.0.0</p>
            <p className="text-xs text-primary mt-1">CRM Inteligente</p>
          </div>
        </div>
      )}
    </aside>
  );
}