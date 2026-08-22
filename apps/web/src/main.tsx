import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createPluginRuntime } from '../../../packages/plugin-runtime/src/index.ts'
import {
  FIXTURE_DEMO_DATA_SOURCE,
  fixtureDemoPlugin,
} from '../../../plugins/fixture-demo/src/index.ts'
import {
  createH2EmsPlugin,
  H2_EMS_DATA_SOURCE,
  h2EmsPlugin,
} from '../../../plugins/h2-ems/src/index.ts'
import { H2SentinelApp } from './features/h2-sentinel/index.ts'
import { App } from './pages/App.tsx'

type H2Mode = 'fixture' | 'local'

type ApplicationEntry =
  | { readonly kind: 'generic' }
  | { readonly kind: 'h2-sentinel'; readonly mode: H2Mode }

const H2_ENTRY_PATHS = new Set(['/h2-sentinel', '/h2-sentinel/'])

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('未找到 OpenDashboard 根元素。')
}

const reportLifecycleFailure = (phase: 'startup' | 'shutdown'): void => {
  console.error(`[OpenDashboard] ${phase} failed.`)
}

const renderStartupFailure = (): void => {
  const message = document.createElement('p')
  message.setAttribute('role', 'alert')
  message.textContent = 'OpenDashboard 启动失败。请检查本地开发日志后重试。'
  rootElement.replaceChildren(message)
}

const readApplicationEntry = (location: Location): ApplicationEntry => {
  if (!H2_ENTRY_PATHS.has(location.pathname)) {
    return { kind: 'generic' }
  }

  const parameters = new URLSearchParams(location.search)
  const modes = parameters.getAll('mode')
  const hasUnknownParameter = [...parameters.keys()].some((key) => key !== 'mode')
  if (hasUnknownParameter || modes.length !== 1) {
    throw new Error('Invalid H2 Sentinel entry configuration.')
  }

  const mode = modes[0]
  if (mode !== 'fixture' && mode !== 'local') {
    throw new Error('Invalid H2 Sentinel mode.')
  }

  return { kind: 'h2-sentinel', mode }
}

const registerPagehideShutdown = (
  stop: () => Promise<void>,
): void => {
  window.addEventListener(
    'pagehide',
    () => {
      void stop().catch(() => reportLifecycleFailure('shutdown'))
    },
    { once: true },
  )
}

const bootstrapGenericDemo = async (): Promise<void> => {
  const pluginRuntime = createPluginRuntime([fixtureDemoPlugin])
  await pluginRuntime.start()
  const dataSource = pluginRuntime.resolve(FIXTURE_DEMO_DATA_SOURCE)

  registerPagehideShutdown(() => pluginRuntime.stop())

  createRoot(rootElement).render(
    <StrictMode>
      <App dataSource={dataSource} />
    </StrictMode>,
  )
}

const bootstrapH2Sentinel = async (mode: H2Mode): Promise<void> => {
  const plugin =
    mode === 'fixture'
      ? h2EmsPlugin
      : createH2EmsPlugin({
          enabled: true,
          baseUrl: window.location.origin,
          timeoutMs: 30_000,
        })
  const pluginRuntime = createPluginRuntime([plugin])
  await pluginRuntime.start()
  const dataSource = pluginRuntime.resolve(H2_EMS_DATA_SOURCE)

  registerPagehideShutdown(() => pluginRuntime.stop())
  document.title = 'OpenDashboard | H2 Sentinel'

  createRoot(rootElement).render(
    <StrictMode>
      <H2SentinelApp dataSource={dataSource} />
    </StrictMode>,
  )
}

const bootstrap = async (): Promise<void> => {
  const entry = readApplicationEntry(window.location)
  if (entry.kind === 'generic') {
    await bootstrapGenericDemo()
    return
  }
  await bootstrapH2Sentinel(entry.mode)
}

void bootstrap().catch(() => {
  reportLifecycleFailure('startup')
  renderStartupFailure()
})
