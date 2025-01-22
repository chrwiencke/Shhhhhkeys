function toggleKeyVisibility(keyId) {
    const keyElement = document.getElementById(`key-${keyId}`);
    if (keyElement) {
        keyElement.classList.toggle('hidden');
    }
}

async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);

        // Store the original button text
        const originalText = button.innerHTML;

        // Change button text to show success
        button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
    </svg>
    Copied!
`;

        // Reset button text after 2 seconds
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy to clipboard');
    }
}

async function copyToClipboardSilent(text, button) {
    try {
        await navigator.clipboard.writeText(text);

        // Store the original button text
        const originalText = button.innerHTML;

        // Change button text to show success
        button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
    </svg>
`;

        // Reset button text after 2 seconds
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy to clipboard');
    }
}

async function fetchAndCopySSHKey(url, button) {
    try {
        const path = '/' + url.split('/').slice(-2).join('/');
        const response = await fetch(path, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const sshKey = await response.text();
        await copyToClipboardSilent(sshKey, button);
    } catch (err) {
        console.error('Error fetching SSH key:', err);
        alert('Failed to fetch SSH key. The key may be disabled or deleted.');
    }
}

function toggleSection(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    const arrow = document.getElementById(`${sectionId}-arrow`);
    const searchBar = document.querySelector(`#${sectionId}-search-controls`);
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        searchBar.style.display = 'flex';
        arrow.style.transform = 'rotate(0deg)';
    } else {
        content.style.display = 'none';
        searchBar.style.display = 'none';
        arrow.style.transform = 'rotate(-180deg)';
    }
}

function showEditDialog(id, title, key) {
    const dialog = document.getElementById('editDialog');
    const titleInput = document.getElementById('editTitle');
    const keyInput = document.getElementById('editKey');
    
    titleInput.value = title;
    keyInput.value = key;
    
    dialog.classList.remove('hidden');
    dialog.classList.add('flex');
}

function hideEditDialog() {
    const dialog = document.getElementById('editDialog');
    dialog.classList.add('hidden');
    dialog.classList.remove('flex');
}

// SSH Keys Search and Filter
function filterSshKeys() {
    const searchTerm = document.getElementById('sshKeySearch').value.toLowerCase();
    const filterValue = document.getElementById('sshKeyFilter').value;
    const sshKeys = document.querySelectorAll('#sshKeys-content .bg-white');

    sshKeys.forEach(key => {
        const title = key.querySelector('h3').textContent.toLowerCase();
        const isEnabled = key.querySelector('svg[fill="#22c55e"]') !== null;
        const isEditable = key.querySelector('.text-yellow-500') !== null;
        
        let matchesFilter = true;
        switch(filterValue) {
            case 'enabled':
                matchesFilter = isEnabled;
                break;
            case 'disabled':
                matchesFilter = !isEnabled;
                break;
            case 'editable':
                matchesFilter = isEditable;
                break;
            case 'non-editable':
                matchesFilter = !isEditable;
                break;
            default:
                matchesFilter = true;
        }

        const matchesSearch = title.includes(searchTerm);
        key.style.display = matchesSearch && matchesFilter ? 'block' : 'none';
    });
}

function clearSshKeyFilters() {
    document.getElementById('sshKeySearch').value = '';
    document.getElementById('sshKeyFilter').value = 'all';
    filterSshKeys();
}

// Social SSH Keys Search
function filterSocialKeys() {
    const searchTerm = document.getElementById('socialKeySearch').value.toLowerCase();
    const socialKeys = document.querySelectorAll('#socialKeys-content .bg-white');

    socialKeys.forEach(key => {
        const link = key.querySelector('h3').textContent.toLowerCase();
        key.style.display = link.includes(searchTerm) ? 'block' : 'none';
    });
}

function clearSocialKeySearch() {
    document.getElementById('socialKeySearch').value = '';
    filterSocialKeys();
}

// Add event listeners
document.getElementById('sshKeySearch').addEventListener('input', filterSshKeys);
document.getElementById('sshKeyFilter').addEventListener('change', filterSshKeys);
document.getElementById('socialKeySearch').addEventListener('input', filterSocialKeys);