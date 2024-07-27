#!/usr/bin/env node

import { Command } from "commander";
import { input, select } from "@inquirer/prompts";
import { generateKey } from "./generateKey.js";
import fs from "fs/promises";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import ora from "ora";
import chalk from "chalk";
import { exit } from "process";

const readdir = promisify(fs.readdir);
const execPromise = promisify(exec);

const program = new Command();

const primaryColor = chalk.hex("#1E90FF");
const successColor = chalk.hex("#32CD32");
const warningColor = chalk.hex("#FFA500");
const errorColor = chalk.hex("#FF4500");
const highlightColor = chalk.hex("#FFD700");

const log = {
  primary: (message: string) => console.log(primaryColor(message)),
  success: (message: string) => console.log(successColor(message)),
  warning: (message: string) => console.log(warningColor(message)),
  error: (message: string) => console.log(errorColor(message)),
  highlight: (message: string) => console.log(highlightColor(message)),
};

const removeFiles = async (): Promise<void> => {
  const spinner = ora("Removing existing files...").start();
  try {
    await execPromise(`rm -rf *`);
    spinner.succeed("Existing files removed.");
  } catch (unixError: any) {
    console.warn(`Unix-like command failed: ${unixError.message}`);
    try {
      await execPromise(`del /q *`);
      await execPromise(`for /d %p in (*) do @rmdir /s /q "%p"`);
      spinner.succeed("Existing files removed.");
    } catch (windowsError: any) {
      spinner.fail(`Failed to remove files: ${windowsError.message}`);
      throw windowsError;
    }
  }
};

const setupProject = async (
  framework: string,
  projectName: string
): Promise<void> => {
  const spinner = ora("Setting up your project...").start();
  const template = framework === "ReactTS" ? "react-ts" : "react";
  try {
    await execPromise(
      `npm create vite@latest ${projectName} -- --template ${template} --force`
    );
    spinner.succeed("Project setup complete!");
  } catch (error: any) {
    spinner.fail(`Project setup failed: ${error.message}`);
    throw error;
  }
};

const installDependencies = async (projectName: string): Promise<void> => {
  const spinner = ora("Installing dependencies...").start();
  try {
    await execPromise(`cd ${projectName} && npm install`);
    spinner.succeed("Dependencies installed.");
  } catch (error: any) {
    spinner.fail(`Failed to install dependencies: ${error.message}`);
    throw error;
  }
};

const installPackage = async (
  projectName: string,
  pkg: string
): Promise<void> => {
  const spinner = ora(`Installing ${pkg}...`).start();
  try {
    await execPromise(`cd ${projectName} && npm install --save ${pkg}`);
    spinner.succeed(`${pkg} installed.`);
  } catch (error: any) {
    spinner.fail(`Failed to install ${pkg}: ${error.message}`);
    throw error;
  }
};

const initNodeProject = async (projectName: string): Promise<void> => {
  const spinner = ora("Initializing Node.js...").start();
  try {
    // Check if projectName is not "." and ensure the directory exists
    if (projectName !== ".") {
      const projectPath = path.resolve(projectName);
      // Check if directory exists
      try {
        await fs.access(projectPath);
      } catch {
        // Directory does not exist, create it
        await fs.mkdir(projectPath, { recursive: true });
        spinner.succeed(`Created directory: ${projectPath}`);
      }
    }

    // Initialize Node.js project
    await execPromise(
      `${projectName !== "." ? `cd ${projectName} ` : ""} && npm init -y`
    );
    spinner.succeed("Node.js initialized.");

    if(projectName !== "."){await execPromise(`cd ../`)}
  } catch (error: any) {
    spinner.fail(`Failed to initialize Node.js: ${error.message}`);
    throw error;
  }
};

const installTypeScript = async (projectName: string): Promise<void> => {
  const spinner = ora("Installing TypeScript...").start();
  try {
    await execPromise(
      `${
        projectName !== "." ? `cd ${projectName} ` : ""
      } && npm install typescript @types/node`
    );
    spinner.succeed("TypeScript installed.");
  } catch (error: any) {
    spinner.fail(`Failed to install TypeScript: ${error.message}`);
    throw error;
  }
};

const initTypeScript = async (projectName: string): Promise<void> => {
  const spinner = ora("Initializing TypeScript...").start();
  try {
    await execPromise(
      `${projectName !== "." ? `cd ${projectName} ` : ""} && npx tsc --init`
    );
    spinner.succeed("TypeScript initialized.");
  } catch (error: any) {
    spinner.fail(`Failed to initialize TypeScript: ${error.message}`);
    throw error;
  }
};

const addNodeFiles = async (
  projectName: string,
  frameworkChoice: string
): Promise<void> => {
  const srcDir = path.join(projectName, "src");
  const indexFile = path.join(
    srcDir,
    frameworkChoice == "NodeTS" ? "index.ts" : "index.js"
  );
  const exampleFile = path.join(
    srcDir,
    frameworkChoice == "NodeTS" ? "example.ts" : "example.js"
  );
  await fs.mkdir(srcDir, { recursive: true });
  await fs.writeFile(
    indexFile,
    `import { exampleFunction } from './example';

console.log('Hello, Node.js with TypeScript!');
exampleFunction();`
  );
  await fs.writeFile(
    exampleFile,
    `export const exampleFunction = () => {
console.log('This is an example function in TypeScript.');
};`
  );
};

