import chalk from 'chalk'

function centerText(text: string, width: number): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>
  const textLength = text.replace(/\u001b\[\d+m/g, '').length // Remove ANSI escape codes for length calculation
  const padding = Math.max(0, Math.floor((width - textLength) / 2))
  return ' '.repeat(padding) + text + ' '.repeat(width - textLength - padding)
}

export const logo = `
                                                                                                                     
  _______  _______  ______    _______       __   __  ___   _______  ______    _______  _______  _______  ______      
  |   _   ||       ||    _ |  |       |     |  |_|  ||   | |       ||    _ |  |   _   ||       ||       ||    _ |    
  |  |_|  ||    ___||   | ||  |   _   |     |       ||   | |    ___||   | ||  |  |_|  ||_     _||   _   ||   | ||    
  |       ||   | __ |   |_||_ |  | |  |     |       ||   | |   | __ |   |_||_ |       |  |   |  |  | |  ||   |_||_   
  |       ||   ||  ||    __  ||  |_|  |     |       ||   | |   ||  ||    __  ||       |  |   |  |  |_|  ||    __  |  
  |   _   ||   |_| ||   |  | ||       |     | ||_|| ||   | |   |_| ||   |  | ||   _   |  |   |  |       ||   |  | |  
  |__| |__||_______||___|  |_||_______|     |_|   |_||___| |_______||___|  |_||__| |__|  |___|  |_______||___|  |_|  
                                                                                                                     

`

const boxWidth = 76
const welcomeMessage = `
╔${'═'.repeat(boxWidth)}╗
║${' '.repeat(boxWidth)}║
║${centerText(chalk.bold('Bem vindo ao Agro Migrator! 🌿'), boxWidth)}║
║${centerText(chalk.dim('Sua ferramenta de migração de bando de dados para o Agrotrace'), boxWidth)}║
║${' '.repeat(boxWidth)}║
╚${'═'.repeat(boxWidth)}╝
`

export const logoWithGradient =
  chalk.bgHex('#44ba2f').white.bold(logo) + welcomeMessage
