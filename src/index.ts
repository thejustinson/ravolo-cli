#!/usr/bin/env node

import { Command } from "commander";
import initializeProject from "./initializeProject.js";
import { buildProject } from "./buildProject.js";


const program = new Command();


program
  .command("init")
  .description("Initialize a new Arweave project")
  .action(initializeProject);

program
  .command("build")
  .description("Build your Arweave project")
  .action(buildProject)

program.parse(process.argv);
