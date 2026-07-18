import Dockerode from 'dockerode'

let client: Dockerode | null = null

export function getDockerClient(): Dockerode {
  if (client) return client

  const socketPath = process.env.DOCKER_SOCKET || '/var/run/docker.sock'
  const host = process.env.DOCKER_HOST

  if (host) {
    const ca = process.env.DOCKER_CERT_PATH
      ? dockerCert('ca.pem')
      : undefined
    const cert = process.env.DOCKER_CERT_PATH
      ? dockerCert('cert.pem')
      : undefined
    const key = process.env.DOCKER_CERT_PATH
      ? dockerCert('key.pem')
      : undefined

    const caFile =
      process.env.DOCKER_TLS_VERIFY === '1' && ca
        ? require('fs').readFileSync(ca)
        : undefined
    const certFile = cert ? require('fs').readFileSync(cert) : undefined
    const keyFile = key ? require('fs').readFileSync(key) : undefined

    client = new Dockerode({
      host: host.replace('tcp://', '').replace(':2376', ''),
      port: 2376,
      ca: caFile,
      cert: certFile,
      key: keyFile,
    })
  } else {
    client = new Dockerode({ socketPath })
  }

  return client
}

function dockerCert(name: string): string {
  return `${process.env.DOCKER_CERT_PATH}/${name}`
}

export function resetClient(): void {
  client = null
}
