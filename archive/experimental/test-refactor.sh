#!/bin/bash

echo "🔧 测试重构后的应用..."

# 检查语法错误
echo "1. 检查JavaScript语法..."
node -c main.js && echo "✅ main.js 语法正确" || echo "❌ main.js 有语法错误"
node -c StateManager.js && echo "✅ StateManager.js 语法正确" || echo "❌ StateManager.js 有语法错误"
node -c DIContainer.js && echo "✅ DIContainer.js 语法正确" || echo "❌ DIContainer.js 有语法错误"
node -c server.js && echo "✅ server.js 语法正确" || echo "❌ server.js 有语法错误"

# 检查安全性
echo ""
echo "2. 检查安全性改进..."
if grep -q "BEGIN.*PRIVATE.*KEY" server.js; then
    echo "❌ 仍然存在硬编码私钥"
else
    echo "✅ 已移除硬编码证书"
fi

if grep -q "loadTLSConfig" server.js; then
    echo "✅ 已实现安全证书管理"
else
    echo "❌ 缺少安全证书管理"
fi

# 检查架构改进
echo ""
echo "3. 检查架构改进..."
if grep -q "StateManager" main.js; then
    echo "✅ 已集成状态管理器"
else
    echo "❌ 缺少状态管理器"
fi

if grep -q "DIContainer" main.js; then
    echo "✅ 已集成依赖注入"
else
    echo "❌ 缺少依赖注入"
fi

if grep -q "errorHandler" main.js; then
    echo "✅ 已集成错误处理"
else
    echo "❌ 缺少错误处理"
fi

echo ""
echo "🎉 重构测试完成！"