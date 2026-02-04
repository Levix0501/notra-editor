/**
 * Represents a file in the registry with its path and content.
 */
export interface RegistryFile {
  path: string;
  content: string;
}

/**
 * Represents a dependency with its name and version.
 */
export interface RegistryDependency {
  name: string;
  version: string;
}

/**
 * Represents the complete registry structure containing
 * component metadata, files, and dependencies.
 */
export interface Registry {
  name: string;
  version: string;
  description: string;
  files: RegistryFile[];
  dependencies: RegistryDependency[];
}
