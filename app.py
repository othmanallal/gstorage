from flask import Flask, request, jsonify, render_template, redirect, url_for
from google.cloud import storage
import datetime
import logging
import os
import random
import string

app = Flask(__name__, template_folder='templates', static_folder='static')

# Setup logging
logging.basicConfig(level=logging.INFO, filename='app.log', filemode='a',
                    format='%(asctime)s - %(levelname)s - %(message)s')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload_credentials', methods=['POST'])
def upload_credentials():
    try:
        file = request.files['credentials']
        filepath = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'credentials.json')  # Adjust the path as necessary
        file.save(filepath)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = filepath
        logging.info("Credentials uploaded successfully.")
        return jsonify(message="Credentials uploaded successfully!")
    except Exception as e:
        logging.error(f"Failed to upload credentials: {e}")
        return jsonify(message="Failed to upload credentials"), 500

@app.route('/create_bucket', methods=['POST'])
def create_bucket():
    try:
        bucket_name = request.json['bucket_name']
        storage_client = storage.Client()
        bucket = storage_client.create_bucket(bucket_name)
        logging.info(f"Bucket {bucket.name} created successfully.")
        return jsonify(message=f"Bucket {bucket.name} created successfully.")
    except Exception as e:
        logging.error(f"Failed to create bucket: {e}")
        return jsonify(message="Failed to create bucket"), 500

@app.route('/upload_file', methods=['POST'])
def upload_file():
    try:
        file = request.files['file']
        bucket_name = request.form['bucket_name']
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file.filename)
        blob.upload_from_file(file, content_type=file.content_type)
        blob.content_disposition = 'inline; filename="{}"'.format(file.filename)
        blob.patch()
        logging.info(f"File {file.filename} uploaded successfully with inline access.")
        return jsonify(message=f"File {file.filename} uploaded successfully, ready for inline viewing.")
    except Exception as e:
        logging.error(f"Failed to upload file: {e}")
        return jsonify(message="Failed to upload file"), 500

@app.route('/make_bucket_public_and_list_files', methods=['POST'])
def make_bucket_public_and_list_files():
    bucket_name = request.form['bucket_name']
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    try:
        bucket.make_public(recursive=True, future=True)
        blobs = bucket.list_blobs()
        file_urls = [{"name": blob.name, "url": blob.public_url} for blob in blobs]
        return jsonify(file_urls)
    except Exception as e:
        logging.error(f"Error making bucket public or listing files: {e}")
        return jsonify(message=f"Failed to make bucket public or list files: {e}"), 500

@app.route('/delete_bucket', methods=['POST'])
def delete_bucket():
    try:
        bucket_name = request.json['bucket_name']
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        bucket.delete(force=True)
        logging.info(f"Bucket {bucket_name} deleted successfully.")
        return jsonify(message=f"Bucket {bucket_name} deleted successfully.")
    except Exception as e:
        logging.error(f"Failed to delete bucket {bucket_name}: {e}")
        return jsonify(message=f"Failed to delete bucket {bucket_name}"), 500

@app.route('/delete_all_buckets', methods=['POST'])
def delete_all_buckets():
    try:
        storage_client = storage.Client()
        buckets = storage_client.list_buckets()
        for bucket in buckets:
            bucket.delete(force=True)  # Deletes non-empty buckets
            logging.info(f"Deleted bucket: {bucket.name}")
        return jsonify(message="All buckets deleted successfully.")
    except Exception as e:
        logging.error(f"Failed to delete all buckets: {e}")
        return jsonify(message="Failed to delete all buckets"), 500

@app.route('/logs')
def logs():
    try:
        with open('app.log', 'r') as log_file:
            log_contents = log_file.readlines()
        return render_template('logs.html', logs=log_contents)
    except Exception as e:
        logging.error(f"Failed to display logs: {e}")
        return "Error loading logs", 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
