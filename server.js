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

// 创建自签名证书用于HTTPS（如果不存在）
function createSelfSignedCert() {
    const cert = `-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQC7QjKl5hHhIDANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAls
b2NhbGhvc3QwHhcNMjQwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjAUMRIwEAYD
VQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7
QjKl5hHhIDANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAlsb2NhbGhvc3QwHhcN
MjQwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjAUMRIwEAYDVQQDDAlsb2NhbGhv
c3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7...
-----END CERTIFICATE-----`;

    const key = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7QjKl5hHhIDANB
gkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAlsb2NhbGhvc3QwHhcNMjQwMTAxMDAwMD
AwWhcNMjUwMTAxMDAwMDAwWjAUMRIwEAYDVQQDDAlsb2NhbGhvc3QwggEiMA0GCSq
GSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7...
-----END PRIVATE KEY-----`;

    if (!fs.existsSync('server.crt')) {
        fs.writeFileSync('server.crt', cert);
    }
    if (!fs.existsSync('server.key')) {
        fs.writeFileSync('server.key', key);
    }
}

// 启动服务器
function startServer() {
    const isDev = process.argv.includes('--dev');
    
    if (isDev || fs.existsSync('server.crt')) {
        try {
            // 尝试使用HTTPS
            if (!fs.existsSync('server.crt')) {
                createSelfSignedCert();
            }
            
            const httpsOptions = {
                key: fs.readFileSync('server.key'),
                cert: fs.readFileSync('server.crt')
            };
            
            https.createServer(httpsOptions, app).listen(PORT, () => {
                console.log('🚀 HTTPS服务器运行在: https://localhost:' + PORT);
                console.log('💡 在浏览器中访问: https://localhost:' + PORT);
                console.log('📹 摄像头权限需要HTTPS才能正常工作');
                console.log('⚠️  浏览器可能显示安全警告，点击"高级"->继续访问即可');
                console.log('\n按 Ctrl+C 停止服务器');
            });
        } catch (error) {
            console.log('HTTPS启动失败，降级到HTTP模式:', error.message);
            startHttpServer();
        }
    } else {
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