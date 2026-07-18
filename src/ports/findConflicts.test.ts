import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as getPortMapModule from './getPortMap'

vi.mock('./getPortMap', () => ({
  getPortMap: vi.fn(),
}))

describe('findPortConflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty when no conflicts', async () => {
    vi.mocked(getPortMapModule.getPortMap).mockResolvedValue([
      {
        hostPort: 8080,
        containerPort: 80,
        protocol: 'tcp',
        containerName: 'web',
        containerId: 'a',
      },
      {
        hostPort: 3000,
        containerPort: 3000,
        protocol: 'tcp',
        containerName: 'api',
        containerId: 'b',
      },
    ])

    const { findPortConflicts } = await import('./findConflicts')
    const result = await findPortConflicts()
    expect(result).toHaveLength(0)
  })

  it('detects container-container conflict on same host port', async () => {
    vi.mocked(getPortMapModule.getPortMap).mockResolvedValue([
      {
        hostPort: 8080,
        containerPort: 80,
        protocol: 'tcp',
        containerName: 'web',
        containerId: 'a',
      },
      {
        hostPort: 8080,
        containerPort: 8080,
        protocol: 'tcp',
        containerName: 'web2',
        containerId: 'b',
      },
    ])

    const { findPortConflicts } = await import('./findConflicts')
    const result = await findPortConflicts()
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('container-container')
    expect(result[0].hostPort).toBe(8080)
  })
})
