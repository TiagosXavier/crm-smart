import React, { useState } from "react";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  User,
  Bot,
  Link2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Sparkles,
  MessageSquare,
  Zap,
  Lock,
} from "lucide-react";

const providers = [
  { value: "openai", label: "OpenAI", icon: "🤖" },
  { value: "anthropic", label: "Anthropic", icon: "🧠" },
  { value: "google", label: "Google AI", icon: "🔮" },
];

const models = {
  openai: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
  google: ["gemini-pro", "gemini-pro-vision"],
};

const integrations = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    icon: "📱",
    status: "soon",
    description: "Integração com WhatsApp Business API",
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: "✈️",
    status: "soon",
    description: "Bot para Telegram",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    status: "soon",
    description: "Direct Messages do Instagram",
  },
  {
    id: "messenger",
    name: "Messenger",
    icon: "💬",
    status: "soon",
    description: "Facebook Messenger",
  },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isAIFormOpen, setIsAIFormOpen] = useState(false);
  const [selectedAIConfig, setSelectedAIConfig] = useState(null);
  const [deleteAIConfig, setDeleteAIConfig] = useState(null);
  const [aiFormData, setAIFormData] = useState({
    name: "",
    provider: "openai",
    model: "gpt-4",
    system_prompt: "",
    temperature: 0.7,
    max_tokens: 1000,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => api.auth.me(),
  });

  const { data: aiConfigs = [], isLoading: aiLoading } = useQuery({
    queryKey: ["aiConfigs"],
    queryFn: () => api.entities.AIConfig.list("-created_date"),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast({ title: "Perfil atualizado com sucesso!" });
    },
  });

  const createAIMutation = useMutation({
    mutationFn: (data) => {
      if (!isAdmin) {
        throw new Error(
          "Apenas administradores podem criar configurações de IA",
        );
      }
      return api.entities.AIConfig.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiConfigs"] });
      toast({ title: "Configuração de IA criada!" });
      closeAIForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAIMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (!isAdmin) {
        throw new Error(
          "Apenas administradores podem editar configurações de IA",
        );
      }
      return api.entities.AIConfig.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiConfigs"] });
      toast({ title: "Configuração de IA atualizada!" });
      closeAIForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAIMutation = useMutation({
    mutationFn: (id) => {
      if (!isAdmin) {
        throw new Error(
          "Apenas administradores podem excluir configurações de IA",
        );
      }
      return api.entities.AIConfig.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiConfigs"] });
      toast({ title: "Configuração de IA excluída!" });
      setDeleteAIConfig(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isAdmin = currentUser?.role === "admin";

  const openAIForm = (config = null) => {
    if (config) {
      setSelectedAIConfig(config);
      setAIFormData({
        name: config.name || "",
        provider: config.provider || "openai",
        model: config.model || "gpt-4",
        system_prompt: config.system_prompt || "",
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 1000,
      });
    } else {
      setSelectedAIConfig(null);
      setAIFormData({
        name: "",
        provider: "openai",
        model: "gpt-4",
        system_prompt: "",
        temperature: 0.7,
        max_tokens: 1000,
      });
    }
    setIsAIFormOpen(true);
  };

  const closeAIForm = () => {
    setIsAIFormOpen(false);
    setSelectedAIConfig(null);
  };

  const handleSaveAI = () => {
    if (!aiFormData.name || !aiFormData.provider || !aiFormData.model) {
      toast({
        title: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const data = { ...aiFormData, is_active: true };

    if (selectedAIConfig) {
      updateAIMutation.mutate({ id: selectedAIConfig.id, data });
    } else {
      createAIMutation.mutate(data);
    }
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

  const getRoleLabel = (role) => {
    const roles = {
      admin: "Administrador",
      supervisor: "Supervisor",
      user: "Atendente",
    };
    return roles[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie seu perfil e configurações do sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-accent border-border">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="ai" className="gap-2">
              <Bot className="w-4 h-4" />
              IA
            </TabsTrigger>
          )}
          <TabsTrigger value="integrations" className="gap-2">
            <Link2 className="w-4 h-4" />
            Integrações
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Informações do Perfil
                </CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {userLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20 border-2 border-primary">
                        <AvatarImage src={currentUser?.avatar_url} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          {getInitials(currentUser?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" size="sm" disabled>
                          Alterar foto
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG ou PNG. Máx 2MB.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <Input
                          value={currentUser?.full_name || ""}
                          disabled
                          className="bg-background border-border"
                        />
                        <p className="text-xs text-muted-foreground">
                          Nome não pode ser alterado
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={currentUser?.email || ""}
                          disabled
                          className="bg-background border-border"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cargo</Label>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-primary-foreground">
                          {getRoleLabel(currentUser?.role)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Gerenciado pelo administrador
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-accent rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">127</p>
                      <p className="text-xs text-muted-foreground">
                        Conversas este mês
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-accent rounded-lg">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        2.5 min
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tempo médio de resposta
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-accent rounded-lg">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">98%</p>
                      <p className="text-xs text-muted-foreground">
                        Taxa de resolução
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Tab */}
        {isAdmin && (
          <TabsContent value="ai" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">
                      Configurações de IA
                    </CardTitle>
                    <CardDescription>
                      Configure os modelos de inteligência artificial
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => openAIForm()}
                    className="bg-primary hover:bg-primary/90 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Configuração
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {aiLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : aiConfigs.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      Nenhuma configuração de IA criada
                    </p>
                    <Button
                      onClick={() => openAIForm()}
                      variant="link"
                      className="text-primary mt-2"
                    >
                      Criar primeira configuração
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiConfigs.map((config) => {
                      const provider = providers.find(
                        (p) => p.value === config.provider,
                      );
                      return (
                        <div
                          key={config.id}
                          className="flex items-center justify-between p-4 bg-accent rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-2xl">
                              {provider?.icon || "🤖"}
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">
                                {config.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {provider?.label} • {config.model}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                config.is_active !== false
                                  ? "bg-emerald-500"
                                  : "bg-secondary"
                              }
                            >
                              {config.is_active !== false ? "Ativo" : "Inativo"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openAIForm(config)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteAIConfig(config)}
                              className="text-muted-foreground hover:text-rose-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Integrações</CardTitle>
              <CardDescription>
                Conecte com outras plataformas de comunicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-4 bg-accent rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-2xl">
                        {integration.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {integration.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-secondary text-secondary-foreground">
                      <Lock className="w-3 h-3 mr-1" />
                      Em breve
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Config Form Dialog */}
      <Dialog open={isAIFormOpen} onOpenChange={setIsAIFormOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedAIConfig
                ? "Editar Configuração"
                : "Nova Configuração de IA"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={aiFormData.name}
                onChange={(e) =>
                  setAIFormData({ ...aiFormData, name: e.target.value })
                }
                placeholder="Ex: Assistente de Vendas"
                className="bg-background border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provedor *</Label>
                <Select
                  value={aiFormData.provider}
                  onValueChange={(v) =>
                    setAIFormData({
                      ...aiFormData,
                      provider: v,
                      model: models[v][0],
                    })
                  }
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {providers.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.icon} {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modelo *</Label>
                <Select
                  value={aiFormData.model}
                  onValueChange={(v) =>
                    setAIFormData({ ...aiFormData, model: v })
                  }
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {models[aiFormData.provider]?.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prompt de Sistema</Label>
              <Textarea
                value={aiFormData.system_prompt}
                onChange={(e) =>
                  setAIFormData({
                    ...aiFormData,
                    system_prompt: e.target.value,
                  })
                }
                placeholder="Instruções para o modelo..."
                className="bg-background border-border min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Temperatura</Label>
                <span className="text-sm text-muted-foreground">
                  {aiFormData.temperature}
                </span>
              </div>
              <Slider
                value={[aiFormData.temperature]}
                onValueChange={([v]) =>
                  setAIFormData({ ...aiFormData, temperature: v })
                }
                min={0}
                max={1}
                step={0.1}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">
                Menor = mais preciso, Maior = mais criativo
              </p>
            </div>

            <div className="space-y-2">
              <Label>Máximo de Tokens</Label>
              <Input
                type="number"
                value={aiFormData.max_tokens}
                onChange={(e) =>
                  setAIFormData({
                    ...aiFormData,
                    max_tokens: parseInt(e.target.value) || 1000,
                  })
                }
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAIForm}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAI}
              disabled={
                createAIMutation.isPending || updateAIMutation.isPending
              }
              className="bg-primary hover:bg-primary/90"
            >
              {createAIMutation.isPending || updateAIMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AI Config Confirmation */}
      <AlertDialog
        open={!!deleteAIConfig}
        onOpenChange={() => setDeleteAIConfig(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Excluir Configuração
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir a configuração{" "}
              <strong>{deleteAIConfig?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-border text-foreground hover:bg-accent">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAIMutation.mutate(deleteAIConfig.id)}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
