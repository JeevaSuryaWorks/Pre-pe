import json

try:
    with open('eslint_utf8.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    for file_result in data:
        if file_result.get('errorCount', 0) > 0:
            print(f"\nFILE: {file_result['filePath']}")
            for msg in file_result.get('messages', []):
                if msg.get('severity') == 2:
                    print(f"  Line {msg.get('line')}: {msg.get('message')} ({msg.get('ruleId')})")
except Exception as e:
    print(e)
