import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth-context';
import { axiosInstance as api } from '@/composables/Services/Http/use-http';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/form/input';
import { Label } from '@/components/ui/form/label';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/cards/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/composables/UI/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

// ============================================
// Zod Schemas
// ============================================

const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(254, 'Email deve ter no máximo 254 caracteres'), // RFC 5321 standard
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .max(128, 'Senha deve ter no máximo 128 caracteres'), // Prevent DoS attacks
});

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Nome de usuário deve ter no mínimo 3 caracteres')
      .max(50, 'Nome de usuário deve ter no máximo 50 caracteres') // Prevent abuse
      .regex(/^[a-zA-Z0-9_-]+$/, 'Nome de usuário deve conter apenas letras, números, - e _'),
    email: z
      .string()
      .email('Email inválido')
      .max(254, 'Email deve ter no máximo 254 caracteres'), // RFC 5321 standard
    password: z
      .string()
      .min(6, 'Senha deve ter no mínimo 6 caracteres')
      .max(128, 'Senha deve ter no máximo 128 caracteres') // Prevent buffer overflow
      .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
      .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
      .regex(/\d/, 'Senha deve conter pelo menos um número'),
    confirmPassword: z.string().max(128, 'Senha deve ter no máximo 128 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// ============================================
// Main Page Component
// ============================================

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-[400px]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Registrar</TabsTrigger>
          </TabsList>
        </Tabs>

        <motion.div
          layout
          className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden"
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <LoginForm login={login} toast={toast} />
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <RegisterForm toast={toast} onSuccess={() => setActiveTab('login')} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================
// Login Form Component
// ============================================

function LoginForm({ login, toast }: {
  login: (accessToken: string, refreshToken: string, userId: string) => void;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await api.post('/auth/login', data);
      const payloadBase64 = res.data.accessToken.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));

      login(res.data.accessToken, res.data.refreshToken, payload.sub);
      toast({
        variant: "default",
        title: 'Sucesso!',
        description: 'Login realizado com sucesso.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no Login',
        description: error.response?.data?.message || 'Verifique suas credenciais.',
      });
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Use seu email e senha para acessar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
            />
            {errors.email && (
              <span className="text-xs text-red-500">{errors.email.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Senha</Label>
            <Input id="login-password" type="password" {...register('password')} />
            {errors.password && (
              <span className="text-xs text-red-500">{errors.password.message}</span>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
          <div className="text-center mt-2">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Esqueceu sua senha?
            </Link>
          </div>
        </form>
      </CardContent>
    </>
  );
}

// ============================================
// Register Form Component
// ============================================

function RegisterForm({ toast, onSuccess }: {
  toast: ReturnType<typeof useToast>['toast'];
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await api.post('/auth/register', registerData);

      toast({
        variant: "default",
        title: 'Sucesso!',
        description: 'Conta criada com sucesso. Faça login para continuar.',
      });

      reset();

      // Switch to login tab
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no Registro',
        description: error.response?.data?.message || 'Erro ao criar conta. Tente novamente.',
      });
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Criar Conta</CardTitle>
        <CardDescription>Preencha os dados para se registrar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="register-username">Nome de Usuário</Label>
            <Input
              id="register-username"
              type="text"
              placeholder="usuario123"
              {...register('username')}
            />
            {errors.username && (
              <span className="text-xs text-red-500">{errors.username.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
            />
            {errors.email && (
              <span className="text-xs text-red-500">{errors.email.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Senha</Label>
            <Input
              id="register-password"
              type="password"
              placeholder="Ex: Senha123"
              {...register('password')}
            />
            {errors.password && (
              <span className="text-xs text-red-500">{errors.password.message}</span>
            )}
            <p className="text-xs text-muted-foreground">
              Mínimo 6 caracteres, deve conter: maiúscula, minúscula e número
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-confirm-password">Confirmar Senha</Label>
            <Input
              id="register-confirm-password"
              type="password"
              placeholder="Digite a senha novamente"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Registrando...' : 'Criar Conta'}
          </Button>
        </form>
      </CardContent>
    </>
  );
}
