#!/usr/bin/env node
import { Command } from "commander";
import initializeProject from "./initializeProject.js";
const program = new Command();
program
    .command("init")
    .description("Initialize a new Arweave project")
    .action(initializeProject);
program.parse(process.argv);
