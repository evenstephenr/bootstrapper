#!/usr/bin/env node

/** v1.2.3 | 1.2.3 -> ["1", "2", "3"] */
function normalizeSemverString(s) {
  return s.replace("v", "").split(".");
}
/** logs message, exits process */
function panic(message) {
  console.log(
    ` ${message}\n`,
    "\nexiting process, no changes have been made..."
  );
  process.exit(1);
}

const https = require('https');
var url = require('url');
var read = require('fs').createReadStream
var unpack = require('tar-pack').unpack
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
  .describe("d", "Specify a target directory (full path)")
  .string("dry")
  // .alias("dry", "dry-run")
  // .describe("dry", "Display changes without touching any new files")
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
const normalizedNodeVersion = normalizeSemverString(process.version);
const normalizedPackageVersion = normalizeSemverString(package.version);
const lowestNodeVersion = 16;
const lowestPackageVersion = 0;

// manually catch most recent major version bump
let allClearEnv = true;

if (parseInt(normalizedNodeVersion[0]) < lowestNodeVersion) {
  console.log(
    ` WARNING: you are not using a recent version of node!`,
    `-> want v18.0.0^, found ${process.version}\n`
  );
  allClearEnv = false;
}

if (parseInt(normalizedPackageVersion[0]) < lowestPackageVersion) {
  console.log(
    ` WARNING: you are not using the most recent version of ${package.name}!`,
    `-> want v1.0.0^, found v${package.version}\n`
  );
  allClearEnv = false;
}

if (!allClearEnv) {
  console.log("Things may not work as expected...\n");
}

// check and build directory
if (fs.existsSync(targetDir)) {
  panic(
    `ERROR: ${targetDir} exists. Please choose a new directory or remove the existing one`
  );
}

console.log(`Let's make your module '${targetDir}...'`);

try {
  const temp = targetDir + '/remote.tar.gz';
  fs.mkdirSync(targetDir);
  // Object.keys(templates).forEach((templateName) => {
  //   fs.writeFileSync(path.resolve(targetDir, templateName), templates[templateName])
  // });
  function writeToFile(response) {
    response.pipe(fs.createWriteStream(temp));
    read(temp).pipe(unpack(targetDir, function (err) {
      if (err) {console.error(err.stack)}
    }));
  }
  const TAR_URL = 'https://github.com/evenstephenr/react-query/archive/refs/tags/v1.0.1.tar.gz';
  https.get(TAR_URL, function(response) {
    if (response.statusCode > 300 && response.statusCode < 400 && response.headers.location) {
      if (url.parse(response.headers.location).hostname) {
        https.get(response.headers.location, writeToFile);
      } else {
        https.get(url.resolve(url.parse(TAR_URL).hostname, response.headers.location), writeToFile);
      }
    } else {
      writeToFile(response);
    }
  });
} catch (e) {
  fs.rmdirSync(targetDir);
  panic('ERROR: ' + e);
}

console.log('Success! :)');

// TODO: working prototype w/ README
// TODO: implement '--template' -> 'react' (default), 'typescript', 'react-with-ts', 'go', etc.
// TODO: better support for package metadata (desc., author)?
// TODO: cli arg '--help', '--h' should print usage (README time)
// TODO: add --license support
// TODO: add --dry-run support
// TODO: does node support imports for all modules now?
// TODO: add yarn support
// TODO: add emojis (lol)
