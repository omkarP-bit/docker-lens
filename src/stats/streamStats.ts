import { EventEmitter } from 'events'
import { getDockerClient } from '../core/dockerClient'
import { ContainerStats } from '../types'

export function streamStats(
  containerId: string
): EventEmitter {
  const emitter = new EventEmitter()
  const docker = getDockerClient()
  const container = docker.getContainer(containerId)

  let stream: any = null

  container.stats({ stream: true } as any, (err: any, s: any) => {
    if (err) {
      emitter.emit('error', err)
      return
    }
    stream = s

    let prevCpu: number | null = null
    let prevSys: number | null = null

    s.on('data', (chunk: Buffer) => {
      try {
        const raw = JSON.parse(chunk.toString())
        const stats = computeStats(raw, prevCpu, prevSys)
        prevCpu = raw.cpu_stats?.cpu_usage?.total_usage
        prevSys = raw.cpu_stats?.system_cpu_usage
        emitter.emit('data', stats)
      } catch (e) {
        emitter.emit('error', e)
      }
    })

    s.on('end', () => emitter.emit('end'))
    s.on('error', (e: Error) => emitter.emit('error', e))
  })

  emitter.on('destroy', () => {
    if (stream) {
      stream.destroy()
    }
  })

  return emitter
}

function computeStats(
  raw: any,
  prevCpu: number | null,
  prevSys: number | null
): ContainerStats {
  const cpuStats = raw.cpu_stats || {}
  const precpuStats = raw.precpu_stats || {}
  const memStats = raw.memory_stats || {}
  const netStats = raw.networks || {}

  const prevCpuVal = prevCpu ?? (precpuStats.cpu_usage?.total_usage || 0)
  const prevSysVal = prevSys ?? (precpuStats.system_cpu_usage || 0)
  const cpuDelta =
    (cpuStats.cpu_usage?.total_usage || 0) - prevCpuVal
  const sysDelta =
    (cpuStats.system_cpu_usage || 0) - prevSysVal
  const cpuCount = cpuStats.online_cpus || 1
  const cpuPercent = sysDelta > 0 && cpuDelta > 0
    ? (cpuDelta / sysDelta) * cpuCount * 100
    : 0

  const netRx = Object.values(netStats).reduce(
    (sum: number, n: any) => sum + (n.rx_bytes || 0),
    0
  )
  const netTx = Object.values(netStats).reduce(
    (sum: number, n: any) => sum + (n.tx_bytes || 0),
    0
  )

  const blkStats = raw.blkio_stats?.io_service_bytes_recursive || []
  const blkRead = blkStats
    .filter((b: any) => b.op === 'read')
    .reduce((sum: number, b: any) => sum + (b.value || 0), 0)
  const blkWrite = blkStats
    .filter((b: any) => b.op === 'write')
    .reduce((sum: number, b: any) => sum + (b.value || 0), 0)

  return {
    containerId: raw.id || '',
    cpuPercent: Math.round(cpuPercent * 100) / 100,
    memoryUsage: memStats.usage || 0,
    memoryLimit: memStats.limit || 0,
    memoryPercent:
      memStats.limit > 0
        ? Math.round(((memStats.usage || 0) / memStats.limit) * 10000) / 100
        : 0,
    networkRx: netRx,
    networkTx: netTx,
    blockRead: blkRead,
    blockWrite: blkWrite,
    timestamp: new Date(),
  }
}
