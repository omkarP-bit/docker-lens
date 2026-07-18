import { Network } from '../types'
import { getDockerClient } from './dockerClient'

export async function listNetworks(): Promise<Network[]> {
  const docker = getDockerClient()
  const networks = await docker.listNetworks()
  return networks.map(
    (n: any): Network => ({
      id: n.Id,
      name: n.Name,
      driver: n.Driver,
      scope: n.Scope,
      containers: Object.keys(n.Containers || {}).length,
    })
  )
}
