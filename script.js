// --- Clash Royale API Configuration ---
const ROYALE_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImVmNmI0NGViLTM0MzQtNDMyNy04NzMyLWZkYzM4ZjZkMzY5NiIsImlhdCI6MTc0OTU2MzAyMSwic3ViIjoiZGV2ZWxvcGVyL2RkNzY5YjQ5LWMxZDUtYjA2YS0yNzVkLTFjNDM3OGE5YjVjOCIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyI1MS44OS4xOTQuODEiXSwidHlwZSI6ImNsaWVudCJ9XX0.jCZbR7Kw2xVzyLpzTI93T1S-PfQVPF0I-EV7U1NJJCL2bqQ58pbQZk5FdPjj2kAVhkboYJkycfrDpomiRqrrug";
const ROYALE_API_BASE_URL = "https://api.clashroyale.com/v1";

document.addEventListener('DOMContentLoaded', () => {
    // --- New Single-Page Navigation Logic ---
    const navLinks = document.querySelectorAll('#top-nav ul li a');
    const sections = document.querySelectorAll('main section');

    function changeActiveLink() {
        let index = sections.length;
        const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'), 10) || 70;
        // Consider a section active if its top is above a point slightly below the nav bar (e.g., navHeight + 50px)
        const scrollThreshold = window.scrollY + navHeight + 50;

        while(--index && scrollThreshold < sections[index].offsetTop) {}

        navLinks.forEach((link) => link.classList.remove('active-link'));
        if (index >= 0 && navLinks[index]) { // Check if navLinks[index] exists
           navLinks[index].classList.add('active-link');
        }
    }

    // Initial call to set active link on page load (e.g. if loading with a hash)
    changeActiveLink();
    // Listen for scroll events to change active link
    window.addEventListener('scroll', changeActiveLink);

    // Smooth scroll for navigation links
    navLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // The body's padding-top needs to be accounted for
                const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'), 10) || 70;
                const targetPosition = targetElement.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Status Tab Elements & Logic (Retained) ---
    let apiConnectionStatusElem, gameServicesStatusElem, lastCheckedTimeElem, rawApiResponseElem, refreshStatusButtonElem;

    // Function to initialize status elements (can be called when status section is visible or on demand)
    function initStatusElements() {
        apiConnectionStatusElem = document.getElementById('api-connection-status');
        gameServicesStatusElem = document.getElementById('game-services-status');
        lastCheckedTimeElem = document.getElementById('last-checked-time');
        rawApiResponseElem = document.getElementById('raw-api-response');
        refreshStatusButtonElem = document.getElementById('refresh-status-button');

        if (refreshStatusButtonElem && !refreshStatusButtonElem.dataset.listenerAttached) {
            refreshStatusButtonElem.addEventListener('click', fetchRoyaleAPIData);
            refreshStatusButtonElem.dataset.listenerAttached = 'true'; // Prevent multiple listeners
        }
    }

    async function fetchRoyaleAPIData() {
        // Ensure elements are initialized before fetching
        if (!apiConnectionStatusElem) {
            initStatusElements();
            if (!apiConnectionStatusElem) { // If still not available, exit
                alert("Error: Status section elements not found. Please ensure the section is loaded.");
                return;
            }
        }

        apiConnectionStatusElem.textContent = 'Connecting...';
        apiConnectionStatusElem.style.color = 'var(--clash-forge-text-muted)';
        gameServicesStatusElem.textContent = 'Pending API check...';
        gameServicesStatusElem.style.color = 'var(--clash-forge-text-muted)';
        rawApiResponseElem.textContent = 'Fetching data from API...';
        if(refreshStatusButtonElem) refreshStatusButtonElem.disabled = true;

        const endpoint = `${ROYALE_API_BASE_URL}/tournaments`;

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

                if (data.reason === 'accessDenied.invalidIp') {
                     rawApiResponseElem.textContent = `Error: Access Denied. Your IP address is not whitelisted for direct API access.\n\n${JSON.stringify(data, null, 2)}`;
                     apiConnectionStatusElem.textContent = 'Access Denied (IP)';
                     apiConnectionStatusElem.style.color = 'var(--clash-forge-error)';
                     gameServicesStatusElem.textContent = 'Unknown (IP Access Denied)';
                } else if (data.reason) {
                    rawApiResponseElem.textContent = `API Error: ${data.message || data.reason}\n\n${JSON.stringify(data, null, 2)}`;
                    apiConnectionStatusElem.textContent = 'API Error';
                    apiConnectionStatusElem.style.color = 'var(--clash-forge-error)';
                }

            } else {
                apiConnectionStatusElem.textContent = `HTTP Error: ${response.status}`;
                apiConnectionStatusElem.style.color = 'var(--clash-forge-error)';
                gameServicesStatusElem.textContent = 'Likely Impaired (API Error)';
                gameServicesStatusElem.style.color = 'var(--clash-forge-error)';

                let errorMsg = `HTTP Error ${response.status}: ${response.statusText}\n\n`;
                if (data && data.message) errorMsg += `Message: ${data.message}\n`;
                if (data && data.reason === 'accessDenied.invalidIp') errorMsg += 'Reason: Access Denied. Your IP address is not whitelisted. A backend proxy is usually required.\n';
                else if (data && data.reason) errorMsg += `Reason: ${data.reason}\n`;
                errorMsg += `\nRaw Error Data:\n${JSON.stringify(data, null, 2)}`;
                rawApiResponseElem.textContent = errorMsg;
            }
        } catch (error) {
            console.error('Fetch API Data Error:', error);
            apiConnectionStatusElem.textContent = 'Connection Failed';
            apiConnectionStatusElem.style.color = 'var(--clash-forge-error)';
            gameServicesStatusElem.textContent = 'Unknown (Connection Failed)';
            gameServicesStatusElem.style.color = 'var(--clash-forge-error)';
            rawApiResponseElem.textContent = `Network or Fetch Error: ${error.message}\n\nThis could be a CORS issue or a network problem. Check the browser console. The Supercell API might require requests from a whitelisted IP or a backend proxy.`;
        } finally {
            if(lastCheckedTimeElem) lastCheckedTimeElem.textContent = new Date().toLocaleTimeString();
            if(refreshStatusButtonElem) refreshStatusButtonElem.disabled = false;
        }
    }

    // Initialize status elements as soon as the DOM is ready,
    // as the status section is always present in the HTML now.
    initStatusElements();

    // --- IntersectionObserver for Status Section API Call ---
    const statusSection = document.getElementById('status');
    let statusApiCalledOnScroll = false; // Flag to ensure it only calls once on scroll

    if (statusSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !statusApiCalledOnScroll) {
                    // Ensure elements are initialized before fetching,
                    // especially if observer fires before initStatusElements() somehow (unlikely with DOMContentLoaded)
                    if (!apiConnectionStatusElem) {
                        initStatusElements();
                    }
                    fetchRoyaleAPIData();
                    statusApiCalledOnScroll = true; // Set flag
                    // observer.unobserve(statusSection); // Optional: stop observing after first fetch
                }
            });
        }, { threshold: 0.1 }); // Trigger when 10% of the section is visible

        observer.observe(statusSection);
    }
    // End of IntersectionObserver Logic for Status Section

    // --- IntersectionObserver for General Scroll Animations ---
    const animatedElements = document.querySelectorAll('.slide-in-bottom-on-scroll, .slide-in-left-on-scroll, .slide-in-right-on-scroll, .fade-in-on-scroll');

    if (animatedElements.length > 0) {
        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Stop observing once animated
                }
            });
        };

        const animationObserver = new IntersectionObserver(observerCallback, {
            root: null, // relative to the viewport
            threshold: 0.1 // trigger when 10% of the element is visible
        });

        animatedElements.forEach(el => {
            animationObserver.observe(el);
        });
    }
    // End of General Scroll Animations Logic

});
