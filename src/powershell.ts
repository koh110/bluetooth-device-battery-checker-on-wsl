import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

async function execPowerShell(command: string): Promise<string> {
  const { stdout } = await execAsync(`powershell.exe -Command "${command}"`)
  return stdout.trim()
}

type BluetoothDevice = {
  Class: string
  FriendlyName: string
  InstanceId: string
  Problem: number
  ConfigManagerErrorCode: number
  ProblemDescription: string | null
  Caption: string
  Description: string
  InstallDate: string | null
  Name: string
  Status: 'OK'
  Availability: null
  ConfigManagerUserConfig: false
  CreationClassName: string
  DeviceID: string
  ErrorCleared: null
  ErrorDescription: null
  LastErrorCode: null
  PNPDeviceID: string
  PowerManagementCapabilities: null
  PowerManagementSupported: null
  StatusInfo: null
  SystemCreationClassName: string
  SystemName: string
  ClassGuid: string
  CompatibleID: string[]
  HardwareID: string[]
  Manufacturer: string
  PNPClass: 'Bluetooth'
  Present: boolean
  Service: 'BthLEEnum'
  PSComputerName: null
}

type DevicePropertyType = {
  Type: 3 // Byte
  Data: number
} | {
  Type: 7 // UInt32
  Data: number
} | {
  Type: 13 // Guid
  Data: string
} | {
  Type: 16 // FileTime
  Data: `/Date(${number})/`
} | {
  Type: 17 // boolean
  Data: boolean
} | {
  Type: 18 // String
  Data: string
}

type BatteryProperty = {
  KeyName: '{104EA319-6EE2-4701-BD47-8DDBF425BBE5} 2'
} & Extract<DevicePropertyType, { Type: 7 }>

type DeviceProperty = {
  InstanceId: string
  DeviceID: string
  key: string
  KeyName: string
} & DevicePropertyType

export async function getBluetoothDevices(): Promise<BluetoothDevice[]> {
  const str = await execPowerShell('Get-PnpDevice | ? Class -eq \\"Bluetooth\\" | ? CompatibleID -like \\"*GENERIC*DEVICE*\\" | ConvertTo-Json')

  if (!str) {
    return []
  }

  const devices = JSON.parse(str) as BluetoothDevice[]
  return devices
}

export async function getDeviceDetails(instanceId: string): Promise<(DeviceProperty & BatteryProperty)[]> {
  const str = await execPowerShell(`Get-PnpDeviceProperty -InstanceId \\"${instanceId}\\" | ConvertTo-Json`)

  if (!str) {
    return []
  }

  const detail = JSON.parse(str) as (DeviceProperty & BatteryProperty)[]
  return detail
}

export function getBluetoothDeviceBatteryPercentage(details: Awaited<ReturnType<typeof getDeviceDetails>>) {
  if (!details) {
    return null
  }
  const detail = details.find((d) => d.KeyName === '{104EA319-6EE2-4701-BD47-8DDBF425BBE5} 2')
  if (!detail) {
    return null
  }
  return detail.Data
}
