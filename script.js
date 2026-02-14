// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Copy to clipboard function
function copyToClipboard(text, elementId) {
    navigator.clipboard.writeText(text).then(() => {
        // Show feedback
        const button = event.target.closest('.copy-btn');
        const originalText = button.querySelector('.copy-text').textContent;
        const originalBg = button.style.background;
        
        button.classList.add('copied');
        button.querySelector('.copy-text').textContent = 'Copied!';
        
        setTimeout(() => {
            button.classList.remove('copied');
            button.querySelector('.copy-text').textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            const button = event.target.closest('.copy-btn');
            button.querySelector('.copy-text').textContent = 'Copied!';
            setTimeout(() => {
                button.querySelector('.copy-text').textContent = 'Copy';
            }, 2000);
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(textArea);
    });
}

// Add scroll effect to navbar
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.background = 'rgba(10, 10, 10, 0.98)';
    } else {
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
    }
    
    lastScroll = currentScroll;
});

// Add fade-in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.story-card, .token-card, .treasury-card, .link-card');
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Load treasury balance on page load
    loadTreasuryBalance();
});

// Fetch treasury balance from our API endpoint (with caching)
async function fetchTreasuryBalance() {
    try {
        // Use relative path for Vercel deployment, or absolute for local dev
        const apiUrl = '/api/treasury';
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching treasury balance:', error);
        // Return null to indicate error
        return null;
    }
}

// Format number with commas
function formatNumber(num) {
    if (num === null || num === undefined) return '0.00';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

// Format large numbers
function formatLargeNumber(num) {
    if (num === null || num === undefined) return '0.00';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return formatNumber(num);
}

// Load and display treasury balance
async function loadTreasuryBalance() {
    const solBalanceEl = document.getElementById('solBalance');
    const tokenBalanceEl = document.getElementById('tokenBalance');
    const totalValueEl = document.getElementById('totalValue');
    
    // Show loading state
    solBalanceEl.textContent = 'Loading...';
    tokenBalanceEl.textContent = 'Loading...';
    totalValueEl.textContent = '$0.00';
    
    try {
        // Fetch treasury data from our cached API
        const treasuryData = await fetchTreasuryBalance();
        
        if (!treasuryData || treasuryData.error) {
            throw new Error(treasuryData?.error || 'Failed to fetch treasury data');
        }
        
        // Extract values from API response
        const { solBalance, solPrice, solValueUSD, tokenBalance, tokenPrice, tokenValueUSD, totalValue } = treasuryData;
        
        // Update UI
        solBalanceEl.textContent = `${formatNumber(solBalance)} SOL ($${formatNumber(solValueUSD)})`;
        if (tokenBalance > 0) {
            tokenBalanceEl.textContent = `${formatLargeNumber(tokenBalance)} DORITO ($${formatNumber(tokenValueUSD)})`;
        } else {
            tokenBalanceEl.textContent = '0.00 DORITO ($0.00)';
        }
        totalValueEl.textContent = `$${formatNumber(totalValue)}`;
        
    } catch (error) {
        console.error('Error loading treasury balance:', error);
        solBalanceEl.textContent = 'Error loading';
        tokenBalanceEl.textContent = 'Error loading';
        totalValueEl.textContent = '$0.00';
    }
}

// Refresh balance every 10 seconds for real-time updates
setInterval(loadTreasuryBalance, 10000);

