import { component$, useSignal, $, useOnDocument } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { SearchIcon, Loader2Icon } from 'lucide-qwik';
import { searchGlobal, type SearchResult } from '~/lib/actions/search';

export const GlobalSearch = component$(() => {
    const query = useSignal('');
    const results = useSignal<SearchResult[]>([]);
    const isLoading = useSignal(false);
    const isOpen = useSignal(false);
    const nav = useNavigate();
    const searchRef = useSignal<HTMLDivElement>();

    const handleSearch = $(async (value: string) => {
        query.value = value;
        if (value.length < 2) {
            results.value = [];
            return;
        }

        isLoading.value = true;
        try {
            results.value = await searchGlobal(value);
        } finally {
            isLoading.value = false;
        }
    });

    const handleSelect = $((url: string) => {
        isOpen.value = false;
        query.value = '';
        nav(url);
    });

    // Close on click outside
    useOnDocument(
        'click',
        $((event) => {
            if (searchRef.value && !searchRef.value.contains(event.target as Node)) {
                isOpen.value = false;
            }
        })
    );

    // Keyboard shortcut (Ctrl+K)
    useOnDocument(
        'keydown',
        $((event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                isOpen.value = true;
                // Focus input logic would go here if we had a ref to input
                const input = document.getElementById('global-search-input');
                if (input) input.focus();
            }
            if (event.key === 'Escape') {
                isOpen.value = false;
            }
        })
    );

    return (
        <div ref={searchRef} class="relative w-full max-w-md">
            <div class="relative">
                <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                    id="global-search-input"
                    type="text"
                    placeholder="Buscar... (Ctrl+K)"
                    class="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                    value={query.value}
                    onInput$={(e) => {
                        isOpen.value = true;
                        handleSearch((e.target as HTMLInputElement).value);
                    }}
                    onFocus$={() => isOpen.value = true}
                />
                {isLoading.value && (
                    <Loader2Icon class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 animate-spin" />
                )}
            </div>

            {isOpen.value && (query.value.length >= 2 || results.value.length > 0) && (
                <div class="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
                    {results.value.length === 0 ? (
                        <div class="p-4 text-center text-gray-500 text-sm">
                            {isLoading.value ? 'Buscando...' : 'No se encontraron resultados'}
                        </div>
                    ) : (
                        <div class="py-2">
                            {results.value.map((result) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick$={() => handleSelect(result.url)}
                                    class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-start gap-3 transition-colors"
                                >
                                    <div class={`mt-1 p-1 rounded-full ${result.type === 'reception' ? 'bg-blue-100 text-blue-600' :
                                            result.type === 'provider' ? 'bg-green-100 text-green-600' :
                                                result.type === 'driver' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-purple-100 text-purple-600'
                                        }`}>
                                        <SearchIcon class="h-3 w-3" />
                                    </div>
                                    <div>
                                        <p class="font-medium text-sm text-gray-900">{result.title}</p>
                                        <p class="text-xs text-gray-500">{result.subtitle}</p>
                                    </div>
                                    <span class="ml-auto text-xs text-gray-400 capitalize">{result.type}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
