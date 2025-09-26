
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
  isRVolution?: boolean;
  responseData?: any;
  endpoint?: string;
}

export interface DeviceInfo {
  ip: string;
  port: number;
  isRVolution: boolean;
  deviceName?: string;
  responseData?: any;
  endpoint?: string;
  reachable: boolean;
  error?: string;
}

export interface NetworkDiagnostic {
  localIP?: string;
  networkRange?: string;
  routerReachable?: boolean;
  testResults?: DeviceInfo[];
}
