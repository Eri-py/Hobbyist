import { createFileRoute } from '@tanstack/react-router'

import { seo } from '@/lib/seo'

export const Route = createFileRoute('/_app/settings')({
  head: () => seo({ title: 'Settings', noindex: true }),
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/settings"!</div>
}
