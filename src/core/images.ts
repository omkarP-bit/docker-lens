import { Image } from '../types'
import { getDockerClient } from './dockerClient'

export async function listImages(): Promise<Image[]> {
  const docker = getDockerClient()
  const images = await docker.listImages()
  return images.map(normalizeImage)
}

export async function findDanglingImages(): Promise<Image[]> {
  const docker = getDockerClient()
  const images = await docker.listImages({
    filters: { dangling: ['true'] },
  })
  return images.map(normalizeImage)
}

function normalizeImage(raw: any): Image {
  const repoTag = raw.RepoTags?.[0] || '<none>:<none>'
  const [repo, tag] = repoTag.split(':')
  return {
    id: raw.Id,
    repo: repo || '<none>',
    tag: tag || '<none>',
    size: raw.Size || 0,
    created: raw.Created || '',
    dangling: raw.RepoTags?.length === 0 || repoTag === '<none>:<none>',
  }
}
