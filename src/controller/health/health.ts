import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { logger } from '@/utils/logger'
import os from 'os'

export const healthController = async (req: Request, res: Response) => {
  const uptime = process.uptime()
  const uptimeStr = formatUptime(uptime)

  const totalMemory =
    Math.round((os.totalmem() / (1024 * 1024 * 1024)) * 100) / 100 // Convert to GB
  const freeMemory =
    Math.round((os.freemem() / (1024 * 1024 * 1024)) * 100) / 100 // Convert to GB
  const memoryUsage = process.memoryUsage()
  const usedRss = Math.round((memoryUsage.rss / (1024 * 1024)) * 100) / 100 // Convert to MB

  const cpus = os.cpus()
  const cpuModel = cpus[0].model
  const cpuCores = cpus.length
  const loadAvg = os.loadavg()

  res.status(StatusCodes.OK).json({
    status: 'success',
    timestamp: new Date().toISOString(),
    server: {
      uptime: uptimeStr,
      nodejs: process.version,
      platform: process.platform,
      architecture: process.arch,
    },
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      type: os.type(),
      cpuModel,
      cpuCores,
      loadAverage: {
        oneMinute: loadAvg[0],
        fiveMinutes: loadAvg[1],
        fifteenMinutes: loadAvg[2],
      },
      memory: {
        total: `${totalMemory} GB`,
        free: `${freeMemory} GB`,
        used: `${(totalMemory - freeMemory).toFixed(2)} GB`,
        processUsage: `${usedRss} MB`,
      },
    },
  })
}

/**
 * Format uptime in days, hours, minutes, seconds
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24))
  seconds -= days * 3600 * 24
  const hours = Math.floor(seconds / 3600)
  seconds -= hours * 3600
  const minutes = Math.floor(seconds / 60)
  seconds -= minutes * 60
  seconds = Math.floor(seconds)

  let result = ''
  if (days > 0) result += `${days}d `
  if (hours > 0 || days > 0) result += `${hours}h `
  if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `
  result += `${seconds}s`

  return result
}
