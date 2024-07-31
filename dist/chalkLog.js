import chalk from "chalk";
const primaryColor = chalk.hex("#1E90FF");
const successColor = chalk.hex("#32CD32");
const warningColor = chalk.hex("#FFA500");
const errorColor = chalk.hex("#FF4500");
const highlightColor = chalk.hex("#FFD700");
export const log = {
    primary: (message) => console.log(primaryColor(message)),
    success: (message) => console.log(successColor(message)),
    warning: (message) => console.log(warningColor(message)),
    error: (message) => console.log(errorColor(message)),
    highlight: (message) => console.log(highlightColor(message)),
};
