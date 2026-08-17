import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createPluginRuntime } from '../../../packages/plugin-runtime/src/index.ts'
import {
  FIXTURE_DEMO_DATA_SOURCE,
  fixtureDemoPlugin,
} from '../../../plugins/fixture-demo/src/index.ts'
import { App } from './pages/App.tsx'

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

const bootstrap = async (): Promise<void> => {
  const pluginRuntime = createPluginRuntime([fixtureDemoPlugin])
  await pluginRuntime.start()
  const dataSource = pluginRuntime.resolve(FIXTURE_DEMO_DATA_SOURCE)

  window.addEventListener(
    'pagehide',
    () => {
      void pluginRuntime.stop().catch(() => reportLifecycleFailure('shutdown'))
    },
    { once: true },
  )

  createRoot(rootElement).render(
    <StrictMode>
      <App dataSource={dataSource} />
    </StrictMode>,
  )
}

void bootstrap().catch(() => {
  reportLifecycleFailure('startup')
  renderStartupFailure()
})
