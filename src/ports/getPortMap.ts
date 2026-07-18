import { PortBinding } from '../types'
import { listContainers } from '../core/containers'

export async function getPortMap(): Promise<PortBinding[]> {
  const containers = await listContainers({ all: false })
  const ports: PortBinding[] = []
  for (const c of containers) {
    for (const p of c.ports) {
      ports.push(p)
    }
  }
  ports.sort((a, b) => a.hostPort - b.hostPort)
  return ports
}
