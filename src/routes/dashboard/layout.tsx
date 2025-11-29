import { component$, Slot } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Sidebar } from '../../components/sidebar/sidebar';
import { GlobalSearch } from '../../components/ui/global-search';

export const useSession = routeLoader$(({ cookie, redirect }) => {
    const session = cookie.get('user_session');
    if (!session) {
        throw redirect(302, '/login');
    }
    return session.json();
});

export default component$(() => {
    const session = useSession();

    return (
        <div class="flex min-h-screen bg-gray-100">
            <div class="print:hidden">
                <Sidebar session={session.value as any} />
            </div>
            <main class="flex-1 overflow-auto md:ml-0">
                <div class="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between md:px-8 print:hidden">
                    <div class="flex-1 max-w-xl">
                        <GlobalSearch />
                    </div>
                    <div class="flex items-center gap-4">
                        {/* User profile or other actions could go here */}
                    </div>
                </div>
                <div class="p-4 md:p-8 print:p-0">
                    <Slot />
                </div>
            </main>
        </div>
    );
});
