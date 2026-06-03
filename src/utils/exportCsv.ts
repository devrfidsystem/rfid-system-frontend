export const exportCsv = <T extends Record<string, unknown>>(
    rows: T[],
    filename: string,
) => {
    if (!rows.length) {
        return;
    }
    const headers = Array.from(
        new Set(rows.flatMap((row) => Object.keys(row))),
    );
    const quote = (value: unknown) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;
    const content = [
        headers.join(","),
        ...rows.map((row) =>
            headers.map((header) => quote(row[header] ?? "")).join(","),
        ),
    ].join("\r\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