const copyTemplateFiles = async (
  frameworkChoice: string,
  templateDir: string,
  targetDir: string
): Promise<void> => {
  const copyFile = async (src: string, dest: string): Promise<void> => {
    try {
      await fs.copyFile(src, dest);
    } catch (error: any) {
      console.error(`Error copying ${src} to ${dest}: ${error.message}`);
    }
  };

  const copyDirectory = async (
    srcDir: string,
    destDir: string
  ): Promise<void> => {
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    await fs.mkdir(destDir, { recursive: true });
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  };

  if (frameworkChoice === "ReactJS") {
    await copyFile(
      path.join(templateDir, "App.jsx"),
      path.join(targetDir, "src", "App.jsx")
    );
  } else if (frameworkChoice === "ReactTS") {
    await copyFile(
      path.join(templateDir, "App.tsx"),
      path.join(targetDir, "src", "App.tsx")
    );
  }

  await copyDirectory(templateDir, targetDir);
};

const generateWallet = async (projectName: string): Promise<void> => {
  const walletChoice = await select({
    message: "Would you like to use a new wallet for this project?",
    choices: [
      {
        name: "Yes",
        value: "yes",
        description:
          "A new wallet secret key would be generated and saved in wallet.json",
      },
      {
        name: "No",
        value: "no",
        description:
          "When needed you will be asked to specify the path to the wallet JSON file relative to this folder",
      },
    ],
  });

  if (walletChoice === "yes") {
    const spinner = ora("Generating a new wallet...").start();
    try {
      const key = await generateKey();
      await fs.writeFile(
        path.join(projectName, "wallet.json"),
        JSON.stringify(key, null, 2)
      );
      log.success("New wallet generated and saved to wallet.json");
    } catch (error: any) {
      spinner.fail(
        errorColor(`Failed to generate a new wallet: ${error.message}`)
      );
      throw error;
    }
  }
};

const initializeProject = async (): Promise<void> => {
  log.primary("Welcome Weaver. You're initializing an Arweave project...");

  const projectName = await input({
    message: "Enter the name of your project",
    default: ".",
  });
  const frameworkChoice = await select({
    message: "Select a framework or library to continue:",
    choices: [
      { name: "ReactJS (JavaScript)", value: "ReactJS" },
      { name: "ReactJS (TypeScript)", value: "ReactTS" },
      { name: "NodeJS (JavaScript)", value: "NodeJS" },
      { name: "NodeJS (TypeScript)", value: "NodeTS" },
      { name: "Manual Setup", value: "manual" },
    ],
  });

  if (frameworkChoice === "manual") {
    log.success(
      "You have selected the manual option. Please proceed with the manual setup of your framework/library. The initialization process has been halted."
    );
    await generateWallet(projectName);
    return;
  }

  const isDefaultProjectName = projectName === ".";
  const dirPath = path.resolve(".");

  if (
    ["ReactJS", "ReactTS"].includes(frameworkChoice) &&
    isDefaultProjectName
  ) {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    if (files.length > 0) {
      const handleFilesChoice = await select({
        message:
          "The root directory is not empty. How would you like to proceed?",
        choices: [
          { name: "Remove existing files and continue", value: "remove" },
          { name: "Cancel operation", value: "cancel" },
        ],
      });

      if (handleFilesChoice === "cancel") {
        log.warning("Project setup has been cancelled.");
        return;
      }

      await removeFiles();
    }
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templateDir = path.resolve(__dirname, "template");
  const targetDir = path.resolve(projectName);

  try {
    if (frameworkChoice === "NodeJS") {
      await initNodeProject(projectName);
      await installPackage(projectName, "arweave");
      // await installPackage(projectName, "permaweb-deploy");
      await addNodeFiles(projectName, frameworkChoice);
    } else if (frameworkChoice === "NodeTS") {
      await initNodeProject(projectName);
      await installTypeScript(projectName);
      await initTypeScript(projectName);
      await addNodeFiles(projectName, frameworkChoice);
      await installPackage(projectName, "arweave");
      // await installPackage(projectName, "permaweb-deploy");
    } else if (frameworkChoice === "ReactJS" || frameworkChoice === "ReactTS") {
      await setupProject(frameworkChoice, projectName);
      await installDependencies(projectName);
      await copyTemplateFiles(frameworkChoice, templateDir, targetDir);
      await installPackage(projectName, "arweave");
      await installPackage(projectName, "permaweb-deploy");
    }

    log.success("Project initialized successfully!");
    await generateWallet(projectName);
    exit();
  } catch (error: any) {
    log.error(`Initialization failed: ${error.message}`);
  }
};

program
  .command("init")
  .description("Initialize a new Arweave project")
  .action(initializeProject);

program.parse(process.argv);
