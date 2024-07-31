import { input, select } from "@inquirer/prompts";
import { generateKey } from "./generateKey.js";
import fs from "fs/promises";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import ora from "ora";
import { log } from "./chalkLog.js";
import { exit } from "process";

const execPromise = promisify(exec);



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
    if (projectName !== ".") {
      const projectPath = path.resolve(projectName);
      try {
        await fs.access(projectPath);
      } catch {
        await fs.mkdir(projectPath, { recursive: true });
        spinner.succeed(`Created directory: ${projectPath}`);
      }
    }
    await execPromise(
      `${projectName !== "." ? `cd ${projectName} && ` : ""}npm init -y`
    );
    spinner.succeed("Node.js initialized.");
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
      spinner.succeed("New wallet generated and saved to wallet.json");
    } catch (error: any) {
      spinner.fail(`Failed to generate a new wallet: ${error.message}`);
      throw error;
    }
  }
};

const initializeProject = async () => {
  const name = await input({ message: "Enter your project name (leave blank for current directory):" });
  const frameworkChoice = await select({
    message: "Choose a framework:",
    choices: [
      { name: "React (JavaScript)", value: "ReactJS" },
      { name: "React (TypeScript)", value: "ReactTS" },
      { name: "Node.js", value: "NodeJS" },
      { name: "Node.js (TypeScript)", value: "NodeTS" },
    ],
  });

  const projectName = name || ".";

  log.primary(`Project Name: ${projectName === "." ? "Current Directory" : projectName}`);
  log.primary(`Framework Choice: ${frameworkChoice}`);

  try {
    await fs.access(projectName);
    log.warning(
      `The directory ${projectName} already exists and will be used.`
    );
  } catch (error) {
    await fs.mkdir(projectName, { recursive: true });
    log.success(`Created directory: ${projectName}`);
  }

  if (frameworkChoice.includes("React")) {
    await setupProject(frameworkChoice, projectName);
    await installDependencies(projectName);
    await installPackage(projectName, "arweave");
    await installPackage(projectName, "permaweb-deploy");
    log.success("React project initialized with required dependencies.");
  } else if (frameworkChoice.includes("Node")) {
    await initNodeProject(projectName);
    await installPackage(projectName, "arweave");
    if (frameworkChoice === "NodeTS") {
      await installTypeScript(projectName);
      await initTypeScript(projectName);
    }
    await addNodeFiles(projectName, frameworkChoice);
    log.success("Node project initialized with required dependencies.");
  }

  await generateWallet(projectName);

  log.primary("Your project has been set up successfully!");
};

// initializeProject().catch((error: any) => {
//   log.error(`Initialization failed: ${error.message}`);
//   exit(1);
// });

export default initializeProject