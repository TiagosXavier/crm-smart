-- ============================================================
-- Migration 010: Corrige RLS de profiles — admin pode atualizar qualquer perfil
-- ============================================================
-- Problema: a policy "profiles: usuário atualiza o próprio perfil" usa
-- USING (id = auth.uid()), o que bloqueia admins de editar outros usuários
-- via a página Team.jsx.

-- Adiciona policy separada para admin/supervisor atualizarem qualquer profile
create policy "profiles: admin e supervisor atualizam qualquer perfil"
  on profiles for update
  to authenticated
  using (is_admin_or_supervisor())
  with check (is_admin_or_supervisor());
