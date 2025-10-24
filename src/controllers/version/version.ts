import { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export const versionController = async (req: Request, res: Response) => {
  try {
    // Read package.json to get version
    const packageJsonPath = path.join(__dirname, '../../../package.json')
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

    res.status(200).json({
      status: 'success',
      version: packageData.version,
      name: packageData.name,
      description: packageData.description || '',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching version information:', error)
    res.status(500).json({
      status: 'error',
      message: 'Could not retrieve version information',
    })
  }
}
