@echo off
echo ===========================================
echo 启动本地开发服务器 - Arpeggiator Project
echo ===========================================
echo.

:: 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 未检测到Python，请先安装Python
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 检查当前目录是否包含index.html
if not exist "index.html" (
    echo [ERROR] 当前目录下未找到index.html文件
    echo 请确保在项目根目录下运行此脚本
    pause
    exit /b 1
)

echo [INFO] 启动HTTP服务器...
echo [INFO] 服务器地址: http://localhost:8000
echo [INFO] 按 Ctrl+C 停止服务器
echo.
echo [TIPS] 摄像头访问需要在 localhost 或 HTTPS 环境下运行
echo ===========================================
echo.

:: 启动Python HTTP服务器
python -m http.server 8000

pause 