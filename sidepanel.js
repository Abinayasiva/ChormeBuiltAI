// Side panel JavaScript for ContextFlow

let currentTabs = [];
let currentSummaries = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  updateTabCount();
  checkAIAvailability();
});

function setupEventListeners() {
  document.getElementById('analyzeButton').addEventListener('click', analyzeAllTabs);
  document.getElementById('askButton').addEventListener('click', askQuestion);
  document.getElementById('questionInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      askQuestion();
    }
  });
}

// Check if AI is available in side panel
async function checkAIAvailability() {
  try {
    const state = await LanguageModel.availability();
    console.log('LanguageModel availability:', state);
    return state === 'available';
  } catch (error) {
    console.error('AI check failed:', error);
    return false;
  }
}


// Update tab count display
async function updateTabCount() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const httpTabs = tabs.filter(tab => tab.url.startsWith('http'));
    document.getElementById('tabCount').textContent = 
      `${httpTabs.length} tab${httpTabs.length !== 1 ? 's' : ''} ready to analyze`;
  } catch (error) {
    console.error('Error getting tab count:', error);
  }
}

// Analyze all tabs (AI processing happens here in side panel)
async function analyzeAllTabs() {
  const button = document.getElementById('analyzeButton');
  const summarySection = document.getElementById('summarySection');
  const connectionsSection = document.getElementById('connectionsSection');
  const citationsSection = document.getElementById('citationsSection');
  
  try {
    // Show loading state
    button.disabled = true;
    button.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; gap: 8px;"><div style="width: 16px; height: 16px; border: 2px solid #667eea; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div> Analyzing...</div>';
    hideError();
    
    // Check AI availability
    const aiAvailable = await checkAIAvailability();
    if (!aiAvailable) {
      throw new Error('Chrome Built-in AI is not available. Please enable it in chrome://flags');
    }
    
    // Get all tabs
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const httpTabs = tabs.filter(tab => tab.url.startsWith('http')).slice(0, 5);
    
    console.log(`Analyzing ${httpTabs.length} tabs`);
    
    // Extract content from each tab
    const tabContents = [];
    for (const tab of httpTabs) {
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: extractPageContent
        });
        
        if (result?.result) {
          tabContents.push({
            title: tab.title,
            url: tab.url,
            content: result.result
          });
          console.log(`✅ Extracted content from: ${tab.title}`);
        }
      } catch (error) {
        console.error(`Error extracting from tab ${tab.id}:`, error);
      }
    }
    
    if (tabContents.length === 0) {
      throw new Error('No content could be extracted from tabs');
    }
    
    // Create AI session (this works in side panel!)
    console.log('Creating AI session...');
    const session = await LanguageModel.create({
      systemPrompt: 'You are a helpful research assistant. Provide concise, clear responses.'
    });
    console.log('✅ AI session created');
    
    // Summarize each tab
    const summaries = [];
    for (const tab of tabContents) {
      try {
        const prompt = `Summarize this article titled "${tab.title}" in 1-2 concise sentences:\n\n${tab.content.content.slice(0, 2000)}`;
        const summary = await session.prompt(prompt);
        summaries.push({
          title: tab.title,
          url: tab.url,
          summary: summary
        });
        console.log(`✅ Summarized: ${tab.title}`);
      } catch (error) {
        console.error(`Error summarizing ${tab.title}:`, error);
        summaries.push({
          title: tab.title,
          url: tab.url,
          summary: 'Summary unavailable'
        });
      }
    }
    
    currentSummaries = summaries;
    
    // Display cross-tab summary
    const summaryText = `Analyzing ${summaries.length} source${summaries.length !== 1 ? 's' : ''}: ${summaries.map(s => s.title).join(', ')}. ${summaries[0]?.summary || ''}`;
    document.getElementById('summaryContent').textContent = summaryText;
    summarySection.style.display = 'block';
    
    // Find connections
    if (summaries.length >= 2) {
      const connections = await findConnections(session, summaries);
      if (connections.length > 0) {
        displayConnections(connections);
        connectionsSection.style.display = 'block';
      }
    }
    
    // Display citations
    displayCitations(summaries);
    citationsSection.style.display = 'block';
    
    button.innerHTML = '✓ Analysis Complete';
    setTimeout(() => {
      button.innerHTML = '🔍 Analyze All Tabs';
      button.disabled = false;
    }, 2000);
    
  } catch (error) {
    console.error('Error analyzing tabs:', error);
    showError(`Failed to analyze tabs: ${error.message}`);
    button.innerHTML = '🔍 Analyze All Tabs';
    button.disabled = false;
  }
}

