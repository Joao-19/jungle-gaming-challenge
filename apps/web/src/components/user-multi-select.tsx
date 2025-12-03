import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { api } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';

interface User {
    id: string;
    username: string;
    email: string;
}

interface UserMultiSelectProps {
    selectedUserIds: string[];
    onChange: (userIds: string[]) => void;
}

export function UserMultiSelect({
    selectedUserIds,
    onChange,
}: UserMultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const debouncedSearch = useDebounce(search, 300);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['users', debouncedSearch],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await api.get('/users', {
                params: {
                    page: pageParam,
                    limit: 10,
                    search: debouncedSearch,
                },
            });
            return res.data;
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.meta.page < lastPage.meta.totalPages) {
                return lastPage.meta.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
    });

    const users = data?.pages.flatMap((page) => page.data) || [];

    const handleSelect = (userId: string) => {
        if (selectedUserIds.includes(userId)) {
            onChange(selectedUserIds.filter((id) => id !== userId));
        } else {
            onChange([...selectedUserIds, userId]);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedUserIds.length > 0
                        ? `${selectedUserIds.length} usuário(s) selecionado(s)`
                        : 'Selecione os usuários...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Buscar usuário..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                        <CommandGroup>
                            <ScrollArea className="h-64">
                                {users.map((user: User) => (
                                    <CommandItem
                                        key={user.id}
                                        value={user.username}
                                        onSelect={() => handleSelect(user.id)}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                selectedUserIds.includes(user.id)
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{user.username}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {user.email}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                                {hasNextPage && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mt-2"
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                    >
                                        {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
                                    </Button>
                                )}
                            </ScrollArea>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
