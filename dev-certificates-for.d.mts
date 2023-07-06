type DevCertResult = {
  caPath?: string
  cert: any;
  certPath: string;
  key: any;
  keyPath: string;
}

export default function devCertificateFor(domains: string[], options: {
  getCaPath: boolean,
  prefix: string,
  name: string
} | undefined): Promise<DevCertResult>;