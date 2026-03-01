import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Settings,
    Bot,
    Target,
    LayoutDashboard,
    FormInput,
    MessageSquareText,
    Speech,
    Layers,
    MessageSquareShare,
    SquareUserRound,
    Headset,
    MessageCircleMore,
    ClipboardPen,
    Zap,
    MessageCircle,
    User,
    CalendarDays,
    Home,
    Banknote,
    Smartphone,
    Instagram,
    Facebook,
    Monitor,
    MessagesSquare,
    Settings2, // Nova
    HelpCircle, // Nova
    Send, // Nova
    Eraser, // Nova
    Code // Nova
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form'; // Nova
import { motion, AnimatePresence } from 'framer-motion'; // Nova
import * as tiktoken from 'js-tiktoken'; // Nova
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Nova

// Initialize tiktoken encoder
const encoder = tiktoken.getEncoding('cl100k_base');

const aiModels = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
];

const AiAgents = () => {
    const { register, setValue, watch, getValues } = useForm({
        defaultValues: {
            aiModel: '',
            personality: '',
            goal: '',
            additionalInfo: '',
            chatInput: '',
        },
    });

    const aiModel = watch('aiModel');
    const personality = watch('personality');
    const goal = watch('goal');
    const additionalInfo = watch('additionalInfo');

    const [chatMessages, setChatMessages] = useState([]);
    const chatContainerRef = useRef(null);

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

    const handleSendMessage = (e) => {
        e?.preventDefault?.();
        const input = getValues('chatInput');
        if (!input?.trim()) return;
        setChatMessages((prev) => [
            ...prev,
            { id: Date.now(), sender: 'user', text: input.trim() },
            { id: Date.now() + 1, sender: 'bot', text: 'Esta é uma resposta simulada do bot no playground de teste.' },
        ]);
        setValue('chatInput', '');
    };

    const handleClearChat = () => {
        setChatMessages([]);
    };

    return (
        <div className="flex flex-col flex-1 p-8 overflow-auto">
            <h1 className="text-3xl font-bold mb-6">Configuração de Agentes IA</h1>

            {/* Top Navigation Tabs */}
            <Tabs defaultValue="bot-settings" className="w-full mb-8">
                <TabsList className="grid w-full grid-cols-4 md:w-[600px] lg:w-[800px]">
                    <TabsTrigger value="bot-settings">
                        <Settings className="mr-2 h-4 w-4" /> Configurações do Bot
                    </TabsTrigger>
                    <TabsTrigger value="bot-training">
                        <Bot className="mr-2 h-4 w-4" /> Treinamento do Bot
                    </TabsTrigger>
                    <TabsTrigger value="bot-goals">
                        <Target className="mr-2 h-4 w-4" /> Metas do Bot
                    </TabsTrigger>
                    <TabsTrigger value="dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" /> Painel
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="bot-settings" className="mt-6">
                    {/* Create New Bot Section */}
                    <h2 className="text-2xl font-semibold mb-4">Criar Novo Bot</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Card 1: Configuração por Formulário Guiado */}
                        <Card className="flex flex-col justify-between p-6 shadow-sm border-gray-200">
                            <CardHeader className="p-0 mb-4">
                                <FormInput className="h-10 w-10 text-vibrant-blue mb-3" />
                                <CardTitle className="text-xl font-bold">Configuração por Formulário Guiado</CardTitle>
                                <CardDescription className="text-gray-600">
                                    Ideal para captura de leads simples e agendamentos.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 text-sm text-gray-700 mb-6 flex-grow">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Coleta informações de visitantes através de formulários estruturados.</li>
                                    <li>Automatiza agendamento de reuniões e integração de calendário.</li>
                                    <li>Fácil de configurar com perguntas pré-definidas.</li>
                                    <li>Requer treinamento mínimo de IA.</li>
                                </ul>
                            </CardContent>
                            <CardFooter className="p-0">
                                <Button className="w-full bg-vibrant-blue hover:bg-vibrant-blue/90 text-white">
                                    <MessageSquareText className="mr-2 h-4 w-4" /> Criar Bot Guiado
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Card 2: Bot Baseado em Prompt */}
                        <Card className="flex flex-col justify-between p-6 shadow-sm border-gray-200">
                            <CardHeader className="p-0 mb-4">
                                <Speech className="h-10 w-10 text-vibrant-blue mb-3" />
                                <CardTitle className="text-xl font-bold">Bot Baseado em Prompt</CardTitle>
                                <CardDescription className="text-gray-600">
                                    Instruções personalizadas e Q&A geral com IA avançada.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 text-sm text-gray-700 mb-6 flex-grow">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Responde a consultas complexas usando prompts personalizados.</li>
                                    <li>Fornece informações detalhadas e explicações.</li>
                                    <li>Requer dados de treinamento para desempenho ideal.</li>
                                    <li>Flexível e altamente personalizável.</li>
                                </ul>
                                <div className="mt-4">
                                    <Label htmlFor="prompt-textarea" className="text-sm font-medium mb-2 block">
                                        Prompt do Bot
                                    </Label>
                                    <Textarea
                                        id="prompt-textarea"
                                        placeholder="Ex: 'Você é um agente de suporte ao cliente para uma loja de e-commerce. Sempre seja educado e se ofereça para ajudar a encontrar produtos...'"
                                        className="min-h-[100px] resize-y"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="p-0">
                                <Button className="w-full bg-vibrant-blue hover:bg-vibrant-blue/90 text-white">
                                    <Layers className="mr-2 h-4 w-4" /> Criar Bot por Prompt
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Bot Details Form */}
                    <h2 className="text-2xl font-semibold mb-4">Detalhes do Bot</h2>
                    <Card className="p-6 shadow-sm border-gray-200 mb-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Nome do Bot */}
                            <div>
                                <Label htmlFor="bot-name" className="mb-2 block">Nome do Bot</Label>
                                <Input id="bot-name" placeholder="Ex: 'Bot de Assistente de Vendas'" />
                            </div>

                            {/* Status do Bot */}
                            <div>
                                <Label className="mb-2 block">Status do Bot</Label>
                                <RadioGroup defaultValue="off" className="grid grid-cols-3 gap-4">
                                    <Label
                                        htmlFor="status-off"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-vibrant-blue [&:has([data-state=checked])]:border-vibrant-blue"
                                    >
                                        <RadioGroupItem id="status-off" value="off" className="sr-only" />
                                        <Zap className="mb-3 h-6 w-6 text-gray-500" />
                                        <span>Desativado</span>
                                    </Label>
                                    <Label
                                        htmlFor="status-suggestive"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-vibrant-blue [&:has([data-state=checked])]:border-vibrant-blue"
                                    >
                                        <RadioGroupItem id="status-suggestive" value="suggestive" className="sr-only" />
                                        <MessageSquareShare className="mb-3 h-6 w-6 text-gray-500" />
                                        <span>Sugestivo</span>
                                    </Label>
                                    <Label
                                        htmlFor="status-autopilot"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-vibrant-blue [&:has([data-state=checked])]:border-vibrant-blue"
                                    >
                                        <RadioGroupItem id="status-autopilot" value="autopilot" className="sr-only" />
                                        <SquareUserRound className="mb-3 h-6 w-6 text-gray-500" />
                                        <span>Piloto Automático</span>
                                    </Label>
                                </RadioGroup>
                            </div>

                            {/* Canais Suportados */}
                            <div className="lg:col-span-2">
                                <Label className="mb-2 block">Canais Suportados</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {/* Cada canal como um cartão selecionável */}
                                    {[
                                        { id: 'sms', name: 'SMS', icon: Smartphone },
                                        { id: 'instagram', name: 'Instagram', icon: Instagram },
                                        { id: 'facebook', name: 'Facebook', icon: Facebook },
                                        { id: 'chat-widget', name: 'Widget de Chat', icon: Monitor },
                                        { id: 'live-chat', name: 'Chat ao Vivo', icon: MessagesSquare },
                                        { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle },
                                    ].map((channel) => (
                                        <Label
                                            key={channel.id}
                                            htmlFor={`channel-${channel.id}`}
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground"
                                        >
                                            <Input type="checkbox" id={`channel-${channel.id}`} className="sr-only" />
                                            <channel.icon className="mb-3 h-6 w-6 text-gray-500" />
                                            <span>{channel.name}</span>
                                        </Label>
                                    ))}
                                </div>
                            </div>

                            {/* Modelos */}
                            <div className="lg:col-span-2">
                                <Label htmlFor="template-select" className="mb-2 block">Modelos</Label>
                                <Select>
                                    <SelectTrigger id="template-select" className="w-full">
                                        <SelectValue placeholder="Selecionar um modelo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="booking-assistant">
                                            <ClipboardPen className="mr-2 h-4 w-4" /> Assistente de Reservas
                                        </SelectItem>
                                        <SelectItem value="hotel-support">
                                            <Headset className="mr-2 h-4 w-4" /> Suporte de Hotel
                                        </SelectItem>
                                        <SelectItem value="real-estate-leads">
                                            <Home className="mr-2 h-4 w-4" /> Captura de Leads Imobiliários
                                        </SelectItem>
                                        <SelectItem value="general-qna">
                                            <MessageCircleMore className="mr-2 h-4 w-4" /> Q&A Geral
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>

                    {/* Banner de Teste de Bot IA */}
                    <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-vibrant-blue border-l-4 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-vibrant-blue">Teste de Bot IA</h3>
                            <p className="text-gray-700 text-sm">
                                Teste seu bot configurado em um ambiente de teste para garantir desempenho ideal.
                            </p>
                        </div>
                        <Button className="bg-vibrant-blue hover:bg-vibrant-blue/90 text-white">
                            <Zap className="mr-2 h-4 w-4" /> Testar Bot
                        </Button>
                    </Card>

                </TabsContent>

                {/* Conteúdo das Abas Vazias */}
                <TabsContent value="bot-training" className="mt-6">
                    <p className="text-gray-500">O conteúdo de Treinamento do Bot virá aqui.</p>
                </TabsContent>

                {/* Conteúdo da Aba Metas do Bot */}
                <TabsContent value="bot-goals" className="mt-6">
                    {/* Configurações do Agente IA (Header) */}
                    <Card className="p-6 shadow-sm border-gray-200 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Configurações do Agente IA</h3>
                            <Button variant="ghost" size="icon" className="text-muted-foreground" data-testid="settings-button">
                                <Settings2 className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
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
                            {/* Contador de Tokens */}
                            <div className="flex flex-col items-start md:items-end">
                                <p className="text-sm text-muted-foreground">Tokens utilizados: <span className="font-semibold text-foreground">{totalTokens}</span></p>
                                <p className="text-xs text-muted-foreground">Otimizado para {aiModel}</p>
                            </div>
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
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Digite sua mensagem..."
                                    className="flex-1"
                                    {...register('chatInput')}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendMessage(e);
                                        }
                                    }}
                                    data-testid="chat-input"
                                />
                                <Button size="icon" onClick={handleSendMessage} data-testid="chat-send-button">
                                    <Send className="h-5 w-5" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={handleClearChat}>
                                    <Eraser className="h-5 w-5" />
                                </Button>
                            </div>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="dashboard" className="mt-6">
                    <p className="text-gray-500">O conteúdo do Painel virá aqui.</p>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AiAgents;