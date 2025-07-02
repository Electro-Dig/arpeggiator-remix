#!/bin/bash

echo "==========================================="
echo "启动本地开发服务器 - Arpeggiator Project"
echo "==========================================="
echo

# 检查Python是否安装
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "[ERROR] 未检测到Python，请先安装Python"
    echo "Ubuntu/Debian: sudo apt install python3"
    echo "macOS: brew install python3"
    echo "或访问: https://www.python.org/downloads/"
    exit 1
fi

# 检查当前目录是否包含index.html
if [ ! -f "index.html" ]; then
    echo "[ERROR] 当前目录下未找到index.html文件"
    echo "请确保在项目根目录下运行此脚本"
    exit 1
fi

echo "[INFO] 启动HTTP服务器..."
echo "[INFO] 服务器地址: http://localhost:8000"
echo "[INFO] 按 Ctrl+C 停止服务器"
echo
echo "[TIPS] 摄像头访问需要在 localhost 或 HTTPS 环境下运行"
echo "==========================================="
echo

# 检查使用哪个Python命令
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m http.server 8000
fi 