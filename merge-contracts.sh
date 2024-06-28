#!/bin/bash

# Default directory is 'contracts' if no argument is provided
directory="${1:-contracts}"

# Check if the directory exists
if [ ! -d "$directory" ]; then
    echo "Error: Directory '$directory' does not exist."
    exit 1
fi

# Output file name
output_file="$directory/merged-contracts-for-claude.sol.txt"

# Remove the output file if it already exists
rm -f "$output_file"

# Find all .sol files in the directory and its subdirectories, then concatenate them
find "$directory" -type f -name "*.sol" | while read -r file; do
    echo "// File: $file" >> "$output_file"
    cat "$file" >> "$output_file"
    echo -e "\n\n" >> "$output_file"
done

echo "Merged Solidity contracts have been saved to $output_file"