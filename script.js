document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('nav ul li a');
    const tabContents = document.querySelectorAll('.tab-content');
    const statusBox = document.getElementById('status-box');

    // Function to switch tabs
    function switchTab(event) {
        event.preventDefault(); // Prevent default anchor click behavior

        // Remove active class from all nav links
        navLinks.forEach(link => link.classList.remove('active'));

        // Add .hidden class to all tab contents
        tabContents.forEach(content => content.classList.add('hidden'));

        // Add active class to the clicked nav link
        event.currentTarget.classList.add('active');

        // Show the targeted tab content by removing .hidden class
        const targetId = event.currentTarget.getAttribute('href').substring(1);
        const targetTabContent = document.getElementById(targetId);
        if (targetTabContent) {
            targetTabContent.classList.remove('hidden');
        }
    }

    // Add click event listeners to nav links
    navLinks.forEach(link => {
        link.addEventListener('click', switchTab);
    });

    // Simulate checking status and then update (mocking an API call)
    if (statusBox) {
        statusBox.textContent = 'Status: Checking...';
        // Clear any existing status classes
        statusBox.classList.remove('status-ok', 'status-error');

        setTimeout(() => {
            // Simulate a successful status check
            statusBox.textContent = 'Status: All systems operational!';
            // statusBox.style.color = 'green'; // Color will be handled by CSS class
            statusBox.classList.add('status-ok');
        }, 3000); // Wait 3 seconds to simulate a check
    }

    // Set the first tab as active by default
    if (navLinks.length > 0) {
        navLinks[0].classList.add('active');
        // The first tab content ("game-info") should not have .hidden class by default in HTML.
        // Or, ensure it's explicitly shown here if all start with .hidden
        const firstTabId = navLinks[0].getAttribute('href').substring(1);
        const firstTabContent = document.getElementById(firstTabId);
        if (firstTabContent) {
            firstTabContent.classList.remove('hidden');
        }
    }
});
