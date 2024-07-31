import { exec } from "child_process";
import { promisify } from "util";
import ora from "ora";
import { log } from "./chalkLog.js";

const execPromise = promisify(exec);

export const deployProject = async () => {
  const spinner = ora("Deploying project...").start();
  try {
    await execPromise("npm run deploy");
    spinner.succeed("Project deployed successfully.");
  } catch (error: any) {
    spinner.fail(`Deployment failed: ${error.message}`);
    throw error;
  }
};
