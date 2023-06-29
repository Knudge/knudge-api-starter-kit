type DevCertResult = {
  cert: any;
  certPath: string;
  key: any;
  keyPath: string;
}

export default function devCertificateFor(domains: string[], options: {
  prefix: string,
  name: string
} | undefined): Promise<DevCertResult>;