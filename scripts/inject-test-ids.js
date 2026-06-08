/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_TAGS = ["Button", "Input", "Select", "Card", "AppTable", "Table"];

function processVueFile(filePath) {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    let tagCounter = 0;

    TARGET_TAGS.forEach((tag) => {
        const regex = new RegExp(`<${tag}(?=[\\s>\\/])([^>]*?)(>)`, "gs");

        content = content.replace(regex, (match, attrs) => {
            if (/data-testid=/.test(attrs) || /data-test-id=/.test(attrs)) {
                return match;
            }

            modified = true;
            tagCounter++;

            let idContext = "";

            const clickMatch = attrs.match(/@click(?:\\.[a-z]+)*="([^"]+)"/);
            if (clickMatch) {
                idContext = `-${clickMatch[1].replace(/[^a-zA-Z0-9]/g, "-")}`;
            } else {
                const modelMatch = attrs.match(/v-model(?:[^=]*)="([^"]+)"/);
                if (modelMatch) {
                    idContext = `-${modelMatch[1].replace(/[^a-zA-Z0-9]/g, "-")}`;
                } else {
                    idContext = `-${tagCounter}`;
                }
            }

            idContext = idContext
                .replace(/-+/g, "-")
                .replace(/-$/, "")
                .toLowerCase();

            const testId = `data-testid="${tag.toLowerCase()}${idContext}"`;

            if (attrs.endsWith("/")) {
                const attrsWithoutSlash = attrs.slice(0, -1);
                return `<${tag}${attrsWithoutSlash} ${testId} />`;
            } else {
                return `<${tag}${attrs} ${testId}>`;
            }
        });
    });

    if (modified) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith(".vue")) {
            processVueFile(fullPath);
        }
    }
}

const srcPath = path.join(__dirname, "..", "src");
console.log("Scanning", srcPath);
walkDir(srcPath);
console.log("Done.");
