import React from 'react';
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
    MessagesSquare
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const AiAgents = () => {
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
                <TabsContent value="bot-goals" className="mt-6">
                    <p className="text-gray-500">O conteúdo de Metas do Bot virá aqui.</p>
                </TabsContent>
                <TabsContent value="dashboard" className="mt-6">
                    <p className="text-gray-500">O conteúdo do Painel virá aqui.</p>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AiAgents;
