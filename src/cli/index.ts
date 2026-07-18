import chalk from 'chalk'
import { Command } from 'commander'
import { listContainers } from '../core/containers'
import { listImages, findDanglingImages } from '../core/images'
import { getPortMap } from '../ports/getPortMap'
import { findPortConflicts } from '../ports/findConflicts'
import { streamStats } from '../stats/streamStats'
import {
  renderContainers,
  renderImages,
  renderPortMap,
  renderConflicts,
  renderStats,
} from './renderer'

const program = new Command()

program
  .name('docker-lens')
  .description('Read-only Docker introspection tool')
  .version('0.1.0')

program
  .command('ps')
  .description('List containers')
  .option('-a, --all', 'Show all containers (default shows running)')
  .action(async (opts) => {
    try {
      const containers = await listContainers({ all: opts.all })
      console.log(renderContainers(containers))
    } catch (err: any) {
      console.error('Error: Could not connect to Docker. Is Docker running?')
      console.error(err.message)
      process.exit(1)
    }
  })

program
  .command('images')
  .description('List images')
  .option('-d, --dangling', 'Show only dangling images')
  .action(async (opts) => {
    try {
      const images = opts.dangling ? await findDanglingImages() : await listImages()
      console.log(renderImages(images))
    } catch (err: any) {
      console.error('Error:', err.message)
      process.exit(1)
    }
  })

program
  .command('ports')
  .description('Show port mappings for all running containers')
  .action(async () => {
    try {
      const portMap = await getPortMap()
      console.log(renderPortMap(portMap))
      console.log()
      const conflicts = await findPortConflicts()
      console.log(renderConflicts(conflicts))
    } catch (err: any) {
      console.error('Error:', err.message)
      process.exit(1)
    }
  })

program
  .command('stats')
  .description('Show live stats for all running containers')
  .argument('[id]', 'Container ID (optional, shows all if omitted)')
  .action(async (id?: string) => {
    try {
      const containers = await listContainers()
      const ids = id ? [id] : containers.map((c) => c.id)

      if (ids.length === 0) {
        console.log('No running containers.')
        return
      }

      const statsMap = new Map<string, { id: string; cpu: number; mem: number; memPct: number }>()

      const streams = ids.map((cid) => {
        const emitter = streamStats(cid)
        emitter.on('data', (data: any) => {
          statsMap.set(cid, {
            id: cid,
            cpu: data.cpuPercent,
            mem: data.memoryUsage,
            memPct: data.memoryPercent,
          })
        })
        emitter.on('error', () => {})
        return emitter
      })

      console.clear()
      const interval = setInterval(() => {
        console.clear()
        const stats = Array.from(statsMap.values())
        console.log(renderStats(stats))
        console.log(chalk.dim('Press Ctrl+C to stop'))
      }, 2000)

      process.on('SIGINT', () => {
        clearInterval(interval)
        for (const s of streams) s.emit('destroy')
        process.exit(0)
      })
    } catch (err: any) {
      console.error('Error:', err.message)
      process.exit(1)
    }
  })

program
  .command('dashboard')
  .description('Full dashboard (containers + ports + conflicts)')
  .action(async () => {
    try {
      const containers = await listContainers({ all: false })
      const portMap = await getPortMap()
      const conflicts = await findPortConflicts()

      console.log(chalk.bold.cyan('\n  docker-lens — Docker Dashboard\n'))
      console.log(chalk.bold('Containers:'))
      console.log(renderContainers(containers))
      console.log()
      console.log(chalk.bold('Port Map:'))
      console.log(renderPortMap(portMap))
      console.log()
      console.log(chalk.bold('Conflicts:'))
      console.log(renderConflicts(conflicts))
      console.log()
    } catch (err: any) {
      console.error('Error: Could not connect to Docker. Is Docker running?')
      console.error(err.message)
      process.exit(1)
    }
  })

program
  .command('help')
  .description('Show help')
  .action(() => program.help())

export function run(argv: string[]): void {
  program.parse(argv, { from: 'user' })
}
