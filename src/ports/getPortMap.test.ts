import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as dockerClient from '../core/dockerClient'

vi.mock('../core/dockerClient', () => ({
  getDockerClient: vi.fn(),
}))

describe('getPortMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when no containers', async () => {
    const mockDocker = {
      listContainers: vi.fn().mockResolvedValue([]),
    }
    vi.mocked(dockerClient.getDockerClient).mockReturnValue(mockDocker as any)

    const { getPortMap } = await import('./getPortMap')
    const result = await getPortMap()
    expect(result).toEqual([])
  })

  it('returns port bindings from running containers', async () => {
    const mockDocker = {
      listContainers: vi.fn().mockResolvedValue([
        {
          Id: 'abc123',
          Names: ['/web'],
          Image: 'nginx',
          ImageID: 'sha256:xxx',
          State: { Status: 'running', StartedAt: '2024-01-01' },
          Created: '2024-01-01',
          NetworkSettings: {
            Ports: {
              '80/tcp': [{ HostPort: '8080' }],
              '443/tcp': [{ HostPort: '8443' }],
            },
          },
        },
      ]),
    }
    vi.mocked(dockerClient.getDockerClient).mockReturnValue(mockDocker as any)

    const { getPortMap } = await import('./getPortMap')
    const result = await getPortMap()
    expect(result).toHaveLength(2)
    expect(result[0].hostPort).toBe(8080)
    expect(result[0].containerPort).toBe(80)
    expect(result[0].containerName).toBe('web')
  })
})
