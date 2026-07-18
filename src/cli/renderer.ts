import chalk from 'chalk'
import Table from 'cli-table3'
import { Container, Image, PortBinding, PortConflict } from '../types'

function statusColor(state: string): string {
  if (state === 'running') return chalk.green(state)
  if (state === 'exited' || state === 'dead') return chalk.red(state)
  if (state === 'restarting' || state === 'paused') return chalk.yellow(state)
  return state
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)}${units[i]}`
}

export function renderContainers(containers: Container[]): string {
  const table = new Table({
    head: ['ID', 'NAME', 'IMAGE', 'STATUS', 'PORTS'],
    style: { head: ['cyan'] },
    colWidths: [12, 24, 30, 16, 30],
  })

  for (const c of containers) {
    const shortId = c.id.substring(0, 12)
    const portStr = c.ports
      .map((p) => `${p.hostPort}:${p.containerPort}/${p.protocol}`)
      .join(', ')

    table.push([
      chalk.dim(shortId),
      c.name,
      c.image,
      statusColor(c.state),
      portStr || chalk.dim('-'),
    ])
  }

  return table.toString()
}

export function renderImages(images: Image[]): string {
  const table = new Table({
    head: ['REPO', 'TAG', 'SIZE', 'CREATED'],
    style: { head: ['cyan'] },
    colWidths: [30, 20, 12, 20],
  })

  for (const img of images) {
    const repo = img.dangling ? chalk.yellow(img.repo) : img.repo
    const tag = img.dangling ? chalk.yellow(img.tag) : img.tag
    table.push([
      repo,
      tag,
      formatBytes(img.size),
      new Date(img.created).toLocaleDateString(),
    ])
  }

  return table.toString()
}

export function renderPortMap(ports: PortBinding[]): string {
  const table = new Table({
    head: ['HOST PORT', 'CONTAINER PORT', 'PROTOCOL', 'CONTAINER'],
    style: { head: ['cyan'] },
    colWidths: [14, 18, 12, 30],
  })

  for (const p of ports) {
    table.push([
      p.hostPort.toString(),
      p.containerPort.toString(),
      p.protocol,
      p.containerName,
    ])
  }

  return table.toString()
}

export function renderConflicts(conflicts: PortConflict[]): string {
  if (conflicts.length === 0) {
    return chalk.green('No port conflicts detected.')
  }

  const table = new Table({
    head: ['TYPE', 'PORT', 'DETAILS'],
    style: { head: ['red'] },
    colWidths: [24, 12, 50],
  })

  for (const c of conflicts) {
    table.push([
      c.type === 'container-container'
        ? chalk.red('Container ⇄ Container')
        : chalk.yellow('Container ⇄ Host'),
      `${c.hostPort}/${c.protocol}`,
      c.details.join(', '),
    ])
  }

  return table.toString()
}

export function renderStats(
  stats: { id: string; cpu: number; mem: number; memPct: number }[]
): string {
  const table = new Table({
    head: ['CONTAINER ID', 'CPU %', 'MEMORY', 'MEM %'],
    style: { head: ['cyan'] },
    colWidths: [16, 12, 18, 10],
  })

  for (const s of stats) {
    const shortId = s.id.substring(0, 12)
    table.push([
      chalk.dim(shortId),
      s.cpu.toFixed(2) + '%',
      formatBytes(s.mem),
      s.memPct.toFixed(1) + '%',
    ])
  }

  return table.toString()
}
