import json

# Frontend
with open('/Users/syillaeltaniadaffa/Documents/Warehouse/package.json', 'r') as f:
    pkg = json.load(f)

with open('/Users/syillaeltaniadaffa/Documents/Neuron/Pegadaian/Revamp/Frontend/remote-hc-sppd/package.json', 'r') as f:
    sppd_pkg = json.load(f)

# merge scripts
for script in ["danger:lint-report", "danger:ci", "prettier", "lint", "prepare"]:
    if script in sppd_pkg.get("scripts", {}):
        pkg.setdefault("scripts", {})[script] = sppd_pkg["scripts"][script]

# lint-staged
if "lint-staged" in sppd_pkg:
    pkg["lint-staged"] = sppd_pkg["lint-staged"]

# devDependencies
deps_to_copy = [
    "danger", "danger-plugin-istanbul-coverage", "danger-plugin-lint-report", "danger-plugin-pull-request",
    "husky", "lint-staged", "eslint", "prettier", "eslint-config-prettier", "eslint-plugin-prettier",
    "eslint-formatter-checkstyle", "eslint-plugin-vue", "@eslint/eslintrc", "@eslint/js", 
    "@typescript-eslint/eslint-plugin", "vue-eslint-parser", "globals", "eslint-import-resolver-alias",
    "@vue/eslint-config-prettier", "@vue/eslint-config-typescript", "eslint-plugin-sonarjs"
]

for dep in deps_to_copy:
    if dep in sppd_pkg.get("devDependencies", {}):
        pkg.setdefault("devDependencies", {})[dep] = sppd_pkg["devDependencies"][dep]

with open('/Users/syillaeltaniadaffa/Documents/Warehouse/package.json', 'w') as f:
    json.dump(pkg, f, indent=2)

print("Updated Warehouse/package.json")
