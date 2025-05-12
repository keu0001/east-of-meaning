#!/bin/bash

# Google Analytics代码
GA_CODE='<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Q9YR4PJLDB"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());

  gtag("config", "G-Q9YR4PJLDB");
</script>'

# 遍历journal目录下的所有HTML文件
for file in journal/*.html; do
  # 跳过已经处理过的recurring.html文件
  if [ "$file" == "journal/recurring.html" ]; then
    echo "Skipping $file (already processed)"
    continue
  fi
  
  echo "Processing $file..."
  
  # 使用sed插入Google Analytics代码在<meta name="robots" content="index, follow">标签之后
  sed -i '' "/<meta name=\"robots\" content=\"index, follow\">/a\\
$GA_CODE" "$file"
  
  echo "Added Google Analytics to $file"
done

echo "All files processed successfully!" 