function setLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.textContent = 'Loading...';
    } else {
        button.disabled = false;
        button.textContent = button.getAttribute('data-original-text');
    }
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function generateLink() {
    const url = document.getElementById('link-url').value;
    const suffix = document.getElementById('link-suffix').value;
    const bucketName = document.getElementById('link-bucket-name').value;
    const randomString = generateRandomString(10);
    const fileName = `${suffix}-${randomString}.html`;
    const fileContent = `
        <script>
            url = "${url}";
            hash = window.location.hash.replace('#', '');
            if(hash.length > 0) {
                location.replace(url + "#" + hash);
            } else {
                location.replace(url);
            }
        </script>
    `;
    const blob = new Blob([fileContent], { type: 'text/html' });
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('bucket_name', bucketName);
    
    const button = event.target;
    setLoading(button, true);

    fetch(`/upload_file`, {
        method: 'POST',
        body: formData
    }).then(response => response.json()).then(data => {
        const link = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        displayGeneratedLink(link);
        setLoading(button, false);
    }).catch(() => setLoading(button, false));
}

function displayGeneratedLink(link) {
    const generatedLinksDiv = document.getElementById('generated-links');
    const linkContainer = document.createElement('div');
    linkContainer.classList.add('link-container');
    
    const linkElement = document.createElement('a');
    linkElement.href = link;
    linkElement.textContent = link;
    linkElement.target = '_blank';
    
    linkContainer.appendChild(linkElement);
    generatedLinksDiv.appendChild(linkContainer);
}

function uploadCredentials() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('credentials', file);
    const button = event.target;
    setLoading(button, true);

    fetch('/upload_credentials', {
        method: 'POST',
        body: formData
    }).then(response => response.json()).then(data => {
        alert(data.message);
        setLoading(button, false);
    }).catch(() => setLoading(button, false));
}

function createBucket() {
    const bucketName = document.getElementById('bucket-name').value;
    const button = event.target;
    setLoading(button, true);

    fetch('/create_bucket', {
        method: 'POST',
        body: JSON.stringify({ bucket_name: bucketName }),
        headers: {'Content-Type': 'application/json'}
    }).then(response => response.json()).then(data => {
        alert(data.message);
        setLoading(button, false);
    }).catch(() => setLoading(button, false));
}

function makeBucketPublicAndListFiles() {
    const bucketName = document.getElementById('public-bucket-name').value;
    const button = event.target;
    setLoading(button, true);

    fetch(`/make_bucket_public_and_list_files`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `bucket_name=${encodeURIComponent(bucketName)}`
    }).then(response => response.json())
    .then(data => {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = ''; // Clear previous entries
        if (Array.isArray(data)) {
            data.forEach(file => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = file.url;
                link.textContent = file.name;
                link.target = '_blank'; // Open in a new tab
                listItem.appendChild(link);
                fileList.appendChild(listItem);
            });
        } else {
            fileList.innerHTML = `<li>${data.message}</li>`;
        }
        setLoading(button, false);
    }).catch(() => setLoading(button, false));
}

function deleteBucket() {
    const bucketName = document.getElementById('delete-bucket-name').value;
    const button = event.target;
    setLoading(button, true);

    fetch('/delete_bucket', {
        method: 'POST',
        body: JSON.stringify({ bucket_name: bucketName }),
        headers: {'Content-Type': 'application/json'}
    }).then(response => response.json()).then(data => {
        alert(data.message);
        setLoading(button, false);
    }).catch(() => setLoading(button, false));
}

function deleteAllBuckets() {
    const button = event.target;
    setLoading(button, true);

    fetch('/delete_all_buckets', {
        method: 'POST',
    }).then(response => response.json()).then(data => {
        alert(data.message);
        setLoading(button, false);
    }).catch(() => setLoading(button, false));
}
