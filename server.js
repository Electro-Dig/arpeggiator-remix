import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// 静态文件服务
app.use(express.static(__dirname));

// 添加必要的头部以支持ES模块和摄像头
app.use((req, res, next) => {
    // CORS 头部
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // 支持SharedArrayBuffer（如果需要）
    res.header('Cross-Origin-Embedder-Policy', 'require-corp');
    res.header('Cross-Origin-Opener-Policy', 'same-origin');
    
    next();
});

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// 安全的证书管理系统
function loadTLSConfig() {
    // 优先使用环境变量中的证书路径
    const certPath = process.env.TLS_CERT_PATH;
    const keyPath = process.env.TLS_KEY_PATH;
    
    if (certPath && keyPath) {
        try {
            return {
                cert: fs.readFileSync(certPath, 'utf8'),
                key: fs.readFileSync(keyPath, 'utf8')
            };
        } catch (error) {
            console.warn('⚠️  无法读取自定义证书文件，将使用开发模式');
        }
    }
    
    // 开发环境：生成临时证书（仅用于测试）
    return generateDevCertificate();
}

function generateDevCertificate() {
    console.log('🔧 开发模式：生成临时自签名证书');
    // 这里可以集成 selfsigned 库或其他证书生成工具
    // 为了不破坏现有功能，暂时返回 null，使用 HTTP
    return null;
}

// 启动服务器
function startServer() {
    const isDev = process.argv.includes('--dev');
    const tlsConfig = loadTLSConfig();
    
    if (tlsConfig) {
        // 使用HTTPS
        https.createServer(tlsConfig, app).listen(PORT, () => {
            console.log('🚀 HTTPS服务器运行在: https://localhost:' + PORT);
            console.log('💡 在浏览器中访问: https://localhost:' + PORT);
            console.log('📹 摄像头权限需要HTTPS才能正常工作');
            console.log('\n按 Ctrl+C 停止服务器');
        });
    } else {
        // 降级到HTTP模式
        console.log('⚠️  未配置TLS证书，使用HTTP模式');
        startHttpServer();
    }
}

function startHttpServer() {
    http.createServer(app).listen(PORT, () => {
        console.log('🚀 HTTP服务器运行在: http://localhost:' + PORT);
        console.log('💡 在浏览器中访问: http://localhost:' + PORT);
        console.log('⚠️  摄像头功能需要HTTPS，建议使用 npm run dev');
        console.log('\n按 Ctrl+C 停止服务器');
    });
}

console.log('=' * 50);
console.log('🎵 Arpeggiator 本地服务器');
console.log('=' * 50);

startServer(); 