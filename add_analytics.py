#!/usr/bin/env python3
import os
import re

# Google Analytics代码
GA_CODE = '''<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Q9YR4PJLDB"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-Q9YR4PJLDB');
</script>'''

# 遍历journal目录下的所有HTML文件
for filename in os.listdir('journal'):
    if not filename.endswith('.html') or filename == 'recurring.html':
        # 跳过非HTML文件和已处理的recurring.html
        continue
    
    filepath = os.path.join('journal', filename)
    print(f"Processing {filepath}...")
    
    # 读取文件内容
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 检查是否已经包含Google Analytics代码
    if 'G-Q9YR4PJLDB' in content:
        print(f"Google Analytics already exists in {filepath}, skipping...")
        continue
    
    # 在<meta name="robots" content="index, follow">标签后插入Google Analytics代码
    pattern = r'(<meta name="robots" content="index, follow">)'
    replacement = r'\1\n    ' + GA_CODE
    
    new_content = re.sub(pattern, replacement, content)
    
    # 写回文件
    with open(filepath, 'w', encoding='utf-8') as file:
        file.write(new_content)
    
    print(f"Added Google Analytics to {filepath}")

print("All files processed successfully!") 