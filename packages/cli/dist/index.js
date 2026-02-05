#!/usr/bin/env node
#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";

// src/constants.ts
var CONSTANTS = {
  TARGET_DIR: "components/notra-editor",
  REGISTRY_BASE_URL: "https://raw.githubusercontent.com/levix0501/notra-editor/main/public/r",
  COMPONENT_NAME: "editor"
};

// src/registry/fetcher.ts
async function fetchRegistry(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch registry: HTTP ${response.status} ${response.statusText}`
      };
    }
    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return {
      success: false,
      error: `Failed to fetch registry: ${errorMessage}`
    };
  }
}

// src/utils/conflict.ts
import { existsSync, readdirSync } from "fs";
import { join, isAbsolute } from "path";
function detectConflicts(targetDir, cwd = process.cwd()) {
  const absolutePath = isAbsolute(targetDir) ? targetDir : join(cwd, targetDir);
  if (!existsSync(absolutePath)) {
    return {
      hasConflict: false,
      existingFiles: []
    };
  }
  const files = readdirSync(absolutePath, {
    recursive: true,
    withFileTypes: true
  }).filter((dirent) => dirent.isFile()).map((dirent) => {
    const parentPath = dirent.parentPath || dirent.path;
    const relativePath = parentPath.replace(absolutePath, "").replace(/^[/\\]/, "");
    return relativePath ? join(relativePath, dirent.name) : dirent.name;
  });
  return {
    hasConflict: files.length > 0,
    existingFiles: files
  };
}

// src/utils/copier.ts
import { writeFileSync, mkdirSync } from "fs";
import { join as join2, dirname, isAbsolute as isAbsolute2 } from "path";
async function copyFiles(files, targetDir, cwd = process.cwd()) {
  const copiedFiles = [];
  const absoluteTargetDir = isAbsolute2(targetDir) ? targetDir : join2(cwd, targetDir);
  try {
    for (const file of files) {
      const targetPath = join2(absoluteTargetDir, file.path);
      const targetDirPath = dirname(targetPath);
      mkdirSync(targetDirPath, { recursive: true });
      writeFileSync(targetPath, file.content, "utf-8");
      copiedFiles.push(file.path);
    }
    return {
      success: true,
      copiedFiles
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return {
      success: false,
      copiedFiles,
      error: `Failed to copy files: ${errorMessage}`
    };
  }
}

// src/utils/installer.ts
import { execSync } from "child_process";
function generateInstallCommand(dependencies) {
  if (dependencies.length === 0) {
    return "pnpm add";
  }
  const packages = dependencies.map((dep) => `${dep.name}@${dep.version}`).join(" ");
  return `pnpm add ${packages}`;
}
async function installDependencies(dependencies, cwd = process.cwd()) {
  if (dependencies.length === 0) {
    return { success: true };
  }
  const command = generateInstallCommand(dependencies);
  try {
    execSync(command, {
      cwd,
      stdio: "pipe"
    });
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return {
      success: false,
      error: `Failed to install dependencies: ${errorMessage}`,
      manualCommand: command
    };
  }
}

// src/utils/prompts.ts
import prompts from "prompts";
function isInteractive() {
  return process.stdin.isTTY === true;
}
async function confirmOverwrite(targetDir) {
  if (!isInteractive()) {
    return false;
  }
  const response = await prompts({
    type: "confirm",
    name: "overwrite",
    message: `Directory "${targetDir}" already exists. Do you want to overwrite it?`,
    initial: false
  });
  if (response.overwrite === void 0) {
    return false;
  }
  return response.overwrite;
}

// src/utils/ui.ts
import kleur from "kleur";
import ora from "ora";
function createSpinner() {
  const spinner = ora();
  return {
    start(text) {
      spinner.start(text);
    },
    succeed(text) {
      spinner.succeed(text);
    },
    fail(text) {
      spinner.fail(text);
    },
    stop() {
      spinner.stop();
    }
  };
}
function success(message) {
  console.log(kleur.green(message));
}
function error(message) {
  console.log(kleur.red(message));
}
function info(message) {
  console.log(kleur.cyan(message));
}

// src/utils/validator.ts
import { existsSync as existsSync2 } from "fs";
import { join as join3 } from "path";
function validateProject(cwd = process.cwd()) {
  const packageJsonPath = join3(cwd, "package.json");
  if (existsSync2(packageJsonPath)) {
    return { valid: true };
  }
  return {
    valid: false,
    error: "package.json not found. Please run this command in a project root directory."
  };
}

// src/commands/init.ts
function buildRegistryUrl() {
  return `${CONSTANTS.REGISTRY_BASE_URL}/${CONSTANTS.COMPONENT_NAME}.json`;
}
async function initCommand(options = {}) {
  const spinner = createSpinner();
  const validation = validateProject();
  if (!validation.valid) {
    error(validation.error || "Project validation failed");
    process.exit(1);
  }
  const conflicts = detectConflicts(CONSTANTS.TARGET_DIR);
  if (conflicts.hasConflict) {
    if (options.force) {
      info(`Overwriting existing files in ${CONSTANTS.TARGET_DIR}...`);
    } else if (!isInteractive()) {
      error(
        `Directory "${CONSTANTS.TARGET_DIR}" already exists. Use --force to overwrite.`
      );
      process.exit(1);
    } else {
      const shouldOverwrite = await confirmOverwrite(CONSTANTS.TARGET_DIR);
      if (!shouldOverwrite) {
        info("Operation cancelled. No files were modified.");
        process.exit(0);
      }
    }
  }
  spinner.start("Fetching editor registry...");
  const registryUrl = buildRegistryUrl();
  const fetchResult = await fetchRegistry(registryUrl);
  if (!fetchResult.success || !fetchResult.data) {
    spinner.fail("Failed to fetch registry");
    error(
      fetchResult.error || "Network request failed. Please check your internet connection."
    );
    process.exit(1);
  }
  spinner.succeed("Registry fetched successfully");
  const registry = fetchResult.data;
  spinner.start("Copying editor files...");
  const copyResult = await copyFiles(registry.files, CONSTANTS.TARGET_DIR);
  if (!copyResult.success) {
    spinner.fail("Failed to copy files");
    error(
      copyResult.error || "File write failed. Please check directory permissions."
    );
    process.exit(1);
  }
  spinner.succeed(
    `Copied ${copyResult.copiedFiles.length} files to ${CONSTANTS.TARGET_DIR}`
  );
  if (registry.dependencies.length > 0) {
    spinner.start("Installing dependencies...");
    const installResult = await installDependencies(registry.dependencies);
    if (!installResult.success) {
      spinner.fail("Failed to install dependencies automatically");
      info("Please run the following command manually:");
      info(`  ${installResult.manualCommand}`);
    } else {
      spinner.succeed("Dependencies installed successfully");
    }
  }
  success("\n\u2728 notra-editor initialized successfully!");
  info(`
Editor files have been copied to: ${CONSTANTS.TARGET_DIR}`);
  info("You can now import the editor in your project:");
  info(`  import { Editor } from '@/components/notra-editor/editor';`);
}

// src/index.ts
var program = new Command();
program.name("notra-editor").version("1.0.0").description("CLI tool to scaffold notra-editor into your project");
program.command("init").description("Initialize notra-editor in your project").option("-f, --force", "Overwrite existing files without prompting").action(async (options) => {
  await initCommand({ force: options.force });
});
program.parse();
