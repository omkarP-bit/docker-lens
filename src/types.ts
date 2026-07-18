export interface Container {
  id: string
  name: string
  image: string
  imageId: string
  status: string
  state: string
  uptime: string | null
  health: string | null
  ports: PortBinding[]
  created: string
}

export interface PortBinding {
  hostPort: number
  containerPort: number
  protocol: 'tcp' | 'udp'
  containerName: string
  containerId: string
}

export interface PortConflict {
  type: 'container-container' | 'container-host'
  hostPort: number
  protocol: string
  details: string[]
}

export interface Image {
  id: string
  repo: string
  tag: string
  size: number
  created: string
  dangling: boolean
}

export interface Network {
  id: string
  name: string
  driver: string
  scope: string
  containers: number
}

export interface Volume {
  name: string
  driver: string
  mountpoint: string
  size: number | null
}

export interface ContainerStats {
  containerId: string
  cpuPercent: number
  memoryUsage: number
  memoryLimit: number
  memoryPercent: number
  networkRx: number
  networkTx: number
  blockRead: number
  blockWrite: number
  timestamp: Date
}

export interface ContainerListOptions {
  all?: boolean
}
