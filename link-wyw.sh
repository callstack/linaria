#!/bin/bash

# Find package.json files in the current folder (excluding node_modules)
package_json_files=$(find . -name "package.json" ! -path "*/node_modules/*")

# Loop through each package.json file found
for package_json_file in $package_json_files; do
    # Get the directory path of the package.json file
    package_dir=$(dirname "$package_json_file")

    # Get all @linaria/* dependencies
    linaria_dependencies=$(cat "$package_json_file" | jq -r '(.dependencies + .devDependencies) | with_entries(select(.key | startswith("@wyw-in-js"))) | keys[]' 2>/dev/null)

    # Link @linaria dependencies
    if [[ $linaria_dependencies != "null" ]]; then
        for dep in $linaria_dependencies; do
            echo "Running pnpm link --global $dep in $package_dir"
            (cd "$package_dir" && pnpm link --global $dep)
        done
    fi
done
