import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/buttons/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';
import {
    useNotifications,
} from '@/composables/UseCases/Notification/useNotifications';
import { useNavigate } from '@tanstack/react-router';
import type { Notification } from '@/composables/UseCases/Notification/useNotifications';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationDropdown() {
    const { notifications } = useNotifications();

    // Filter Logic
    const pending = notifications.filter((n) => !n.readAt);
    const read = notifications
        .filter((n) => n.readAt)
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 3); // Last 3 read

    const hasPending = pending.length > 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {hasPending && (
                        <Badge
                            variant="destructive"
                            className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0 text-[10px]"
                        >
                            {pending.length}
                        </Badge>
                    )}
                    <span className="sr-only">Notificações</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {/* Pendentes */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Novas
                    </div>
                    {pending.length === 0 && (
                        <div className="py-2 text-center text-sm text-muted-foreground">
                            Nenhuma nova notificação
                        </div>
                    )}
                    {pending.map((item) => (
                        <NotificationItem key={item.id} item={item} />
                    ))}

                    <DropdownMenuSeparator />

                    {/* Lidas (Últimas 3) */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Anteriores
                    </div>
                    {read.map((item) => (
                        <NotificationItem key={item.id} item={item} isRead />
                    ))}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function NotificationItem({
    item,
    isRead,
}: {
    item: Notification;
    isRead?: boolean;
}) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (item.metadata?.taskId) {
            navigate({
                to: '/dashboard',
                search: { taskId: item.metadata.taskId },
            });
        }
    };

    return (
        <DropdownMenuItem
            className="cursor-pointer flex-col items-start gap-1 p-3"
            onClick={handleClick}
        >
            <div className="flex w-full justify-between gap-2">
                <span className={`text-sm font-medium ${isRead ? 'text-muted-foreground' : ''}`}>
                    {item.title}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                    })}
                </span>
            </div>
            {item.content && (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                    {item.content}
                </p>
            )}
        </DropdownMenuItem>
    );
}
