import execa from 'execa'
import fs from 'fs'
import path from 'path'

import transformer from './../plugins/spring-remark-variables/transformer'
import { execaOptions, info, main } from './utils'

const DATA_DIR = path.join(__dirname, '../data')
const EXTERNAL_FILE = 'external-files.json'
const VARIABLES_FILE = 'variables.json'

const cleanExternalFilesDir = dir => {
  // log('Cleaning', EXTERNAL_FILES_DIR)
  const { failed } = execa.sync('rm', ['-rf', dir], execaOptions)
  if (failed) throw new Error(`Couldn't clean ${dir}`)
}

const createDir = dir => {
  // log('Creating', dir)
  const { failed } = execa.sync('mkdir', ['-p', dir], execaOptions)
  if (failed) throw new Error(`Couldn't create ${dir}`)
}

const downloadFile = (url, dest) => {
  // log('Downloading', url, 'to', dest)
  const { failed } = execa.sync('curl', ['-fLs', url, '-o', dest], execaOptions)
  if (failed) throw new Error(`Couldn't download ${url} to ${dest}`)
}

const processFile = (dir, config, variables = {}) => {
  cleanExternalFilesDir(dir)
  createDir(dir)
  for (let { file, url } of config) {
    info('Loading', file)
    const filePath = path.join(dir, file)
    const { dir: dirPath } = path.parse(filePath)
    createDir(dirPath)
    downloadFile(transformer(url, variables), filePath)
  }
}

const externalFiles = async () => {
  fs.readdirSync(DATA_DIR).forEach(dir => {
    info('Version', dir)
    const externalFilePath = path.join(DATA_DIR, dir, EXTERNAL_FILE)
    const varialbesFilePath = path.join(DATA_DIR, dir, VARIABLES_FILE)
    const config = JSON.parse(fs.readFileSync(externalFilePath))
    const variables = JSON.parse(fs.readFileSync(varialbesFilePath))
    const dataDir = path.join(DATA_DIR, dir, 'files', 'ext')
    processFile(dataDir, config, variables)
  })
}

main('external-files', externalFiles)
