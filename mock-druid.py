#!/usr/bin/env python3
"""
Simple mock Druid server for testing
"""
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys
import threading
import time

class MockDruidHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "healthy", "version": "28.0.1-mock"}
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == '/druid/v2/datasources':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = ["wikipedia", "koalas", "flights"]
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path.startswith('/druid/coordinator/v1/datasources/'):
            datasource = self.path.split('/')[-1]
            if datasource == 'segments':
                datasource = self.path.split('/')[-2]
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = [
                    {
                        "dataSource": datasource,
                        "interval": "2023-01-01T00:00:00.000Z/2023-01-02T00:00:00.000Z",
                        "version": "2023-01-01T00:00:00.000Z",
                        "partition": 0,
                        "size": 1000000
                    }
                ]
                self.wfile.write(json.dumps(response).encode())
            else:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {
                    "name": datasource,
                    "segments": {
                        "intervals": ["2023-01-01T00:00:00.000Z/2023-01-02T00:00:00.000Z"]
                    },
                    "columns": [
                        {"name": "timestamp", "type": "LONG"},
                        {"name": "count", "type": "LONG"},
                        {"name": "dimension", "type": "STRING"}
                    ],
                    "queryGranularity": "none",
                    "segmentGranularity": "day",
                    "rollup": False
                }
                self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
            
    def do_POST(self):
        if self.path == '/druid/v2/sql':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # Mock SQL response
            response = [
                ["test"],
                [1]
            ]
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
            
    def log_message(self, format, *args):
        print(f"Mock Druid: {format % args}")

def run_server():
    server_address = ('', 8082)
    httpd = HTTPServer(server_address, MockDruidHandler)
    print("Mock Druid server running on port 8082...")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()