import chalk from 'chalk'
import winston, { createLogger, format, transports } from 'winston'

const { combine, timestamp, label, printf } = winston.format

const consoleFormat = printf(({ level, message, label, timestamp }) => {
  const levelUpper = level.toUpperCase()
  switch (levelUpper) {
    case 'INFO':
      message = chalk.green(message)
      level = chalk.black.bgGreenBright.bold(levelUpper)
      break

    case 'WARN':
      message = chalk.yellow(message)
      level = chalk.black.bgYellowBright.bold(levelUpper)
      break

    case 'ERROR':
      message = chalk.red(message)
      level = chalk.black.bgRedBright.bold(levelUpper)
      break

    default:
      break
  }
  return chalk.bold(
    `[${chalk.black.bgGreen.bold(label)}] [${chalk.black.bgWhiteBright(timestamp)}] [${level}]: ${message}`
  )
})

export const logger = createLogger({
  level: 'info',
  format: combine(
    label({ label: 'AGROTRACE MIGRATOR' }),
    timestamp(),
    format.splat(),
    consoleFormat
  ),
  transports: [
    new transports.Console(),
    // new transports.File({
    //   filename: 'logs/YOUR_LOG_FILE_NAME.log',
    //   format: combine(
    //     label({ label: 'YOUR_LOG_FILE_NAME' }),
    //     timestamp(),
    //     format.splat(),
    //     fileFormat
    //   ),
    // }),
  ],
})
