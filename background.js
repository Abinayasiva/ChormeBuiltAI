// Background service worker for ContextFlow

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Listen for messages from content scripts and side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabContent') {
    handleGetTabContent(sendResponse);
    return true;
  }
  
  if (request.action === 'analyzeWithAI') {
    handleAIAnalysis(request.data, sendResponse);
    return true;
  }
  
  if (request.action === 'summarizeTabs') {
    handleSummarizeTabs(sendResponse);
    return true;
  }
  
  if (request.action === 'answerQuestion') {
    handleAnswerQuestion(request.question, sendResponse);
    return true;
  }
});

// Get content from all tabs
async function handleGetTabContent(sendResponse) {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    console.log(`Found ${tabs.length} total tabs`);
    const tabData = [];
    
    for (const tab of tabs) {
      console.log(`Processing tab ${tab.id}: ${tab.title} (${tab.url})`);
      if (tab.url.startsWith('http')) {
        try {
          const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractPageContent
          });
          
          console.log(`Tab ${tab.id} result:`, result);
          
          if (result && result.result) {
            tabData.push({
              id: tab.id,
              title: tab.title,
              url: tab.url,
              content: result.result
            });
            console.log(`✅ Added content from tab ${tab.id}`);
          }
        } catch (error) {
          console.error(`❌ Error extracting content from tab ${tab.id}:`, error);
        }
      } else {
        console.log(`⏭️ Skipping non-http tab: ${tab.url}`);
      }
    }
    
    console.log(`Total tabs with content: ${tabData.length}`);
    sendResponse({ success: true, tabs: tabData });
  } catch (error) {
    console.error('Error getting tab content:', error);
    sendResponse({ success: false, error: error.message });
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

// Handle AI analysis
async function handleAIAnalysis(data, sendResponse) {
  try {
    const canUseAI = await checkAIAvailability();
    
    if (!canUseAI) {
      sendResponse({ 
        success: false, 
        error: 'Chrome Built-in AI is not available. Please check chrome://flags settings.' 
      });
      return;
    }
    
    const session = await createAISession();
    const analysis = await analyzeContent(session, data);
    
    sendResponse({ success: true, analysis });
  } catch (error) {
    console.error('AI Analysis error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Summarize all tabs
async function handleSummarizeTabs(sendResponse) {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    console.log(`Starting analysis of ${tabs.length} tabs`);
    const summaries = [];
    
    // Get content from each tab
    for (const tab of tabs.slice(0, 5)) {
      if (tab.url.startsWith('http')) {
        try {
          console.log(`Analyzing tab: ${tab.title}`);
          
          // Execute content extraction script
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractPageContent
          });
          
          console.log(`Script execution result for tab ${tab.id}:`, results);
          
          if (results && results[0] && results[0].result) {
            const content = results[0].result;
            console.log(`Content extracted from ${tab.title}, length: ${content.content?.length || 0}`);
            
            const summary = await summarizeContent(content.content, tab.title);
            summaries.push({
              title: tab.title,
              url: tab.url,
              summary
            });
            console.log(`✅ Summarized: ${tab.title}`);
          } else {
            console.warn(`No content extracted from tab ${tab.id}`);
          }
        } catch (error) {
          console.error(`Error processing tab ${tab.id} (${tab.title}):`, error);
        }
      }
    }
    
    console.log(`Total summaries created: ${summaries.length}`);
    
    // Find connections between tabs
    const connections = await findConnections(summaries);
    
    sendResponse({ success: true, summaries, connections });
  } catch (error) {
    console.error('Error summarizing tabs:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Answer question across all tabs
async function handleAnswerQuestion(question, sendResponse) {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    console.log(`Answering question across ${tabs.length} tabs`);
    let combinedContext = '';
    const sources = [];
    
    // Gather content from all tabs
    for (const tab of tabs.slice(0, 5)) {
      if (tab.url.startsWith('http')) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractPageContent
          });
          
          if (results && results[0] && results[0].result) {
            const content = results[0].result;
            combinedContext += `\n\nSource: ${tab.title}\n${content.content.slice(0, 2000)}`;
            sources.push({ title: tab.title, url: tab.url });
          }
        } catch (error) {
          console.error(`Error getting content from tab ${tab.id}:`, error);
        }
      }
    }
    
    console.log(`Gathered context from ${sources.length} sources`);
    
    // Use AI to answer question based on combined context
    const answer = await answerFromContext(question, combinedContext);
    
    sendResponse({ success: true, answer, sources });
  } catch (error) {
    console.error('Error answering question:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Check if Chrome's built-in AI is available
async function checkAIAvailability() {
  try {
    // Try multiple access points
    const ai = self.ai || window.ai || globalThis.ai;
    
    if (!ai || !ai.languageModel) {
      console.log('AI languageModel not found');
      return false;
    }
    
    const capabilities = await ai.languageModel.capabilities();
    console.log('AI Capabilities:', capabilities);
    
    return capabilities.available === 'readily';
  } catch (error) {
    console.error('AI availability check failed:', error);
    return false;
  }
}

// Create AI session
async function createAISession() {
  try {
    // In service workers, use self instead of window
    const ai = self.ai || globalThis.ai;
    
    if (!ai || !ai.languageModel) {
      throw new Error('AI languageModel not available in service worker');
    }
    
    const session = await ai.languageModel.create({
      systemPrompt: 'You are a helpful research assistant that analyzes and connects information from multiple sources. Provide concise, clear responses.'
    });
    
    console.log('✅ AI session created successfully');
    return session;
  } catch (error) {
    console.error('Failed to create AI session:', error);
    throw error;
  }
}

// Analyze content with AI
async function analyzeContent(session, content) {
  try {
    const prompt = `Analyze the following content and provide key insights in 2-3 sentences:\n\n${content}`;
    const result = await session.prompt(prompt);
    return result;
  } catch (error) {
    console.error('Content analysis failed:', error);
    return 'Analysis unavailable';
  }
}

// Summarize content
async function summarizeContent(content, title) {
  try {
    const session = await createAISession();
    const prompt = `Summarize this article titled "${title}" in 1-2 concise sentences:\n\n${content.slice(0, 2000)}`;
    const summary = await session.prompt(prompt);
    return summary;
  } catch (error) {
    console.error('Summarization failed:', error);
    return 'Summary unavailable - ' + error.message;
  }
}

// Find connections between tabs
async function findConnections(summaries) {
  try {
    if (summaries.length < 2) {
      return ['Not enough tabs to find connections'];
    }
    
    const session = await createAISession();
    const summariesText = summaries.map((s, i) => 
      `Tab ${i + 1} - ${s.title}:\n${s.summary}`
    ).join('\n\n');
    
    const prompt = `Analyze these article summaries and identify 3-4 key connections, common themes, or interesting comparisons between them. Format each as a single clear sentence:\n\n${summariesText}`;
    
    const result = await session.prompt(prompt);
    
    // Parse connections from result - split by newlines and filter
    const connections = result.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 20 && !line.includes(':') || line.match(/^\d+[\.\)]/))
      .map(line => line.replace(/^\d+[\.\)\:]\s*/, '').trim())
      .slice(0, 5);
    
    return connections.length > 0 ? connections : ['All sources discuss related topics'];
  } catch (error) {
    console.error('Finding connections failed:', error);
    return ['Unable to find connections: ' + error.message];
  }
}

// Answer question from context
async function answerFromContext(question, context) {
  try {
    const session = await createAISession();
    const prompt = `Based on the following sources, answer this question concisely: "${question}"\n\nSources:${context.slice(0, 5000)}\n\nProvide a clear, comprehensive answer in 2-4 sentences.`;
    
    const answer = await session.prompt(prompt);
    return answer;
  } catch (error) {
    console.error('Question answering failed:', error);
    return 'Unable to answer question: ' + error.message;
  }
}

console.log('ContextFlow background service worker loaded');