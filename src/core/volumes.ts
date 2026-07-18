import { Volume } from '../types'
import { getDockerClient } from './dockerClient'

export async function listVolumes(): Promise<Volume[]> {
  const docker = getDockerClient()
  const { Volumes: volumes } = await docker.listVolumes()
  return (volumes || []).map(
    (v: any): Volume => ({
      name: v.Name,
      driver: v.Driver,
      mountpoint: v.Mountpoint,
      size: v.UsageData?.Size || null,
    })
  )
}
