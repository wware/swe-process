import re
import os
from pathlib import Path

def extract_files_from_readme(readme_path):
    # Read the README file
    with open(readme_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regular expression to find file paths and code blocks within details tags
    # Make the language identifier optional with (?:...)? and ensure we don't capture closing tags
    pattern = r'<details>\s*<summary><tt>(.*?)</tt></summary>\s*```(?:typescript|ts|json|yml|yaml|gitignore)?\s*(.*?)```\s*</details>'
    matches = re.finditer(pattern, content, re.DOTALL)

    for match in matches:
        file_path = match.group(1).strip()
        code_content = match.group(2).strip()
        
        # Skip if file_path is empty or contains HTML tags (indicating bad match)
        if not file_path or '<' in file_path or '>' in file_path:
            print(f"Warning: Invalid file path found: {file_path}, skipping...")
            continue

        try:
            # Create directory if it doesn't exist
            dir_path = os.path.dirname(file_path)
            if dir_path:  # Only create directory if path is not empty
                os.makedirs(dir_path, exist_ok=True)

            # Write the code to the file
            print(f"Creating file: {file_path}")
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(code_content + '\n')
        except Exception as e:
            print(f"Error processing {file_path}: {str(e)}")

if __name__ == "__main__":
    readme_path = "README.md"
    if not os.path.exists(readme_path):
        print(f"Error: {readme_path} not found!")
        exit(1)

    extract_files_from_readme(readme_path)
    print("File extraction complete!")
