import { Suspense, type ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'
import { NAV_ITEMS, navItemRouteSegment } from '@/components/layout/sidebar/navigation'
import { APP_ROUTE_COMPONENTS } from './appRouteComponents'
import { RequireNavAccess } from './guards'
import { PageLoader } from './PageLoader'

interface LazyProps {
  readonly children: ReactNode
}

function Lazy({ children }: LazyProps) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

function assertRouteComponent(id: string): asserts id is keyof typeof APP_ROUTE_COMPONENTS {
  if (!(id in APP_ROUTE_COMPONENTS)) {
    throw new Error(`Falta componente de ruta para nav item "${id}". Actualiza appRouteComponents.ts.`)
  }
}

export function buildProtectedAppRoutes(): RouteObject[] {
  return NAV_ITEMS.map((item) => {
    assertRouteComponent(item.id)
    const Page = APP_ROUTE_COMPONENTS[item.id]
    const segment = navItemRouteSegment(item)

    const element = (
      <RequireNavAccess item={item}>
        <Lazy>
          <Page />
        </Lazy>
      </RequireNavAccess>
    )

    if (segment === null) {
      return { index: true, element }
    }

    return { path: segment, element }
  })
}
