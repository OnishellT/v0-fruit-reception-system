import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';

export const useRedirect = routeLoader$(({ redirect }) => {
  throw redirect(302, '/login');
});

export default component$(() => {
  return <div>Redirecting...</div>;
});
