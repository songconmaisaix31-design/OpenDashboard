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
    return 'Invalid fixture time'
  }

  return `${date.toISOString().slice(11, 19)} UTC`
}
