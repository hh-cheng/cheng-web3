export const networks = {
  97: 'BSC测试网',
  1337: '本地测试网',
  11155111: 'Sepolia测试网',
} as const

export const networkOptions = [
  { value: 97, label: 'BSC测试网' },
  { value: 1337, label: '本地测试网' },
  { value: 11155111, label: 'Sepolia测试网' },
] as const
