import os

files_to_update = [
    ".gitlab-ci.yml",
    "pipeline.json",
    "dangerfile.ts",
    "Dockerfile",
    ".dockerignore",
    "eslint.config.mjs"
]

# also update .husky scripts if there are any mentions
for root, _, files in os.walk('.husky'):
    for file in files:
        files_to_update.append(os.path.join(root, file))

for file_path in files_to_update:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace("remote-hc-sppd", "rfid-web-app")
    new_content = new_content.replace("remote_hc_sppd", "rfid_web_app")
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")

