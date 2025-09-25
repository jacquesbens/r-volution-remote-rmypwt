
export interface RVolutionDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
  isOnline: boolean;
  lastSeen: Date;
  isManuallyAdded: boolean;
}

export interface DeviceCommand {
  action: string;
  value?: string | number;
}

export interface NetworkScanResult {
  ip: string;
  isReachable: boolean;
  deviceName?: string;
}
