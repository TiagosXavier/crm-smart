import React, { useState } from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPageUrl } from "@/utils";
import MetricsCard from "../components/dashboard/MetricsCard";
import AgentsOnlineDialog from "../components/dashboard/AgentsOnlineDialog";
import ActiveTemplatesDialog from "../components/dashboard/ActiveTemplatesDialog";
import TodayConversationsDialog from "../components/dashboard/TodayConversationsDialog";
import ExportReportDialog from "../components/dashboard/ExportReportDialog";
import PerformanceChart from "../components/dashboard/PerformanceChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserCheck,
  MessageSquare,
  Clock,
  Phone,
  Filter,
  X,
  FileDown,
  Target,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    agent: "all",
    chartType: "area",
  });
  const [activeFilters, setActiveFilters] = useState({
    dateFrom: "",
    dateTo: "",
    agent: "all",
    chartType: "area",
  });
  const [showAgentsDialog, setShowAgentsDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [showConversationsDialog, setShowConversationsDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => api.entities.Contact.list("-created_date", 100),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.entities.User.list(),
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => api.entities.Template.list(),
  });

  const applyFilters = () => {
    setActiveFilters({ ...filters });
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      agent: "all",
      chartType: "area",
    });
    setActiveFilters({
      dateFrom: "",
      dateTo: "",
      agent: "all",
      chartType: "area",
    });
  };

  // Apply filters to contacts
  const filteredContacts = contacts.filter((contact) => {
    if (contact.created_date) {
      const contactDate = new Date(contact.created_date);

      if (activeFilters.dateFrom) {
        const fromDate = new Date(activeFilters.dateFrom);
        if (contactDate < fromDate) return false;
      }

      if (activeFilters.dateTo) {
        const toDate = new Date(activeFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (contactDate > toDate) return false;
      }
    }

    if (
      activeFilters.agent !== "all" &&
      contact.assigned_to !== activeFilters.agent
    ) {
      return false;
    }
    return true;
  });

  const activeUsers = users.filter(
    (u) => u.status === "online" && u.is_active !== false,
  );
  const recentContacts = filteredContacts.slice(0, 5);
  const isLoading = contactsLoading || usersLoading || templatesLoading;

  // Calculate real metrics
  const today = new Date();
  const thisMonth = filteredContacts.filter((c) => {
    if (!c.created_date) return false;
    const date = new Date(c.created_date);
    return (
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  });

  const lastMonth = contacts.filter((c) => {
    if (!c.created_date) return false;
    const date = new Date(c.created_date);
    const lastMonthDate = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );
    return (
      date.getMonth() === lastMonthDate.getMonth() &&
      date.getFullYear() === lastMonthDate.getFullYear()
    );
  });

  const resolved = filteredContacts.filter((c) => c.status === "resolvido");
  const conversionRate =
    filteredContacts.length > 0
      ? ((resolved.length / filteredContacts.length) * 100).toFixed(1)
      : 0;
  const monthGrowth =
    lastMonth.length > 0
      ? (
          ((thisMonth.length - lastMonth.length) / lastMonth.length) *
          100
        ).toFixed(1)
      : 0;

  // Generate weekly data
  const getWeeklyData = () => {
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const data = weekDays.map((name, index) => {
      const count = filteredContacts.filter((c) => {
        if (!c.created_date) return false;
        const date = new Date(c.created_date);
        const daysAgo = Math.floor((today - date) / (1000 * 60 * 60 * 24));
        const dayOfWeek = date.getDay();
        return daysAgo < 7 && dayOfWeek === index;
      }).length;
      return { name, value: count };
    });
    return data;
  };

  const conversationsData = getWeeklyData();

  // Category distribution
  const categoryData = [
    {
      name: "Novo",
      value: filteredContacts.filter((c) => c.status === "novo").length,
      color: "#3b82f6",
    },
    {
      name: "Em Atendimento",
      value: filteredContacts.filter((c) => c.status === "em_atendimento")
        .length,
      color: "#f59e0b",
    },
    {
      name: "Resolvido",
      value: filteredContacts.filter((c) => c.status === "resolvido").length,
      color: "#10b981",
    },
    {
      name: "Outros",
      value: filteredContacts.filter(
        (c) => !["novo", "em_atendimento", "resolvido"].includes(c.status),
      ).length,
      color: "#64748b",
    },
  ].filter((item) => item.value > 0);

  const avgResponseTime = "2.5"; // Mock for now

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status) => {
    const colors = {
      novo: "bg-blue-500",
      em_atendimento: "bg-amber-500",
      aguardando: "bg-purple-500",
      resolvido: "bg-emerald-500",
      escalado: "bg-rose-500",
    };
    return colors[status] || "bg-slate-500";
  };

  const getStatusLabel = (status) => {
    const labels = {
      novo: "Novo",
      em_atendimento: "Em Atendimento",
      aguardando: "Aguardando",
      resolvido: "Resolvido",
      escalado: "Escalado",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu CRM</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowExportDialog(true)}
            variant="outline"
            className="gap-2"
          >
            <FileDown className="w-4 h-4" />
            Exportar Relatório
          </Button>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Data Início</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                  className="bg-background border-border text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground text-sm">Data Término</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                  className="bg-background border-border text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground text-sm">Agente</Label>
                <Select
                  value={filters.agent}
                  onValueChange={(v) => setFilters({ ...filters, agent: v })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">Todos os Agentes</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground text-sm">
                  Tipo de Gráfico
                </Label>
                <Select
                  value={filters.chartType}
                  onValueChange={(v) =>
                    setFilters({ ...filters, chartType: v })
                  }
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="area">Área</SelectItem>
                    <SelectItem value="bar">Barras</SelectItem>
                    <SelectItem value="line">Linha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                onClick={applyFilters}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtrar
              </Button>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricsCard
          title="Total de Contatos"
          value={filteredContacts.length}
          subtitle={`${thisMonth.length} novos este mês`}
          icon={Users}
          trend={monthGrowth > 0 ? "up" : "down"}
          trendValue={`${Math.abs(monthGrowth)}% vs mês anterior`}
          color="bg-indigo-500"
          isLoading={isLoading}
          onClick={() => navigate(createPageUrl("Contacts"))}
        />
        <MetricsCard
          title="Taxa de Conversão"
          value={`${conversionRate}%`}
          subtitle={`${resolved.length} resolvidos`}
          icon={Target}
          trend={conversionRate >= 50 ? "up" : "down"}
          trendValue={conversionRate >= 50 ? "Acima da meta" : "Abaixo da meta"}
          color="bg-emerald-500"
          isLoading={isLoading}
        />
        <MetricsCard
          title="Agentes Online"
          value={activeUsers.length}
          subtitle={`${users.length} total`}
          icon={UserCheck}
          color="bg-amber-500"
          isLoading={isLoading}
          onClick={() => setShowAgentsDialog(true)}
        />
        <MetricsCard
          title="Tempo de Resposta"
          value={`${avgResponseTime} min`}
          subtitle="Média geral"
          icon={Zap}
          trend="up"
          trendValue="15% mais rápido"
          color="bg-purple-500"
          isLoading={isLoading}
        />
        <MetricsCard
          title="Conversas Hoje"
          value={
            filteredContacts.filter(
              (c) =>
                c.created_date &&
                new Date(c.created_date).toDateString() ===
                  new Date().toDateString(),
            ).length
          }
          subtitle={`${templates.filter((t) => t.is_active !== false).length} templates ativos`}
          icon={MessageSquare}
          color="bg-rose-500"
          isLoading={isLoading}
          onClick={() => setShowConversationsDialog(true)}
        />
      </div>

      {/* Dialogs */}
      <AgentsOnlineDialog
        open={showAgentsDialog}
        onOpenChange={setShowAgentsDialog}
        users={users}
      />
      <ActiveTemplatesDialog
        open={showTemplatesDialog}
        onOpenChange={setShowTemplatesDialog}
        templates={templates}
      />
      <TodayConversationsDialog
        open={showConversationsDialog}
        onOpenChange={setShowConversationsDialog}
        contacts={filteredContacts}
      />
      <ExportReportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        contacts={contacts}
        users={users}
        templates={templates}
      />

      {/* Performance Chart */}
      <PerformanceChart users={users} contacts={filteredContacts} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">
              Conversas por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              {activeFilters.chartType === "area" ? (
                <AreaChart data={conversationsData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              ) : activeFilters.chartType === "bar" ? (
                <BarChart data={conversationsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={conversationsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="none"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Contacts */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">
              Últimos Contatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contactsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum contato cadastrado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() =>
                      navigate(
                        createPageUrl("Conversations") +
                          `?contactId=${contact.id}`,
                      )
                    }
                    className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">
                        {contact.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </div>
                    </div>
                    <Badge
                      className={`${getStatusColor(contact.status)} text-white border-0`}
                    >
                      {getStatusLabel(contact.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                "novo",
                "em_atendimento",
                "aguardando",
                "resolvido",
                "escalado",
              ].map((status) => {
                const count = filteredContacts.filter(
                  (c) => c.status === status,
                ).length;
                const percentage =
                  filteredContacts.length > 0
                    ? (count / filteredContacts.length) * 100
                    : 0;
                const labels = {
                  novo: "Novo",
                  em_atendimento: "Em Atendimento",
                  aguardando: "Aguardando",
                  resolvido: "Resolvido",
                  escalado: "Escalado",
                };
                const colors = {
                  novo: "bg-blue-500",
                  em_atendimento: "bg-amber-500",
                  aguardando: "bg-purple-500",
                  resolvido: "bg-emerald-500",
                  escalado: "bg-rose-500",
                };

                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{labels[status]}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`${colors[status]} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
