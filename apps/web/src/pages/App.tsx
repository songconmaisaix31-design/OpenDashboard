import type { DemoDataSource } from '../contracts/index.ts'
import '../styles/guided-demo.css'
import { GuidedDemoPage } from './GuidedDemoPage.tsx'

export interface AppProps {
  /** T4 composes the T1 fixture adapter at this explicit presentation seam. */
  readonly dataSource: DemoDataSource
}

export function App({ dataSource }: AppProps) {
  return <GuidedDemoPage dataSource={dataSource} />
}
