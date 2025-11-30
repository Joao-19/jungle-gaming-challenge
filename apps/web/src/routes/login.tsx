import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast'; // Hook do Shadcn para notificações

// Define a rota '/login'
export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Chama o Gateway
      const res = await api.post('/auth/login', { email, password });
      
      // Decodifica o payload do JWT para pegar o ID do usuário (truque simples)
      // O token vem no formato "header.payload.signature"
      const payloadBase64 = res.data.access_token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      
      // Salva no contexto
      login(res.data.access_token, payload.sub);
      
      toast({
        title: "Sucesso!",
        description: "Login realizado com sucesso.",
      });

      // Redireciona para o Dashboard
      navigate({ to: '/dashboard' });
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no Login",
        description: error.response?.data?.message || "Verifique suas credenciais.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Use seu email e senha para acessar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}