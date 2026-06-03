import os
import re

def fix_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # replace aliases
    content = content.replace('@/app/router', '@/router')
    content = content.replace('@/app/layout', '@/components/layouts')
    content = content.replace('@/styles', '@/assets/styles')
    content = content.replace('@/form-builder', '@/components/form-builder')
    content = content.replace('@/types', '@/model/types')
    content = content.replace('@/stories', '@/components/stories')
    
    # replace relative paths (just replace them globally if they match the exact structure)
    # wait, relative paths can be ../../app/layout, so let's use regex
    content = re.sub(r'([\'"])((\.\./)+)app/router(.*?)[\'"]', r'\1\2router\4\1', content)
    content = re.sub(r'([\'"])((\.\./)+)app/layout(.*?)[\'"]', r'\1\2components/layouts\4\1', content)
    content = re.sub(r'([\'"])((\.\./)+)styles(.*?)[\'"]', r'\1\2assets/styles\4\1', content)
    content = re.sub(r'([\'"])((\.\./)+)form-builder(.*?)[\'"]', r'\1\2components/form-builder\4\1', content)
    content = re.sub(r'([\'"])((\.\./)+)types(.*?)[\'"]', r'\1\2model/types\4\1', content)
    content = re.sub(r'([\'"])((\.\./)+)stories(.*?)[\'"]', r'\1\2components/stories\4\1', content)

    # absolute ones
    content = content.replace('src/app/router', 'src/router')
    content = content.replace('src/app/layout', 'src/components/layouts')
    content = content.replace('src/styles', 'src/assets/styles')
    content = content.replace('src/form-builder', 'src/components/form-builder')
    content = content.replace('src/types', 'src/model/types')
    content = content.replace('src/stories', 'src/components/stories')

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file_path}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.vue', '.css')):
            fix_imports(os.path.join(root, file))
            
# also fix main.ts which might have './app/router' and './styles/app.css'
with open('src/main.ts', 'r', encoding='utf-8') as f:
    main_content = f.read()

new_main_content = main_content.replace('./app/router', './router').replace('./styles/app.css', './assets/styles/app.css')
if main_content != new_main_content:
    with open('src/main.ts', 'w', encoding='utf-8') as f:
        f.write(new_main_content)
    print("Fixed src/main.ts")

