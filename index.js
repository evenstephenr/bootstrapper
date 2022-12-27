#!/usr/bin/env node
const https = require("https");
const { exec } = require("child_process");
var url = require("url");
const tar = require("tar");
const package = require("./package.json");
const fs = require("fs");
const path = require("path");
const argv = require("yargs/yargs")(process.argv.slice(2))
  .usage("Usage: $0 <command> [options]")
  .command(
    "@evenstephenr/react-bootstrapper <package-name>",
    "Create a micro react module named <package-name>"
  )
  .string("d")
  .alias("d", "dir")
  .describe("d", "Specify a target directory")
  .string("dry")
  // .alias("dry", "dry-run")
  // .describe("dry", "Display changes without touching any new files")
  .boolean("overrideExistingDir")
  .describe(
    "overrideExistingDir",
    "Force -d to replace an existing matching directory, if it exists"
  )
  .demandCommand(1)
  .example("$ npx @evenstephenr/react-bootstrapper micro-react-module")
  .example(
    "$ npm i -g @evenstephenr/react-bootstrapper && react-bootstrapper micro-react-module"
  )
  .example(
    "$ npx @evenstephenr/react-bootstrapper micro-react-module -d C:/Users/{user}/development"
  ).argv;
const cwd = process.cwd();
const [packageName] = argv._;
const targetDir = path.resolve(argv.d ?? cwd, packageName);
const temp = targetDir + "/remote.tar.gz";
const lowestNodeVersion = 16;
const lowestPackageVersion = 0;
const templateName = "react";

/** v1.2.3 | 1.2.3 -> ["1", "2", "3"] */
function normalizeSemverString(s) {
  return s.replace("v", "").split(".");
}

const normalizedNodeVersion = normalizeSemverString(process.version);
const normalizedPackageVersion = normalizeSemverString(package.version);

/** logs message, exits process */
function panic(message) {
  console.log(
    ` ${message}\n`,
    "\nexiting process, no changes have been made..."
  );
  process.exit(1);
}

/** sync checks for directory preparedness */
async function prepareDirectory() {
  // manually catch most recent major version bump
  let allClearEnv = true;

  console.log();

  if (parseInt(normalizedNodeVersion[0]) < lowestNodeVersion) {
    console.log(
      ` WARNING: you are not using a recent version of node!`,
      `-> want v${lowestNodeVersion}.0.0^, found ${process.version}\n`
    );
    allClearEnv = false;
  }

  if (parseInt(normalizedPackageVersion[0]) < lowestPackageVersion) {
    console.log(
      ` WARNING: you are not using the most recent version of ${package.name}!`,
      `-> want v${lowestPackageVersion}.0.0^, found v${package.version}\n`
    );
    allClearEnv = false;
  }

  if (!allClearEnv) {
    console.log("Things may not work as expected...");
    console.log();
  }

  // check and build directory
  if (fs.existsSync(targetDir) && !argv.overrideExistingDir) {
    panic(
      `ERROR: ${targetDir} exists. Please choose a new directory or remove the existing one`
    );
  }

  if (fs.existsSync(targetDir) && argv.overrideExistingDir) {
    console.log("INFO: Matching dir found, removing existing directory");
    console.log();
    fs.rmSync(targetDir, { recursive: true });
  }

  console.log(`Let's make your module '${targetDir}...'`);
  console.log();

  fs.mkdirSync(targetDir);

  // pull down remote tar, extract template
  if (!argv.t) {
    console.log("INFO: No template specified, defaulting to 'react'");
    console.log();
  }
}

/**
 * Retrieve remote assets for target package.
 *  - NOTE: `minor` versions stabilize tarball assets, so we need to normalize the version and fetch it.
 *    TODO: Might be able to use some 'latest' tag instead
 **/
function fetchTarball() {
  return new Promise((resolve) => {
    function writeToFile(response) {
      response.pipe(fs.createWriteStream(temp)).on("close", resolve);
    }
    const TAR_VERSION = `v${normalizedPackageVersion[0]}.${normalizedPackageVersion[1]}.0`;
    const TAR_URL = `https://github.com/evenstephenr/bootstrapper/archive/refs/tags/${TAR_VERSION}.tar.gz`;
    console.log(
      `INFO: retrieving package template '${templateName}' from remote ${TAR_URL}`
    );
    console.log();
    https.get(TAR_URL, function (response) {
      if (
        response.statusCode > 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        if (url.parse(response.headers.location).hostname) {
          https.get(response.headers.location, writeToFile);
        } else {
          https.get(
            url.resolve(url.parse(TAR_URL).hostname, response.headers.location),
            writeToFile
          );
        }
      } else {
        writeToFile(response);
      }
    });
  });
}

// TODO: implement '--template' -> 'react' (default), 'philepe' (AY YO), 'next', 'go', 'node', etc.
// TODO: implement '--extensions|--packages' -> typescript, tailwind, storybook, mysql, express, etc.
/** tarball pulls down this whole package, filter bootstrapper/templates so we only grab the target template */
function extractTemplate() {
  return new Promise((resolve) => {
    fs.createReadStream(temp)
      .pipe(
        tar.x({
          filter: (path) => path.includes("/templates/" + templateName),
          strip: 3,
          C: packageName,
        })
      )
      .on("close", resolve);
  });
}

/** cleanup tarball dest. directory */
async function extractCleanup() {
  return fs.rmSync(temp);
}

/** file-level mutations / cleanup */
function replaceTokens() {
  return new Promise((resolve, reject) => {
    const fileTargets = [
      path.resolve(targetDir, "package.json"),
      path.resolve(targetDir, "README.md"),
    ];

    fileTargets.map((file, i) => {
      fs.readFile(file, "utf8", function (err, data) {
        if (err) {
          reject(err);
        }

        const result = data.replace(/::PACKAGE_NAME::/g, packageName);

        fs.writeFile(file, result, "utf8", function (err) {
          if (err) {
            reject(err);
          }

          if (i === fileTargets.length - 1) {
            resolve();
          }
        });
      });
    });
  });
}

/** package-level setup */
function setupPackage() {
  return new Promise((resolve) => {
    console.log(`Retrieval success. Preparing your package ${targetDir}`);
    const child = exec(`cd ${targetDir} && npm i && npm run test`);

    child.stdout.on("data", (data) => {
      console.log(`${data}`);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject("Process exited with code " + code);
      }
    });
  });
}

async function main() {
  try {
    await prepareDirectory();
    await fetchTarball();
    await extractTemplate();
    await extractCleanup();
    await replaceTokens();
    await setupPackage();

    console.log("Done.");
    console.log(`cd ${packageName} && npm run test`);
  } catch (e) {
    fs.rmdirSync(targetDir, { recursive: true, force: true });
    panic("ERROR: " + e);
    return e;
  }
}

main();
// TODO: git remote connection on install
// TODO: better support for package metadata (desc., author)?
// TODO: add --license support
// TODO: add --dry-run support
// TODO: cli arg '--help', '--h' should print usage (README time)
// TODO: does node support imports for this package now?
// TODO: add docker/lerna support to orchestrate modules
// TODO: add yarn support
// TODO: add emoji support (lol)
