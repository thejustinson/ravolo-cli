import { exec } from "child_process";
import { promisify } from "util";
import ora from "ora";
const execPromise = promisify(exec);
export const buildProject = async () => {
    const spinner = ora("Building project...").start();
    try {
        await execPromise("npm run build");
        spinner.succeed("Project built successfully.");
    }
    catch (error) {
        spinner.fail(`Build failed: ${error.message}`);
        throw error;
    }
};
