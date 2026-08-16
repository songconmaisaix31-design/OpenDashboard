import type { DemoDataSource } from '../contracts/index.ts'
import '../styles/guided-demo.css'
import { GuidedDemoPage } from './GuidedDemoPage.tsx'

export interface AppProps {
  /** T4 composes the T1 fixture adapter at this explicit presentation seam. */
  readonly dataSource?: DemoDataSource
}

export function App({ dataSource }: AppProps) {
  if (dataSource) {
    return <GuidedDemoPage dataSource={dataSource} />
  }

  return (
    <main className="integration-boundary">
      <div className="integration-boundary__mark">OD</div>
      <p className="eyebrow">T2 presentation boundary</p>
      <h1>Guided interface ready for fixture composition.</h1>
      <p>
        This task branch intentionally does not import the T1 engine. T4 will inject the fixture-backed
        <code> DemoDataSource</code> after both scoped commits are integrated.
      </p>
      <div className="integration-boundary__facts">
        <span>Expected port · DemoDataSource</span>
        <span>Runtime provider · Fixture only</span>
        <span>Live actions · Disabled</span>
      </div>
    </main>
  )
}
