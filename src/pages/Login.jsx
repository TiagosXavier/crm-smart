import React, { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, Mail, Zap } from 'lucide-react'

export default function Login() {
  const { login, authError } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setLocalError('Preencha e-mail e senha.')
      return
    }
    setLocalError('')
    setIsLoading(true)
    try {
      await login(email, password)
      // AuthContext atualiza o estado — o App.jsx re-renderiza automaticamente
    } catch (err) {
      setLocalError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const errorMsg = localError || authError?.message

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo / branding */}
        <div className="flex flex-col items-center gap-2 text-white">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CRM Smart</h1>
          <p className="text-slate-400 text-sm">Gerencie seus clientes com inteligência</p>
        </div>

        {/* Card de login */}
        <Card className="shadow-2xl border-slate-700 bg-slate-800/60 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl">Entrar</CardTitle>
            <CardDescription className="text-slate-400">
              Use as credenciais da sua conta para acessar o sistema.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {errorMsg && (
                <Alert variant="destructive" className="border-red-800 bg-red-950/50 text-red-300">
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium h-10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Para criar sua conta, peça ao administrador do sistema.
        </p>
      </div>
    </div>
  )
}
