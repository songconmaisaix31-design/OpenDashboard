const providerLabels: Readonly<Record<string, string>> = {
  'agent-usage-manager': 'Agent Usage Manager',
  agentteams: 'AgentTeams',
  cordis: 'Cordis',
  'fastapi-radar': 'FastAPI Radar',
  hardware: 'Hardware',
  localops: 'LocalOps',
  orca: 'Orca',
  'open-dashboard-fixture': 'OpenDashboard Fixture',
}

export function formatProviderName(providerId: string): string {
  return (
    providerLabels[providerId] ??
    providerId
      .split('-')
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' ')
  )
}

export function formatUtcTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '固定样例时间无效'
  }

  return `${date.toISOString().slice(11, 19)} UTC`
}

const healthLabels: Readonly<Record<DemoTarget['health'], string>> = {
  degraded: '已降级',
  healthy: '健康',
}

const incidentStatusLabels: Readonly<Record<DemoIncident['status'], string>> = {
  investigating: '调查中',
  open: '待处理',
  recovered: '已恢复',
}

const providerStatusLabels: Readonly<Record<DemoProviderHealth['status'], string>> = {
  degraded: '已降级',
  healthy: '健康',
  mocked: '模拟',
  planned: '待开发',
}

const auditActorLabels: Readonly<Record<DemoAuditEntry['actor'], string>> = {
  'demo-user': '演示用户',
  'fixture-provider': '固定样例提供器',
}

export function formatHealth(value: DemoTarget['health']): string {
  return healthLabels[value]
}

export function formatIncidentStatus(value: DemoIncident['status']): string {
  return incidentStatusLabels[value]
}

export function formatProviderStatus(value: DemoProviderHealth['status']): string {
  return providerStatusLabels[value]
}

export function formatAuditActor(value: DemoAuditEntry['actor']): string {
  return auditActorLabels[value]
}
import type {
  DemoAuditEntry,
  DemoIncident,
  DemoProviderHealth,
  DemoTarget,
} from '../contracts/index.ts'
