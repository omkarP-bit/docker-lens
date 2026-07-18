import { PortConflict } from '../types'
import { getPortMap } from './getPortMap'

export async function findPortConflicts(): Promise<PortConflict[]> {
  const portMap = await getPortMap()
  const conflicts: PortConflict[] = []

  const byPort = new Map<string, typeof portMap>()
  for (const p of portMap) {
    const key = `${p.hostPort}/${p.protocol}`
    if (!byPort.has(key)) byPort.set(key, [])
    byPort.get(key)!.push(p)
  }

  for (const [key, bindings] of byPort) {
    if (bindings.length > 1) {
      const [hostPort, protocol] = key.split('/')
      conflicts.push({
        type: 'container-container',
        hostPort: parseInt(hostPort, 10),
        protocol,
        details: bindings.map(
          (b) => `${b.containerName} (${b.containerPort}/${b.protocol})`
        ),
      })
    }
  }

  return conflicts
}
