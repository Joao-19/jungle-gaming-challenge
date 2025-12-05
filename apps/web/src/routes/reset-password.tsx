import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export const Route = createFileRoute('/reset-password')({
    component: ResetPasswordPage,
    validateSearch: z.object({
        token: z.string().min(1, 'Token é obrigatório'),
    }),
});

const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { token } = useSearch({ from: '/reset-password' });
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!token) {
            toast({
                variant: 'destructive',
                title: 'Token inválido',
                description: 'O link de redefinição está incompleto ou inválido.',
            });
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', {
                token,
                newPassword: data.newPassword,
            });

            toast({
                variant: "default",
                title: '✅ Senha redefinida!',
                description: 'Sua senha foi alterada com sucesso. Você já pode fazer login.',
            });

            setTimeout(() => navigate({ to: '/login' }), 2000);
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || 'Token inválido ou expirado.';
            toast({
                variant: 'destructive',
                title: 'Erro ao redefinir senha',
                description: message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Redefinir Senha</h1>
                    <p className="mt-2 text-sm text-green-600 font-semibold">
                        Esqueci minha senha
                    </p>
                    <p className="mt-2 text-muted-foreground">
                        Digite sua nova senha abaixo.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            placeholder="••••••"
                            {...register('newPassword')}
                            disabled={isLoading}
                        />
                        {errors.newPassword && (
                            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••"
                            {...register('confirmPassword')}
                            disabled={isLoading}
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
