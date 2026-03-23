@echo off
chcp 65001 >nul
echo ======================================
echo    中医处方结算系统 - Windows 启动脚本
echo ======================================
echo.

REM 检查 Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] 检查 Node.js 版本...
node -v
echo.

REM 进入项目目录
cd /d "%~dp0"

REM 检查 node_modules
if not exist "node_modules" (
    echo [2/3] 首次运行，正在安装依赖...
    echo 这可能需要几分钟，请耐心等待...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo [2/3] 依赖已安装，跳过
)

echo.
echo [3/3] 启动开发服务器...
echo.
echo ======================================
echo  启动成功！请用浏览器访问：
echo  http://localhost:3000
echo ======================================
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm run dev

pause