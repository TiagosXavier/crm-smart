import React, { useState } from "react";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Shield, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  offline: "bg-slate-500",
};

const statusLabels = {
  online: "Online",
  away: "Ausente",
  offline: "Offline",
};

const roleLabels = {
  admin: "Administrador",
  supervisor: "Supervisor",
  user: "Atendente",
};

export default function Profile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => api.auth.me(),
  });

  const [formData, setFormData] = useState({
    status: user?.status || "online",
    max_simultaneous: user?.max_simultaneous || 5,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast({ title: "Perfil atualizado com sucesso!" });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar perfil",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      status: formData.status,
      max_simultaneous: formData.max_simultaneous,
    });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      {/* Profile Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(user?.full_name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-card ${statusColors[user?.status || "offline"]}`}
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-foreground">
                {user?.full_name}
              </h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                <Badge className="bg-primary text-primary-foreground">
                  {roleLabels[user?.role] || user?.role}
                </Badge>
                <Badge variant="outline" className="border-border">
                  {statusLabels[user?.status || "offline"]}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Cargo
              </Label>
              <Input
                value={roleLabels[user?.role] || user?.role}
                disabled
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Membro desde
              </Label>
              <Input
                value={
                  user?.created_date
                    ? format(
                        new Date(user.created_date),
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR },
                      )
                    : "N/A"
                }
                disabled
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Configurações de Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${statusColors[value]}`}
                      />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Seu status será visível para outros membros da equipe
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Atendimentos Simultâneos</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={formData.max_simultaneous}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_simultaneous: parseInt(e.target.value) || 5,
                })
              }
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Número máximo de conversas que você pode atender simultaneamente
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
