import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { axiosInstance as api } from '@/composables/Services/Http/use-http';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/form/input';
import { Label } from '@/components/ui/form/label';
import { useToast } from '@/composables/UI/use-toast';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/forgot-password')({
    component: ForgotPasswordPage,
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Email inválido'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', data);

            toast({
                variant: "default",
                title: '✅ Email enviado!',
                description: 'Se sua conta existir, você receberá instruções para redefinir sua senha.',
            });

            setTimeout(() => navigate({ to: '/login' }), 2000);
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Não foi possível processar sua solicitação. Tente novamente.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Esqueceu sua senha?</h1>
                    <p className="mt-2 text-sm text-green-600 font-semibold">
                        Esqueci minha senha
                    </p>
                    <p className="mt-2 text-muted-foreground">
                        Digite seu email e enviaremos instruções para redefinir sua senha.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            {...register('email')}
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Enviando...' : 'Enviar Email de Recuperação'}
                    </Button>

                    <div className="text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar para o login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
