import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { createAgent, chatWithAgent, listAgents, updateAgent, deleteAgent } from '@/api/aiAgentApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    HelpCircle,
    Send,
    Eraser,
    Code,
    Loader2,
    Pencil,
    Trash2,
    Bot,
    Plus,
    X
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form'; // Nova
import { motion, AnimatePresence } from 'framer-motion'; // Nova
import * as tiktoken from 'js-tiktoken'; // Nova
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Nova

// Initialize tiktoken encoder
const encoder = tiktoken.getEncoding('cl100k_base');

const aiModels = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

const AiAgents = () => {
    const { register, setValue, watch, getValues, reset } = useForm({
        defaultValues: {
            botName: '',
            aiModel: 'gpt-4o-mini',
            personality: '',
            goal: '',
            additionalInfo: '',
            chatInput: '',
        },
    });

    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const aiModel = watch('aiModel');
    const personality = watch('personality');
    const goal = watch('goal');
    const additionalInfo = watch('additionalInfo');

    const [chatMessages, setChatMessages] = useState([]);
    const [agentId, setAgentId] = useState(null);
    const [editingAgentId, setEditingAgentId] = useState(null);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [deleteDialogAgent, setDeleteDialogAgent] = useState(null);
    const chatContainerRef = useRef(null);

    // Listar agentes
    const { data: agentsData, isLoading: isLoadingAgents } = useQuery({
        queryKey: ['agents', user?.company_id],
        queryFn: () => listAgents(user.company_id),
        enabled: !!user?.company_id,
    });

    const agents = agentsData?.agents || agentsData || [];

    const createAgentMutation = useMutation({
        mutationFn: (data) => createAgent(data),
        onSuccess: (result) => {
            setAgentId(result.agent_id);
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            toast({ title: 'Agente IA criado com sucesso!' });
        },
        onError: (error) => {
            toast({
                title: 'Erro ao criar agente IA',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const updateAgentMutation = useMutation({
        mutationFn: ({ id, data }) => updateAgent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            toast({ title: 'Agente atualizado com sucesso!' });
            handleCancelEdit();
        },
        onError: (error) => {
            toast({
                title: 'Erro ao atualizar agente',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const deleteAgentMutation = useMutation({
        mutationFn: (id) => deleteAgent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            toast({ title: 'Agente excluído com sucesso!' });
            if (agentId === deleteDialogAgent?.agent_id) {
                setAgentId(null);
            }
            setDeleteDialogAgent(null);
        },
        onError: (error) => {
            toast({
                title: 'Erro ao excluir agente',
                description: error.message,
                variant: 'destructive',
            });
            setDeleteDialogAgent(null);
        },
    });

    const handleSaveAgent = () => {
        const values = getValues();

        if (!values.botName?.trim()) {
            toast({ title: 'Preencha o nome do bot', variant: 'destructive' });
            return;
        }
        if (!values.personality?.trim()) {
            toast({ title: 'Preencha a personalidade do bot', variant: 'destructive' });
            return;
        }
        if (!values.goal?.trim()) {
            toast({ title: 'Preencha o objetivo do bot', variant: 'destructive' });
            return;
        }

        const payload = {
            company_id: user.company_id,
            name: values.botName.trim(),
            personality: values.personality.trim(),
            goal: values.goal.trim(),
            additional_info: values.additionalInfo?.trim() || '',
            model: values.aiModel || 'gpt-4o-mini',
            status: 'active',
        };

        if (editingAgentId) {
            updateAgentMutation.mutate({ id: editingAgentId, data: payload });
        } else {
            createAgentMutation.mutate(payload);
        }
    };

    const handleEditAgent = (agent) => {
        setEditingAgentId(agent.agent_id || agent.id);
        setAgentId(agent.agent_id || agent.id);
        setValue('botName', agent.name || '');
        setValue('aiModel', agent.model || 'gpt-4o-mini');
        setValue('personality', agent.personality || '');
        setValue('goal', agent.goal || '');
        setValue('additionalInfo', agent.additional_info || '');
        setChatMessages([]);
    };

    const handleCancelEdit = () => {
        setEditingAgentId(null);
        setAgentId(null);
        reset();
        setChatMessages([]);
    };

    const handleNewAgent = () => {
        handleCancelEdit();
    };

    // Calcular tokens totais com base no conteúdo dos prompts
    const totalTokens = React.useMemo(() => {
        const text = `${personality || ''}${goal || ''}${additionalInfo || ''}`;
        if (!text) return 0;
        try {
            return encoder.encode(text).length;
        } catch {
            return 0;
        }
    }, [personality, goal, additionalInfo]);

    // Auto-scroll do chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleInsertVariable = (fieldName, variable) => {
        const currentValue = getValues(fieldName) || '';
        setValue(fieldName, currentValue + variable);
    };

    const handleSendMessage = async (e) => {
        e?.preventDefault?.();
        const input = getValues('chatInput');
        if (!input?.trim()) return;

        if (!agentId) {
            toast({
                title: 'Salve o agente primeiro',
                description: 'Crie e salve o agente antes de testar o chat.',
                variant: 'destructive',
            });
            return;
        }

        const userMessage = { id: Date.now(), sender: 'user', text: input.trim() };
        setChatMessages((prev) => [...prev, userMessage]);
        setValue('chatInput', '');
        setIsChatLoading(true);

        try {
            const result = await chatWithAgent({
                user_id: user.id,
                texto: input.trim(),
                agent_id: agentId,
                company_id: user.company_id,
            });
            setChatMessages((prev) => [
                ...prev,
                { id: Date.now(), sender: 'bot', text: result.response },
            ]);
        } catch (error) {
            toast({
                title: 'Erro ao enviar mensagem',
                description: error.message,
                variant: 'destructive',
            });
            setChatMessages((prev) => [
                ...prev,
                { id: Date.now(), sender: 'bot', text: 'Erro ao obter resposta. Tente novamente.' },
            ]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleClearChat = () => {
        setChatMessages([]);
    };

    return (
        <div className="flex flex-col flex-1 p-8 overflow-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Agente IA</h1>
                {editingAgentId && (
                    <Button variant="outline" onClick={handleNewAgent}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Agente
                    </Button>
                )}
            </div>

            {/* Lista de Agentes */}
            <Card className="p-6 shadow-sm border-gray-200 mb-8">
                <h3 className="text-xl font-bold mb-4">Agentes Criados</h3>
                {isLoadingAgents ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : agents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Bot className="h-12 w-12 mb-3 opacity-40" />
                        <p>Nenhum agente criado ainda.</p>
                        <p className="text-sm">Use o formulário abaixo para criar seu primeiro agente.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {agents.map((agent) => {
                            const id = agent.agent_id || agent.id;
                            const isActive = id === agentId;
                            return (
                                <div
                                    key={id}
                                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                                        isActive ? 'border-vibrant-blue bg-blue-50/50' : 'border-gray-200 hover:bg-muted/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Bot className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{agent.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {agent.model || 'gpt-4o-mini'} &middot; {agent.personality?.slice(0, 60)}{agent.personality?.length > 60 ? '...' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                        <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                                            {agent.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditAgent(agent)}
                                            title="Editar agente"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeleteDialogAgent(agent)}
                                            title="Excluir agente"
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Configurações do Agente IA (Header) */}
            <Card className="p-6 shadow-sm border-gray-200 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">
                        {editingAgentId ? 'Editar Agente' : 'Criar Novo Agente'}
                    </h3>
                    <div className="flex items-center gap-3">
                        {agentId && (
                            <span className="text-sm text-emerald-600 font-medium">
                                Agente ativo (ID: {agentId.slice(0, 8)}...)
                            </span>
                        )}
                        {editingAgentId && (
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                <X className="mr-1 h-4 w-4" /> Cancelar
                            </Button>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    {/* Nome do Bot */}
                    <div>
                        <Label htmlFor="ai-bot-name" className="mb-2 block">Nome do Bot</Label>
                        <Input id="ai-bot-name" placeholder="Ex: Bot de Vendas" {...register('botName')} />
                    </div>
                    {/* Seletor de Modelo de IA */}
                    <div>
                        <Label htmlFor="ai-model" className="mb-2 block">Modelo de IA</Label>
                        <Select onValueChange={(value) => setValue('aiModel', value)} value={aiModel}>
                            <SelectTrigger id="ai-model" className="w-full" data-testid="ai-model-select">
                                <SelectValue placeholder="Selecione um modelo" />
                            </SelectTrigger>
                            <SelectContent>
                                {aiModels.map((model) => (
                                    <SelectItem key={model.value} value={model.value}>
                                        {model.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Salvar Agente */}
                    <div>
                        <Button
                            onClick={handleSaveAgent}
                            disabled={createAgentMutation.isPending || updateAgentMutation.isPending}
                            className="w-full bg-vibrant-blue hover:bg-vibrant-blue/90 text-white"
                        >
                            {(createAgentMutation.isPending || updateAgentMutation.isPending) ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : editingAgentId ? (
                                'Salvar Alterações'
                            ) : (
                                'Criar e Testar Agente'
                            )}
                        </Button>
                    </div>
                </div>
                {/* Contador de Tokens */}
                <div className="flex justify-end mt-3">
                    <p className="text-xs text-muted-foreground">Tokens: <span className="font-semibold text-foreground">{totalTokens}</span> | Modelo: {aiModel}</p>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Seção de Prompt (Lado Esquerdo) */}
                <Card className="p-6 shadow-sm border-gray-200 flex flex-col gap-6">
                    <h3 className="text-xl font-bold mb-2">Definição de Prompt</h3>

                    {/* Personality */}
                    <div>
                        <Label htmlFor="personality" className="mb-2 flex items-center">
                            Personalidade
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="ml-2 h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Define o tom e o estilo de comunicação do bot.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <Textarea
                            id="personality"
                            {...register('personality')}
                            placeholder="Ex: 'Você é um assistente virtual amigável e prestativo...'"
                            className="min-h-[100px] resize-y"
                            data-testid="prompt-personality"
                        />
                        <div className="flex justify-end mt-2">
                            <Button variant="ghost" size="sm" onClick={() => handleInsertVariable('personality', '{{ai.business_name}}')}>
                                <Code className="mr-1 h-3 w-3" /> Add Custom Value
                            </Button>
                        </div>
                    </div>

                    {/* Goal */}
                    <div>
                        <Label htmlFor="goal" className="mb-2 flex items-center">
                            Objetivo
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="ml-2 h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Define a principal função ou meta a ser alcançada pelo bot.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <Textarea
                            id="goal"
                            {...register('goal')}
                            placeholder="Ex: 'Minha meta é agendar demonstrações de produto para leads qualificados...'"
                            className="min-h-[100px] resize-y"
                            data-testid="prompt-goal"
                        />
                        <div className="flex justify-end mt-2">
                            <Button variant="ghost" size="sm" onClick={() => handleInsertVariable('goal', '{{ai.user_name}}')}>
                                <Code className="mr-1 h-3 w-3" /> Add Custom Value
                            </Button>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                        <Label htmlFor="additional-info" className="mb-2 flex items-center">
                            Informações Adicionais
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="ml-2 h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Quaisquer outras informações importantes para o bot.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <Textarea
                            id="additional-info"
                            {...register('additionalInfo')}
                            placeholder="Ex: 'Nossos horários de atendimento são de segunda a sexta, das 9h às 18h.'"
                            className="min-h-[100px] resize-y"
                        />
                        <div className="flex justify-end mt-2">
                            <Button variant="ghost" size="sm" onClick={() => handleInsertVariable('additionalInfo', '{{ai.current_date}}')}>
                                <Code className="mr-1 h-3 w-3" /> Add Custom Value
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Playground de Teste (Lado Direito) */}
                <Card className="p-6 shadow-sm border-gray-200 flex flex-col h-[600px]">
                    <h3 className="text-xl font-bold mb-4">Playground de Teste</h3>
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto border border-input rounded-lg p-4 mb-4 bg-background">
                        <AnimatePresence>
                            {chatMessages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className={msg.sender === 'user' ? 'text-right mb-2' : 'text-left mb-2'}
                                >
                                    <span className={msg.sender === 'user' ? 'bg-vibrant-blue text-white rounded-lg px-3 py-1.5 inline-block max-w-[80%]' : 'bg-muted text-foreground rounded-lg px-3 py-1.5 inline-block max-w-[80%]'}>
                                        {msg.text}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {isChatLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-left mb-2"
                            >
                                <span className="bg-muted text-foreground rounded-lg px-3 py-1.5 inline-block">
                                    <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Digitando...
                                </span>
                            </motion.div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder={agentId ? "Digite sua mensagem..." : "Salve o agente para habilitar o chat..."}
                            className="flex-1"
                            {...register('chatInput')}
                            disabled={!agentId || isChatLoading}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendMessage(e);
                                }
                            }}
                            data-testid="chat-input"
                        />
                        <Button size="icon" onClick={handleSendMessage} disabled={!agentId || isChatLoading} data-testid="chat-send-button">
                            {isChatLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleClearChat}>
                            <Eraser className="h-5 w-5" />
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Dialog de confirmação de exclusão */}
            <AlertDialog open={!!deleteDialogAgent} onOpenChange={(open) => !open && setDeleteDialogAgent(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir agente</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o agente <strong>{deleteDialogAgent?.name}</strong>? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteAgentMutation.mutate(deleteDialogAgent?.agent_id || deleteDialogAgent?.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteAgentMutation.isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo...</>
                            ) : (
                                'Excluir'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AiAgents;