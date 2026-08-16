import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createFixtureDataSource } from './demo/index.ts'
import { App } from './pages/App.tsx'

const rootElement = document.getElementById('root')
const dataSource = createFixtureDataSource()

if (!rootElement) {
  throw new Error('未找到 OpenDashboard 根元素。')
}

createRoot(rootElement).render(
  <StrictMode>
    <App dataSource={dataSource} />
  </StrictMode>,
)
