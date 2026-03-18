import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { useTheme } from '@/components/ui/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createPageUrl } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sun, Moon, LogOut, User, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationsPanel from './NotificationsPanel';

const statusColors = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  offline: 'bg-slate-500',
};

const statusLabels = {
  online: 'Online',
  away: 'Ausente',
  offline: 'Offline',
};

export default function Header({ user, collapsed }) {
  const { theme, toggleTheme } = useTheme();
  const [status, setStatus] = useState(user?.status || 'online');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await api.auth.updateMe({ status: newStatus });
      setStatus(newStatus);
    } catch (error) {
      // Status update failed silently
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    api.auth.logout();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      user: 'Atendente',
    };
    return roles[role] || role;
  };

  return (
    <header className={cn(
      "fixed top-0 right-0 z-30 h-16 bg-card/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-6 transition-all duration-300",
      collapsed ? "left-16" : "left-64"
    )}>
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-foreground hidden md:block">
          Bem-vindo, {user?.full_name?.split(' ')[0] || 'Usuário'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Status Selector */}
        <Select value={status} onValueChange={handleStatusChange} disabled={isUpdating}>
          <SelectTrigger className="w-32 bg-background border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-foreground hover:bg-accent">
                <div className="flex items-center gap-2">
                  <Circle className={cn("w-2 h-2 fill-current", statusColors[value].replace('bg-', 'text-'))} />
                  {label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Notifications */}
        <NotificationsPanel />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user?.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                statusColors[status]
              )} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-popover border-border" align="end">
            <DropdownMenuLabel className="text-foreground">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-primary">{getRoleLabel(user?.role)}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="text-foreground hover:bg-accent cursor-pointer">
              <Link to={createPageUrl('Profile')} className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-rose-400 hover:text-rose-300 hover:bg-accent cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}