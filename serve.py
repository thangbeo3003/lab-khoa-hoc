"""Máy chủ thử cho Lab Khoa Học: phục vụ file tĩnh, tắt bộ nhớ đệm để sửa mã là thấy ngay.
Chạy: python3 serve.py [cổng]"""
import http.server, os, re, sys

SHOT_DIR = '/Volumes/KINGSTON/DINO_render/lab_khoa_hoc/compare_look'

class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.mjs': 'text/javascript'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a):
        pass
    def do_POST(self):
        # Công cụ thử: trang gửi ảnh chụp khung 3D về để lưu lên SSD (/__shot?name=ten_anh). SSD không gắn thì báo lỗi, không ghi vào ổ máy.
        m = re.fullmatch(r'/__shot\?name=([a-z0-9_]{1,40})', self.path)
        if not m or not os.path.isdir(SHOT_DIR):
            self.send_response(503 if m else 404); self.end_headers(); return
        data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        with open(os.path.join(SHOT_DIR, m.group(1) + '.jpg'), 'wb') as f:
            f.write(data)
        self.send_response(200); self.end_headers(); self.wfile.write(b'ok')

os.chdir(os.path.dirname(os.path.abspath(__file__)))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 5183
http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
