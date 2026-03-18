import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Cliente isolado para criação de usuários — não afeta a sessão do admin atual
const signupClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, storageKey: 'crm_signup_isolated' } }
);

export default function InviteUserDialog({ open, onOpenChange }) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'agent',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Cria o usuário no Supabase Auth — dispara o trigger que cria o profile
      const { data: authData, error: signUpError } = await signupClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: data.role,
          },
        },
      });

      if (signUpError) throw new Error(signUpError.message);
      if (!authData.user) throw new Error('Erro ao criar usuário. Tente novamente.');

      // 2. Aguarda o trigger criar o profile e então atualiza full_name e role
      //    (necessário pois o trigger pode ser mais lento que a query abaixo)
      await new Promise(r => setTimeout(r, 800));

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name, role: data.role })
        .eq('id', authData.user.id);

      if (profileError) {
        // Não é crítico — o profile pode ainda não existir se email confirmation estiver ativo
        console.warn('Profile update after signup:', profileError.message);
      }

      return authData.user;
    },
    onSuccess: (user) => {
      toast({
        title: 'Usuário criado com sucesso!',
        description: `${formData.full_name} foi adicionado à equipe. ${
          user.email_confirmed_at ? '' : 'Um e-mail de confirmação foi enviado.'
        }`,
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({ email: '', full_name: '', role: 'agent', password: '' });
    setShowPassword(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.full_name || !formData.password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome, email e senha.',
        variant: 'destructive',
      });
      return;
    }
    if (formData.password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }
    inviteMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Adicionar Novo Usuário
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Cria uma nova conta e adiciona o usuário à equipe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                placeholder="João Silva"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-background border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha Temporária *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-background border-border pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Compartilhe a senha com o novo usuário. Ele poderá alterá-la no perfil.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="agent">Atendente</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { resetForm(); onOpenChange(false); }}
              disabled={inviteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={inviteMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {inviteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</>
              ) : (
                <><Mail className="w-4 h-4 mr-2" />Adicionar Usuário</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
