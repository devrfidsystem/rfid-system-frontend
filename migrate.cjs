const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");

const atomComponents = [
    "Badge.vue",
    "Button.vue",
    "Icon.vue",
    "IconButton.vue",
    "Input.vue",
    "Select.vue",
    "Textarea.vue",
];
const moleculeComponents = [
    "Breadcrumb.vue",
    "Card.vue",
    "FormField.vue",
    "PageHeader.vue",
    "EmptyState.vue",
];
const organismComponents = [
    "ConfirmDialog.vue",
    "Dialog.vue",
    "Drawer.vue",
    "Modal.vue",
    "Table.vue",
    "Toast.vue",
    "ToastContainer.vue",
    "DataTable",
];

const mapping = {};

function addMapping(components, category) {
    components.forEach((c) => {
        const name = c.replace(".vue", "");
        mapping[`@/components/ui/${name}`] = `@/components/${category}/${name}`;
        mapping[`@/components/ui/${c}`] = `@/components/${category}/${c}`;
        mapping[`./ui/${name}`] = `./${category}/${name}`; // Relative paths from components dir
        mapping[`../ui/${name}`] = `../${category}/${name}`;
    });
}

addMapping(atomComponents, "atoms");
addMapping(moleculeComponents, "molecules");
addMapping(organismComponents, "organisms");

// Move files
const uiDir = path.join(srcDir, "components", "ui");
const moveFile = (file, category) => {
    const oldPath = path.join(uiDir, file);
    const newPath = path.join(srcDir, "components", category, file);
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
    }
};

atomComponents.forEach((c) => moveFile(c, "atoms"));
moleculeComponents.forEach((c) => moveFile(c, "molecules"));
organismComponents.forEach((c) => moveFile(c, "organisms"));

// Process all vue/ts files
function processFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processFiles(fullPath);
        } else if (fullPath.endsWith(".vue") || fullPath.endsWith(".ts")) {
            let content = fs.readFileSync(fullPath, "utf8");
            let changed = false;
            for (const [oldImport, newImport] of Object.entries(mapping)) {
                if (content.includes(oldImport)) {
                    // Replace exactly to avoid matching prefixes
                    content = content.replace(
                        new RegExp(
                            oldImport.replace(/\./g, "\\.") + "(?=['\"])",
                            "g",
                        ),
                        newImport,
                    );
                    changed = true;
                }
            }
            if (changed) {
                fs.writeFileSync(fullPath, content, "utf8");
            }
        }
    }
}

processFiles(srcDir);
console.log("Migration complete");
