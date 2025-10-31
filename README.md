 ContextFlow - AI-Powered Research Assistant

![ContextFlow Banner](https://via.placeholder.com/1200x300/667eea/ffffff?text=ContextFlow)

 🚀 Submission for Google Chrome Built-in AI Challenge 2025

ContextFlow is an intelligent Chrome extension that revolutionizes research by connecting information across multiple tabs using Chrome's built-in AI APIs. No more manual tab-switching or losing track of your sources!



 🎯 Problem Statement

Researchers, students, and professionals often work with dozens of open tabs while researching. Current challenges include:

- Information Silos: Each tab exists in isolation
- Manual Synthesis: Users must manually compare and connect information
- Lost Context: Difficult to remember which tab contained what information
- Time Waste: Constant tab-switching disrupts workflow
- Citation Hassle: Manually tracking and formatting sources



 💡 Solution

ContextFlow uses Chrome's Built-in AI APIs to automatically:

1. Analyze Content across all open tabs
2. Find Connections between different sources
3. Answer Questions using information from multiple tabs
4. Generate Citations automatically
5. Provide Summaries in real-time

All processing happens locally on-device for maximum privacy and speed!



 ✨ Key Features

 📊 Cross-Tab Summary
Automatically summarizes content across all your research tabs, highlighting key themes and insights.

 🔗 Connected Insights
Identifies relationships and connections between information in different tabs - finds contradictions, confirmations, and related concepts.

 💬 Ask Across All Tabs
Ask questions and get answers synthesized from all your open sources, with automatic source attribution.

 📚 Auto-Generated Citations
Automatically generates properly formatted citations for all your sources in multiple formats.

 🔒 Privacy-First
Everything runs locally using Chrome's built-in AI - no data sent to external servers.



 🛠️ Technologies Used

 Chrome Built-in AI APIs
- Prompt API (`ai.languageModel`) - For intelligent analysis and question answering
- Summarization API (`ai.summarizer`) - For content summarization

 Chrome Extension APIs
- Tabs API - For accessing tab information
- Side Panel API - For the beautiful sidebar interface
- Scripting API - For content extraction
- Storage API - For saving user preferences

 Web Technologies
- Modern HTML5 & CSS3
- Vanilla JavaScript (ES6+)
- Gradient UI with glassmorphism effects



 📦 Installation Instructions

 For Hackathon Judges / Developers

1. Download the Extension
   ```bash
   git clone https://github.com/Abinayasiva/ChormeBuiltAI
   cd contextflow
   ```

2. Enable Chrome Built-in AI
   - Use Chrome version 127 or later
   - Enable the Prompt API:
     - Go to `chrome://flags/#optimization-guide-on-device-model`
     - Set to "Enabled BypassPerfRequirement"
     - Relaunch Chrome

3. Load the Extension
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `contextflow` folder

4. Start Using ContextFlow
   - Open multiple research tabs
   - Click the ContextFlow icon in the toolbar
   - Click "Analyze All Tabs" to see the magic!



 🎮 How to Use

1. Open Research Tabs: Browse to multiple sources on your research topic
2. Open ContextFlow: Click the extension icon to open the side panel
3. Analyze: Click "Analyze All Tabs" to get AI-powered insights
4. Ask Questions: Type questions in the search box to get answers from all sources
5. Review Connections: See how different sources relate to each other
6. Copy Citations: Use auto-generated citations for your work



 🏗️ Project Structure

```
contextflow/
├── manifest.json           # Extension configuration
├── background.js          # Service worker for AI processing
├── sidepanel.html         # Side panel UI
├── sidepanel.js           # Side panel logic
├── content.js             # Content extraction script
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```



 🧪 Testing Scenarios

 Scenario 1: Academic Research
1. Open 3-5 academic articles on the same topic
2. Use ContextFlow to find connections between studies
3. Ask: "What are the main methodologies used?"

 Scenario 2: News Analysis
1. Open news articles from different sources on the same event
2. Use ContextFlow to compare perspectives
3. Ask: "What are the different viewpoints?"

 Scenario 3: Technical Documentation
1. Open multiple technical docs and tutorials
2. Use ContextFlow to synthesize information
3. Ask: "How do I implement X feature?"



 🎨 Design Philosophy

- Minimal & Elegant: Beautiful gradient UI that doesn't distract
- Fast & Responsive: Local AI processing for instant results
- Privacy-First: No data leaves your device
- User-Centric: Solves real pain points in research workflow



 🔮 Future Enhancements

- 📈 Visual knowledge graphs showing tab relationships
- 🎯 Smart tab grouping based on topics
- 📝 Export research notes with citations
- 🌐 Multi-language support using Translation API
- 🔍 Fact-checking across sources
- 📊 Research progress tracking
- 🤝 Collaborative research features (with shared annotations)



 🏆 Why ContextFlow Wins

 Innovation
- First-of-its-kind cross-tab AI integration
- Novel use of Chrome's built-in AI for research
- Solves a real, common problem in a unique way

 Technical Excellence
- Efficient use of multiple Chrome AI APIs
- Clean, maintainable code architecture
- Responsive and beautiful UI

 Practical Impact
- Saves hours of research time
- Improves research quality
- Enhances learning and comprehension
- Privacy-respecting design

 Market Potential
- Large target audience (students, researchers, professionals)
- Clear monetization path (premium features)
- Scalable to enterprise use cases



 👥 Team

- Abinaya & Vinoth - Full Stack Developer & AI Enthusiast
- Built  for Google Chrome Built-in AI Challenge 2025



 📄 License

MIT License - See LICENSE file for details



 🙏 Acknowledgments

- Google Chrome Team for the amazing Built-in AI APIs
- The open-source community for inspiration
- All beta testers and early adopters
