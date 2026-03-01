const fs = require('fs');
try {
    const raw = fs.readFileSync('eslint_report.json', 'utf16le');
    let data;
    try {
        data = JSON.parse(raw);
    } catch (e) {
        const raw8 = fs.readFileSync('eslint_report.json', 'utf8');
        data = JSON.parse(raw8);
    }

    const errors = data.filter(f => f.errorCount > 0).map(f => {
        return {
            file: f.filePath,
            errors: f.messages.filter(m => m.severity === 2).map(m => `Line ${m.line}: ${m.message} (${m.ruleId})`)
        };
    });
    console.log(JSON.stringify(errors, null, 2));
} catch (err) {
    console.error(err.message);
}
