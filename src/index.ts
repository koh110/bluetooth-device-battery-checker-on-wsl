import { getBluetoothDevices, getDeviceDetails, getBluetoothDeviceBatteryPercentage } from './powershell.ts'

async function showBattery(device: Awaited<ReturnType<typeof getBluetoothDevices>>[number]) {
  const details = await getDeviceDetails(device.InstanceId)
  const battery = getBluetoothDeviceBatteryPercentage(details)
  console.log(`${device.FriendlyName}: ${battery}%`)
}

async function main() {
  const devices = await getBluetoothDevices()
  await Promise.all(devices.map(showBattery))
}
main().catch(console.error)
