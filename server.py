# server.py

import http.server
import socketserver
import webbrowser
import os

# --- Configuration ---
PORT = 8000  # You can change this port number if you want

# This is the magic part that makes it work from any folder
# It finds the directory where the script is located and serves files from there.
web_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(web_dir)

# This sets up the simple server
Handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(("", PORT), Handler)

# --- Start the server ---
print(f"Serving your website at http://localhost:{PORT}")
print(f"Serving files from directory: {web_dir}")
print("Press Ctrl+C to stop the server.")

# Automatically open the web browser to your site
webbrowser.open_new_tab(f'http://localhost:{PORT}')

try:
    # This keeps the server running until you stop it
    httpd.serve_forever()
except KeyboardInterrupt:
    pass

# Cleanly stop the server
httpd.server_close()
print("\nServer stopped.")