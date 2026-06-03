import { danger, fail, warn, schedule, markdown, message } from "danger";
import { scan } from "danger-plugin-lint-report";
import * as pullRequest from "danger-plugin-pull-request";
import * as fs from "node:fs";
import { istanbulCoverage } from "danger-plugin-istanbul-coverage";

const branch = danger.gitlab.mr.source_branch;

interface CoverageDetail {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
}

interface CoverageReport {
    total: {
        lines: CoverageDetail;
        statements: CoverageDetail;
        functions: CoverageDetail;
        branches: CoverageDetail;
        branchesTrue: CoverageDetail;
    };
}

async function checkLargeFiles() {
    const MAX_FILE_SIZE_2048_KB = 2048;
    const changedFiles = [
        ...danger.git.modified_files,
        ...danger.git.created_files,
    ];
    const largeFiles = await Promise.all(
        changedFiles.map(async (path) => {
            const file = await danger.git.diffForFile(path);
            const size = Buffer.byteLength(file?.after || "", "utf8");
            return size > MAX_FILE_SIZE_2048_KB * 1024 ? { path, size } : null;
        }),
    ).then((results) => results.filter(Boolean));

    if (largeFiles.length > 0) {
        const tableHeader = "| File | Size (KB) |\n|------|-----------|";
        const tableBody = largeFiles
            .map(
                ({ path, size }) => `| ${path} | ${(size / 1024).toFixed(2)} |`,
            )
            .join("\n");
        fail(
            `🚩 Some files are too large! The following files exceed **2048KB** (2MB):\n\n${tableHeader}\n${tableBody}`,
        );
    }
}

async function unitTestReport() {
    const coverageReportPath =
        "./test/report/unit/coverage/coverage-summary.json";

    if (!fs.existsSync(coverageReportPath)) {
        warn(
            `⚠️ Coverage report **${coverageReportPath}** not found! Make sure tests generate coverage.`,
        );
        return;
    }

    const rawData = fs.readFileSync(coverageReportPath, "utf8");

    if (!rawData.trim()) {
        warn(`⚠️ Coverage report **${coverageReportPath}** is empty!`);
        return;
    }

    let coverageData: CoverageReport;
    try {
        coverageData = JSON.parse(rawData);
    } catch (error) {
        fail(`❌ Failed to parse coverage JSON: ${error.message}`);
        return;
    }

    if (!coverageData || typeof coverageData !== "object") {
        fail("❌ Invalid coverage report format! Expected an object.");
        return;
    }

    if (
        +coverageData.total.branches.pct < 50 ||
        +coverageData.total.functions.pct < 50
    ) {
        fail("❌ **Test coverage is critically low! Must be improved.**");
    } else if (
        +coverageData.total.branches.pct < 80 ||
        +coverageData.total.functions.pct < 80
    ) {
        warn("⚠️ **Test coverage is below 80%! Consider adding more tests.**");
    } else {
        message("✅ **Great job! Test coverage is above 80%.** 🎉");
    }

    const { lines, functions, branches } = coverageData.total;
    const htmlTable = `
## 📊 **Code Coverage Report**
<table>
    <thead>
        <tr>
            <th width="100%">Metric</th>
            <th width="100%">Covered</th>
            <th width="100%">Total</th>
            <th width="100%">Percentage</th>
            <th width="100%">  </th>
        </tr>
    </thead>
    <tr>
        <td>Functions</td>
        <td>${functions.total}</td>
        <td>${functions.covered}</td>
        <td>${functions.pct}%</td>
        <td>${lines.pct >= 80 ? "✅" : "❌"}</td>
    </tr>
    <tr>
        <td>Branches</td>
        <td>${branches.total}</td>
        <td>${branches.covered}</td>
        <td>${branches.pct}%</td>
        <td>${lines.pct >= 80 ? "✅" : "❌"}</td>
    </tr>
</table>
`;
    markdown(htmlTable);
}

async function unitTestCoverageReport() {
    const coverageFile = "./test/report/unit/coverage/lcov.info";
    schedule(
        istanbulCoverage({
            customSuccessMessage: "Congrats, coverage is good",
            customFailureMessage:
                "Test coverage is critically low! Must be improved.",
            entrySortMethod: "alphabetically",
            coveragePath: {
                path: coverageFile,
                type: "lcov",
            },
            reportFileSet: "createdOrModified",
            reportMode: "fail",
            threshold: {
                statements: 50,
                branches: 80,
                functions: 80,
                lines: 50,
            },
        }),
    );
}

if (!/^(feature\/.*\/v[\d.]+|rc\/v[\d.]+|hotfix\/v[\d.]+)$/.test(branch)) {
    pullRequest.checkAssignees(
        () =>
            `👥 Please ensure this PR has at least one assignee to keep things organized and accountable.`,
    );
    pullRequest.checkDescription(
        100,
        () =>
            `✍️ PR Description is too short! Please provide at least 100 characters describing the context and purpose of this PR.`,
    );
    pullRequest.checkTitle(
        /^\[[A-Za-z]+-\d+]/,
        `[TICKET-ID] <description>`,
        () =>
            `📝 PR Title Check: Your title should follow the format [TICKET-ID] <description>. This ensures consistency and easy tracking!`,
    );
    pullRequest.checkPRSize(
        50,
        () =>
            `⚠️ This PR has too many changes! Try to keep it under 50 files for easier reviews and better collaboration.`,
    );
    pullRequest.checkMergeSquashChecked(
        () =>
            `⚡ Merge Strategy Alert: Please ensure *Squash and Merge* is selected for a cleaner commit history.`,
    );
    pullRequest.checkDeleteSourceBranchChecked(
        () =>
            `🗑️ Source Branch Cleanup: Please ensure *Delete source branch* is checked after merging to avoid unused branches cluttering the repository.`,
    );

    checkLargeFiles().then();
    unitTestReport().then();
    // unitTestCoverageReport().then()

    schedule(
        scan({
            fileMask: "**/reports/lint-results.xml",
            reportSeverity: true,
            requireLineModification: true,
        }),
    );
}
