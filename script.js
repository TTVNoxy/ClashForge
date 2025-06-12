// --- Clash Royale API Configuration ---
const ROYALE_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImVmNmI0NGViLTM0MzQtNDMyNy04NzMyLWZkYzM4ZjZkMzY5NiIsImlhdCI6MTc0OTU2MzAyMSwic3ViIjoiZGV2ZWxvcGVyL2RkNzY5YjQ5LWMxZDUtYjA2YS0yNzVkLTFjNDM3OGE5YjVjOCIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyI1MS44OS4xOTQuODEiXSwidHlwZSI6ImNsaWVudCJ9XX0.jCZbR7Kw2xVzyLpzTI93T1S-PfQVPF0I-EV7U1NJJCL2bqQ58pbQZk5FdPjj2kAVhkboYJkycfrDpomiRqrrug";
// IMPORTANT: For production environments, API keys should ideally be handled by a backend proxy
// to avoid exposing them directly in client-side code.
const ROYALE_API_BASE_URL = "https://api.clashroyale.com/v1";

document.addEventListener('DOMContentLoaded', () => {
    // Navigation and Tab elements
    const navLinks = document.querySelectorAll('nav ul li a');
    const tabContents = document.querySelectorAll('.tab-content');

    // Status Tab Elements
    let apiConnectionStatusElem, gameServicesStatusElem, lastCheckedTimeElem, rawApiResponseElem, refreshStatusButtonElem;
    let statusTabInitialized = false; // To ensure initStatusTab runs once

    function initStatusTab() {
        apiConnectionStatusElem = document.getElementById('api-connection-status');
        gameServicesStatusElem = document.getElementById('game-services-status');
        lastCheckedTimeElem = document.getElementById('last-checked-time');
        rawApiResponseElem = document.getElementById('raw-api-response');
        refreshStatusButtonElem = document.getElementById('refresh-status-button');

        if (refreshStatusButtonElem) {
            refreshStatusButtonElem.addEventListener('click', fetchRoyaleAPIData);
        }
        statusTabInitialized = true;
    }

    async function fetchRoyaleAPIData() {
        if (!statusTabInitialized || !apiConnectionStatusElem) {
            console.warn("Status tab not fully initialized for fetching data.");
            // Attempt to initialize if called before DOMContentLoaded fully processed for status tab elements
            initStatusTab();
            if (!apiConnectionStatusElem) { // If still not available, exit
                alert("Error: Status tab elements not found. Please reload.");
                return;
            }
        }

        apiConnectionStatusElem.textContent = 'Connecting...';
        apiConnectionStatusElem.style.color = 'var(--clash-forge-text-muted)';
        gameServicesStatusElem.textContent = 'Pending API check...';
        gameServicesStatusElem.style.color = 'var(--clash-forge-text-muted)';
        rawApiResponseElem.textContent = 'Fetching data from API...';
        if(refreshStatusButtonElem) refreshStatusButtonElem.disabled = true;

        // Using /cards as it's a common, stable endpoint unlikely to require query params for a basic list
        // Using a proxy for CORS issues if direct API access is blocked.
        // For this example, let's assume a proxy is available at /api/royale.
        // Replace with direct ROYALE_API_BASE_URL if not using a proxy or if CORS is handled by Supercell.
        // const PROXY_URL = '/api/royale'; // Example proxy path
        // const endpoint = `${PROXY_URL}/cards`;

        // Direct API call (may face CORS or IP Whitelisting issues in browser)
        const endpoint = `${ROYALE_API_BASE_URL}/tournaments`; // Switched to /tournaments as per instructions

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${ROYALE_API_KEY}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                apiConnectionStatusElem.textContent = 'Connected';
                apiConnectionStatusElem.style.color = 'var(--clash-forge-success)';
                gameServicesStatusElem.textContent = 'Likely Operational (based on API response)';
                gameServicesStatusElem.style.color = 'var(--clash-forge-success)';
                rawApiResponseElem.textContent = JSON.stringify(data, null, 2);

                // Check for common error structure in case response.ok is true but data indicates an issue
                if (data.reason === 'accessDenied.invalidIp') {
                     rawApiResponseElem.textContent = `Error: Access Denied. Your IP address is not whitelisted for direct API access.\n\n${JSON.stringify(data, null, 2)}`;
                     apiConnectionStatusElem.textContent = 'Access Denied (IP)';
                     apiConnectionStatusElem.style.color = 'var(--clash-forge-error)';
                     gameServicesStatusElem.textContent = 'Unknown (IP Access Denied)';
                } else if (data.reason) { // Other API-specific errors
                    rawApiResponseElem.textContent = `API Error: ${data.message || data.reason}\n\n${JSON.stringify(data, null, 2)}`;
                    apiConnectionStatusElem.textContent = 'API Error';
                    apiConnectionStatusElem.style.color = 'var(--clash-forge-error)';
                }

            } else {
                // Handle HTTP errors (e.g., 401, 403, 404, 500)
                apiConnectionStatusElem.textContent = `HTTP Error: ${response.status}`;
                apiConnectionStatusElem.style.color = 'var(--clash-forge-error)';
                gameServicesStatusElem.textContent = 'Likely Impaired (API Error)';
                gameServicesStatusElem.style.color = 'var(--clash-forge-error)';

                let errorMsg = `HTTP Error ${response.status}: ${response.statusText}\n\n`;
                if (data && data.message) {
                    errorMsg += `Message: ${data.message}\n`;
                }
                if (data && data.reason === 'accessDenied.invalidIp') {
                    errorMsg += 'Reason: Access Denied. Your IP address is not whitelisted for direct API access. A backend proxy is usually required for this API key.\n';
                } else if (data && data.reason) {
                    errorMsg += `Reason: ${data.reason}\n`;
                }
                errorMsg += `\nRaw Error Data:\n${JSON.stringify(data, null, 2)}`;
                rawApiResponseElem.textContent = errorMsg;
            }
        } catch (error) {
            // Handle network errors or other fetch-related issues
            console.error('Fetch API Data Error:', error);
            apiConnectionStatusElem.textContent = 'Connection Failed';
            apiConnectionStatusElem.style.color = 'var(--clash-forge-error)';
            gameServicesStatusElem.textContent = 'Unknown (Connection Failed)';
            gameServicesStatusElem.style.color = 'var(--clash-forge-error)';
            rawApiResponseElem.textContent = `Network or Fetch Error: ${error.message}\n\nThis could be a CORS issue if accessing the API directly from the browser without a proxy, or a network problem. Ensure you have internet access and check the browser console for more details (CORS errors, etc.). The Supercell API might require requests to come from a whitelisted IP address or through a backend proxy.`;
        } finally {
            lastCheckedTimeElem.textContent = new Date().toLocaleTimeString();
            if(refreshStatusButtonElem) refreshStatusButtonElem.disabled = false;
        }
    }

    // Function to switch tabs
    function switchTab(event) {
        event.preventDefault();

        navLinks.forEach(link => link.classList.remove('active'));
        tabContents.forEach(content => content.classList.add('hidden'));

        event.currentTarget.classList.add('active');
        const targetId = event.currentTarget.getAttribute('href').substring(1);
        const targetTabContent = document.getElementById(targetId);

        if (targetTabContent) {
            targetTabContent.classList.remove('hidden');
            if (targetId === 'status') {
                if (!statusTabInitialized) { // Initialize status tab elements if not already done
                    initStatusTab();
                }
                // Fetch data only if elements are confirmed to be initialized.
                if (statusTabInitialized && apiConnectionStatusElem) {
                    fetchRoyaleAPIData();
                } else {
                    console.warn("Status tab elements not ready for data fetch on tab switch.");
                }
            }
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', switchTab);
    });

    // Set the first tab as active and visible by default
    if (navLinks.length > 0) {
        navLinks[0].classList.add('active');
        const firstTabId = navLinks[0].getAttribute('href').substring(1);
        const firstTabContent = document.getElementById(firstTabId);
        if (firstTabContent) {
            firstTabContent.classList.remove('hidden');
        }
        // If the first tab happens to be the status tab, initialize and fetch.
        if (firstTabId === 'status') {
            initStatusTab();
             // Fetch data only if elements are confirmed to be initialized.
            if (statusTabInitialized && apiConnectionStatusElem) {
                fetchRoyaleAPIData();
            }
        }
    }
});
