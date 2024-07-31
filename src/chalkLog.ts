import chalk from "chalk";

const primaryColor = chalk.hex("#1E90FF");
const successColor = chalk.hex("#32CD32");
const warningColor = chalk.hex("#FFA500");
const errorColor = chalk.hex("#FF4500");
const highlightColor = chalk.hex("#FFD700");

export const log = {
  primary: (message: string) => console.log(primaryColor(message)),
  success: (message: string) => console.log(successColor(message)),
  warning: (message: string) => console.log(warningColor(message)),
  error: (message: string) => console.log(errorColor(message)),
  highlight: (message: string) => console.log(highlightColor(message)),
};