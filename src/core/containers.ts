import { Container, ContainerListOptions, PortBinding } from '../types'
import { getDockerClient } from './dockerClient'

export async function listContainers(
  options: ContainerListOptions = {}
): Promise<Container[]> {
  const docker = getDockerClient()
  const containers = await docker.listContainers({ all: options.all ?? false })
  return containers.map(normalizeContainer)
}

export async function getContainerDetails(
  id: string
): Promise<Container | null> {
  const docker = getDockerClient()
  try {
    const info = await docker.getContainer(id).inspect()
    return normalizeContainer(info)
  } catch {
    return null
  }
}

function normalizeContainer(raw: any): Container {
  const names = raw.Names || raw.Name
  const name = Array.isArray(names)
    ? (names[0] || '').replace(/^\//, '')
    : (names || '').replace(/^\//, '')

  const ports: PortBinding[] = []
  const portMap = raw.NetworkSettings?.Ports || raw.Ports || {}
  for (const [key, bindings] of Object.entries(portMap)) {
    const [containerPort, protocol] = key.split('/')
    if (Array.isArray(bindings)) {
      for (const b of bindings) {
        if (b?.HostPort) {
          ports.push({
            hostPort: parseInt(b.HostPort, 10),
            containerPort: parseInt(containerPort, 10),
            protocol: protocol as 'tcp' | 'udp',
            containerName: name,
            containerId: raw.Id,
          })
        }
      }
    }
  }

  const state = raw.State || {}
  const status = typeof state === 'string' ? state : state.Status || ''

  return {
    id: raw.Id,
    name,
    image: raw.Image || '',
    imageId: raw.ImageID || '',
    status,
    state: typeof state === 'string' ? state : state.Status || '',
    uptime: typeof state === 'object' ? state.FinishedAt ? null : state.StartedAt || null : null,
    health: state.Health?.Status || null,
    ports,
    created: raw.Created || '',
  }
}
