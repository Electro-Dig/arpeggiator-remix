#!/usr/bin/env python3
"""
简单的HTTP服务器用于运行Arpeggiator应用
支持HTTPS以便摄像头访问正常工作
支持网络访问，允许手机等设备通过WiFi连接
"""

import http.server
import socketserver
import ssl
import os
import sys
import socket
from pathlib import Path

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加CORS头部以支持模块加载
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def get_local_ip():
    """获取本机在局域网中的IP地址"""
    try:
        # 连接到一个远程地址来获取本机IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"

def create_self_signed_cert():
    """创建自签名证书用于HTTPS"""
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        import datetime
        import ipaddress
        
        # 生成私钥
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        
        # 创建证书
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COMMON_NAME, u"localhost"),
        ])
        
        # 获取本机IP地址
        local_ip = get_local_ip()
        
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.datetime.utcnow()
        ).not_valid_after(
            datetime.datetime.utcnow() + datetime.timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName(u"localhost"),
                x509.IPAddress(ipaddress.IPv4Address(u"127.0.0.1")),
                x509.IPAddress(ipaddress.IPv4Address(local_ip)),
            ]),
            critical=False,
        ).sign(private_key, hashes.SHA256())
        
        # 保存证书和私钥
        with open("server.crt", "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        
        with open("server.key", "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
            
        return True
    except ImportError:
        print("警告: 无法创建HTTPS证书，cryptography库未安装")
        print("运行: pip install cryptography")
        return False

def run_server():
    PORT = 8000
    HOST = "0.0.0.0"  # 绑定到所有网络接口
    
    # 获取本机IP地址
    local_ip = get_local_ip()
    
    # 检查是否存在证书文件
    cert_exists = os.path.exists("server.crt") and os.path.exists("server.key")
    
    if not cert_exists:
        print("正在创建HTTPS证书...")
        if not create_self_signed_cert():
            print("无法创建HTTPS证书，使用HTTP模式")
            use_https = False
        else:
            use_https = True
            print("HTTPS证书创建成功")
    else:
        use_https = True
        print("使用现有HTTPS证书")
    
    # 创建服务器
    with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
        if use_https:
            try:
                # 配置SSL
                context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
                context.load_cert_chain("server.crt", "server.key")
                httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
                
                print(f"🚀 HTTPS服务器运行在端口 {PORT}")
                print("💡 在设备上访问以下地址:")
                print(f"   📱 手机访问: https://{local_ip}:{PORT}")
                print(f"   💻 本机访问: https://localhost:{PORT}")
                print("📹 摄像头权限需要HTTPS才能正常工作")
                print("⚠️  浏览器可能显示安全警告，点击'高级'->继续访问即可")
                
            except Exception as e:
                print(f"HTTPS启动失败: {e}")
                print("降级到HTTP模式")
                use_https = False
        
        if not use_https:
            print(f"🚀 HTTP服务器运行在端口 {PORT}")
            print("💡 在设备上访问以下地址:")
            print(f"   📱 手机访问: http://{local_ip}:{PORT}")
            print(f"   💻 本机访问: http://localhost:{PORT}")
            print("⚠️  摄像头功能需要HTTPS，建议安装cryptography库并重新运行")
        
        print(f"\n🌐 确保设备连接到同一WiFi网络")
        print(f"📍 服务器IP地址: {local_ip}")
        print("\n按 Ctrl+C 停止服务器")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")

if __name__ == "__main__":
    # 确保在项目目录中运行
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    print("=" * 50)
    print("🎵 Arpeggiator 网络服务器")
    print("=" * 50)
    
    run_server() 