// Function to inject into page to extract content
function extractPageContent() {
  const title = document.title;
  const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
  
  let mainContent = '';
  const article = document.querySelector('article');
  const main = document.querySelector('main');
  
  if (article) {
    mainContent = article.innerText;
  } else if (main) {
    mainContent = main.innerText;
  } else {
    mainContent = document.body.innerText.slice(0, 5000);
  }
  
  return {
    title,
    description: metaDescription,
    content: mainContent.slice(0, 10000)
  };
}

// Find connections between tabs using AI
async function findConnections(session, summaries) {
  try {
    const summariesText = summaries.map((s, i) => 
      `Tab ${i + 1} - ${s.title}:\n${s.summary}`
    ).join('\n\n');
    
    const prompt = `Analyze these article summaries and identify 3-4 key connections, common themes, or interesting comparisons. Format each as a single clear sentence:\n\n${summariesText}`;
    
    const result = await session.prompt(prompt);
    
    // Parse connections
    const connections = result.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 20)
      .map(line => line.replace(/^\d+[\.\)\:]\s*/, '').trim())
      .slice(0, 5);
    
    return connections.length > 0 ? connections : ['All sources discuss related topics'];
  } catch (error) {
    console.error('Finding connections failed:', error);
    return ['Unable to analyze connections'];
  }
}

// Display connections
function displayConnections(connections) {
  const container = document.getElementById('connectionsContent');
  container.innerHTML = '';
  
  connections.forEach((connection, index) => {
    const item = document.createElement('div');
    item.className = 'connection-item';
    item.innerHTML = `
      <div class="connection-icon">${index + 1}</div>
      <div>${connection}</div>
    `;
    container.appendChild(item);
  });
}

// Display citations
function displayCitations(summaries) {
  const container = document.getElementById('citationsContent');
  container.innerHTML = '';
  
  summaries.forEach(summary => {
    const citation = document.createElement('div');
    citation.className = 'citation-item';
    
    let domain = '';
    try {
      domain = new URL(summary.url).hostname.replace('www.', '');
    } catch (e) {
      domain = summary.url;
    }
    
    citation.textContent = `${summary.title}. ${domain}`;
    container.appendChild(citation);
  });
}

// Ask question across all tabs
async function askQuestion() {
  const input = document.getElementById('questionInput');
  const button = document.getElementById('askButton');
  const answerContent = document.getElementById('answerContent');
  const citationsSection = document.getElementById('citationsSection');
  const citationsContent = document.getElementById('citationsContent');
  
  const question = input.value.trim();
  
  if (!question) {
    showError('Please enter a question');
    return;
  }
  
  try {
    button.disabled = true;
    button.textContent = '...';
    answerContent.innerHTML = '<div class="spinner"></div><div>Searching across all tabs...</div>';
    hideError();
    
    // Get all tabs
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const httpTabs = tabs.filter(tab => tab.url.startsWith('http')).slice(0, 5);
    
    // Extract content
    let combinedContext = '';
    const sources = [];
    
    for (const tab of httpTabs) {
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: extractPageContent
        });
        
        if (result?.result) {
          combinedContext += `\n\nSource: ${tab.title}\n${result.result.content.slice(0, 2000)}`;
          sources.push({ title: tab.title, url: tab.url });
        }
      } catch (error) {
        console.error(`Error extracting from tab ${tab.id}:`, error);
      }
    }
    
    // Create AI session and answer question
    const session = await LanguageModel.create({
      systemPrompt: 'You are a helpful research assistant. Provide concise answers based on the given sources.'
    });
    
    const prompt = `Based on the following sources, answer this question: "${question}"\n\nSources:${combinedContext}\n\nProvide a clear, comprehensive answer in 2-4 sentences.`;
    
    const answer = await session.prompt(prompt);
    
    // Display answer
    answerContent.textContent = answer;
    
    // Display sources
    if (sources.length > 0) {
      citationsContent.innerHTML = '';
      sources.forEach(source => {
        const citation = document.createElement('div');
        citation.className = 'citation-item';
        citation.textContent = source.title;
        citationsContent.appendChild(citation);
      });
      citationsSection.style.display = 'block';
    }
    
    button.textContent = 'Ask';
    button.disabled = false;
    
  } catch (error) {
    console.error('Error answering question:', error);
    showError(`Failed to answer question: ${error.message}`);
    answerContent.textContent = 'Get answers synthesized from all your research tabs instantly.';
    button.textContent = 'Ask';
    button.disabled = false;
  }
}

// Show error message
function showError(message) {
  const errorSection = document.getElementById('errorSection');
  const errorContent = document.getElementById('errorContent');
  errorContent.textContent = message;
  errorSection.style.display = 'block';
  
  setTimeout(() => {
    errorSection.style.display = 'none';
  }, 5000);
}

// Hide error message
function hideError() {
  document.getElementById('errorSection').style.display = 'none';
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener(() => {
  updateTabCount();
});

chrome.tabs.onRemoved.addListener(() => {
  updateTabCount();
});

console.log('ContextFlow side panel loaded');