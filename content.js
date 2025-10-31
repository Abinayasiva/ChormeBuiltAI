// Content script for ContextFlow
// This script runs on every webpage to help extract content

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractContent') {
    const content = extractPageContent();
    sendResponse({ success: true, content });
  }
  return true;
});

// Extract meaningful content from the page
function extractPageContent() {
  const title = document.title;
  
  // Get meta description
  const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
  
  // Try to find the main content area
  let mainContent = '';
  
  // Priority order: article > main > body
  const article = document.querySelector('article');
  const main = document.querySelector('main');
  const body = document.body;
  
  if (article) {
    mainContent = extractText(article);
  } else if (main) {
    mainContent = extractText(main);
  } else {
    mainContent = extractText(body);
  }
  
  // Get page metadata
  const metadata = {
    url: window.location.href,
    title: title,
    description: metaDescription,
    author: document.querySelector('meta[name="author"]')?.content || '',
    publishDate: extractPublishDate(),
    wordCount: mainContent.split(/\s+/).length
  };
  
  return {
    title,
    description: metaDescription,
    content: mainContent.slice(0, 10000), // Limit to 10k characters
    metadata
  };
}

// Extract clean text from element
function extractText(element) {
  // Clone the element to avoid modifying the DOM
  const clone = element.cloneNode(true);
  
  // Remove script, style, and nav elements
  const unwanted = clone.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .ad, .social-share');
  unwanted.forEach(el => el.remove());
  
  // Get text content
  let text = clone.innerText || clone.textContent;
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

// Try to extract publish date from common locations
function extractPublishDate() {
  // Try meta tags
  const dateSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="publish-date"]',
    'meta[name="date"]',
    'meta[property="og:published_time"]',
    'time[datetime]',
    '.publish-date',
    '.post-date',
    '.entry-date'
  ];
  
  for (const selector of dateSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const date = element.getAttribute('content') || 
                   element.getAttribute('datetime') || 
                   element.textContent;
      if (date) return date;
    }
  }
  
  return '';
}

// Add visual indicator when ContextFlow is active (optional)
function addIndicator() {
  if (document.getElementById('contextflow-indicator')) return;
  
  const indicator = document.createElement('div');
  indicator.id = 'contextflow-indicator';
  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    animation: fadeIn 0.3s ease-in forwards;
  `;
  
  indicator.innerHTML = `
    <div style="width: 6px; height: 6px; background: #4ade80; border-radius: 50%; animation: pulse 2s ease-in-out infinite;"></div>
    ContextFlow Active
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      to { opacity: 1; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(indicator);
  
  // Remove after 3 seconds
  setTimeout(() => {
    indicator.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => indicator.remove(), 300);
  }, 3000);
}

console.log('ContextFlow content script loaded on:', window.location.href);