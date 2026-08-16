import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '../../src/pages/App.tsx'
import { createPreviewDataSource } from './preview-data-source.ts'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('T2 preview root element was not found.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App dataSource={createPreviewDataSource()} />
  </StrictMode>,
)
