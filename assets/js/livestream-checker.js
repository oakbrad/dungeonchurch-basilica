// Livestream checker for conditionally displaying livestream content
document.addEventListener('DOMContentLoaded', function() {
    // Function to check stream status
    function checkStreamStatus() {
        return fetch('https://live.dungeon.church/memfs/9427a5bf-a270-4cec-9bf5-6e873a79269e.m3u8', {
            method: 'HEAD',  // Use HEAD request to avoid downloading the entire file
            cache: 'no-store',  // Avoid caching to get fresh status
            mode: 'cors'  // Handle CORS if needed
        })
        .then(response => {
            return response.ok;  // Stream is active if response is OK (200)
        })
        .catch(() => {
            return false;  // Stream is not active if request fails
        });
    }

    // Function to update the display based on stream status
    function updateStreamDisplay(isStreamActive) {
        const coverContainer = document.querySelector('.site-header-content');
        if (!coverContainer) return;

        // Get or create livestream iframe
        let livestreamIframe = document.getElementById('livestream-iframe');
        if (!livestreamIframe && isStreamActive) {
            livestreamIframe = document.createElement('iframe');
            livestreamIframe.id = 'livestream-iframe';
            livestreamIframe.src = 'https://live.dungeon.church/9427a5bf-a270-4cec-9bf5-6e873a79269e.html';
            livestreamIframe.setAttribute('frameborder', 'no');
            livestreamIframe.setAttribute('scrolling', 'no');
            livestreamIframe.setAttribute('allowfullscreen', 'true');
            livestreamIframe.classList.add('site-header-cover', 'livestream-active');
        }

        // Get the cover image
        const coverImage = coverContainer.querySelector('img.site-header-cover');
        
        if (isStreamActive) {
            // If we have a cover image, replace it with the livestream
            if (coverImage && livestreamIframe) {
                // If the iframe isn't already in the DOM, insert it
                if (!document.getElementById('livestream-iframe')) {
                    coverImage.style.display = 'none';
                    coverContainer.insertBefore(livestreamIframe, coverImage);
                }
            }
        } else {
            // Stream is not active, show the cover image and remove the iframe
            if (coverImage) {
                coverImage.style.display = '';
            }
            
            // Remove the iframe if it exists
            if (livestreamIframe && livestreamIframe.parentNode) {
                livestreamIframe.parentNode.removeChild(livestreamIframe);
            }
        }
    }

    // Add CSS for the livestream iframe
    const style = document.createElement('style');
    style.textContent = `
        iframe.site-header-cover.livestream-active {
            width: 100%;
            height: 100%;
            min-height: 40vh;
            object-fit: cover;
            margin: 0;
            padding: 0;
            display: block;
        }
        
        @media (max-width: 650px) {
            iframe.site-header-cover.livestream-active {
                min-height: 30vh;
            }
        }
    `;
    document.head.appendChild(style);

    // Initial check
    checkStreamStatus().then(updateStreamDisplay);
    
    // Set up periodic checks every 30 seconds
    setInterval(() => {
        checkStreamStatus().then(updateStreamDisplay);
    }, 30000);
});

