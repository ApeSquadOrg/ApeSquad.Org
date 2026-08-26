# server.py

import http.server
import socketserver
import webbrowser
import os

# --- Configuration ---
PORT = 8000  # You can change this port number if you want

# Find the directory where the script is located and serve files from there.
web_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(web_dir)

# --- THE FIX ---
# We use ThreadingTCPServer instead of TCPServer so it can load multiple files (CSS, JS, Images) at the exact same time.
# We also use "127.0.0.1" instead of "" to prevent slow "localhost" DNS lookups.
Handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler)

# --- Start the server ---
print(f"Serving your website at http://127.0.0.1:{PORT}")
print(f"Serving files from directory: {web_dir}")
print("Press Ctrl+C to stop the server.")

# Automatically open the web browser to your site
webbrowser.open_new_tab(f'http://127.0.0.1:{PORT}')

try:
    # This keeps the server running until you stop it
    httpd.serve_forever()
except KeyboardInterrupt:
    pass

# Cleanly stop the server
httpd.server_close()
print("\nServer stopped.")