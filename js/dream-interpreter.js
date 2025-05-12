/**
 * Dream Interpreter Module
 * Handles dream interpretation functionality for East of Meaning
 */

// 全局变量用于存储对话上下文
let conversationContext = {
    dream: '',
    lastInterpretation: '',
    language: 'english',
    interpretationHistory: [], // 存储历史解释
    userQuestions: [] // 存储用户问题历史
};

// Initialize dream interpreter when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // 添加解梦结果样式
    addDreamInterpretationStyles();
    
    // Check if we're on a page with the dream interpreter
    const interpretBtn = document.getElementById('interpretBtn');
    const dreamText = document.getElementById('dreamText');
    
    if (interpretBtn && dreamText) {
        // Set up event listeners
        interpretBtn.addEventListener('click', handleInterpretation);
        
        // Enter key to add a new line, not submit
        dreamText.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                // Prevent default behavior (form submission)
                e.preventDefault();
                
                // Insert a new line at the cursor position
                const cursorPos = this.selectionStart;
                const textBefore = this.value.substring(0, cursorPos);
                const textAfter = this.value.substring(cursorPos);
                this.value = textBefore + '\n' + textAfter;
                
                // Move cursor position after the inserted newline
                this.selectionStart = cursorPos + 1;
                this.selectionEnd = cursorPos + 1;
            }
        });
    }
});

/**
 * 添加解梦结果样式
 */
function addDreamInterpretationStyles() {
    // 检查是否已经添加了样式
    if (document.getElementById('dream-interpretation-styles')) {
        return;
    }
    
    // 创建样式元素
    const styleEl = document.createElement('style');
    styleEl.id = 'dream-interpretation-styles';
    
    // 添加样式规则
    styleEl.textContent = `
        .dream-interpretation {
            padding: 15px;
            font-family: inherit;
            line-height: 1.6;
            color: rgba(245, 245, 245, 0.95);
        }
        
        .dream-interpretation p {
            margin: 16px 0;
            line-height: 1.7;
        }
        
        .dream-interpretation ul {
            padding-left: 25px;
            margin: 16px 0;
        }
        
        .dream-interpretation li {
            margin-bottom: 10px;
            line-height: 1.6;
        }
        
        .dream-interpretation strong {
            color: rgba(212, 175, 55, 0.95);
            font-weight: 500;
        }

        @keyframes contemplating {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
        }

        .contemplating-text {
            animation: contemplating 2s infinite;
            display: inline-block;
            color: rgba(212, 175, 55, 0.9);
            font-style: italic;
        }
    `;
    
    // 添加到文档中
    document.head.appendChild(styleEl);
}

/**
 * Handles the dream interpretation process when user submits a dream
 */
async function handleInterpretation() {
    const dreamText = document.getElementById('dreamText').value;
    if (dreamText.trim() === '') {
        return;
    }
    
    // 检测用户输入的语言并更新上下文
    conversationContext.language = detectLanguage(dreamText);
    console.log('Detected language:', conversationContext.language);
    
    // 保存用户问题到历史记录
    conversationContext.userQuestions.push(dreamText);
    
    // Add user message to chat
    addMessage('user', dreamText);
    
    // Clear the textarea
    document.getElementById('dreamText').value = '';
    
    // Remove any existing contemplating messages
    const existingIndicators = document.querySelectorAll('.contemplating-text');
    existingIndicators.forEach(indicator => {
        const messageDiv = indicator.closest('.message');
        if (messageDiv) {
            messageDiv.remove();
        }
    });
    
    // 根据检测到的语言获取对应的加载提示
    const contemplatingMessage = `<span class="contemplating-text">${getContemplatingMessage(conversationContext.language)}</span>`;
    const tempMessageDiv = addMessage('sage', contemplatingMessage);
    
    try {
        // 检查是否是命令（如翻译请求或后续问题）
        if (isTranslationRequest(dreamText)) {
            const language = extractLanguage(dreamText);
            if (language && conversationContext.lastInterpretation) {
                // 如果是翻译请求并且有上一次的解释
                const translatedInterpretation = await translateInterpretation(
                    conversationContext.lastInterpretation, 
                    language
                );
                
                // 更新语言上下文
                conversationContext.language = language;
                
                // 保存翻译后的解释到历史记录
                conversationContext.interpretationHistory.push({
                    type: 'translation',
                    content: translatedInterpretation,
                    language: language,
                    timestamp: new Date().toISOString()
                });
                
                // Remove the contemplating message
                if (tempMessageDiv && tempMessageDiv.parentNode) {
                    tempMessageDiv.remove();
                }
                
                // Show translation
                addMessageWithTypingEffect('sage', translatedInterpretation);
            } else {
                // No previous interpretation to translate
                if (tempMessageDiv) {
                    tempMessageDiv.querySelector('.message-content').innerHTML = 
                        `<div style="color: rgba(245, 245, 245, 0.9);">${getErrorMessage('unavailable', conversationContext.language)}</div>`;
                }
            }
        } else if (isFollowUpQuestion(dreamText) && conversationContext.dream) {
            // 处理后续问题
            const followUpAnswer = await handleFollowUpQuestion(
                dreamText, 
                conversationContext.dream,
                conversationContext.lastInterpretation,
                conversationContext.language
            );
            
            // 保存问题回答到历史记录
            conversationContext.interpretationHistory.push({
                type: 'followUp',
                question: dreamText,
                answer: followUpAnswer,
                language: conversationContext.language,
                timestamp: new Date().toISOString()
            });
            
            // Remove the contemplating message
            if (tempMessageDiv && tempMessageDiv.parentNode) {
                tempMessageDiv.remove();
            }
            
            // Show answer
            addMessageWithTypingEffect('sage', followUpAnswer);
        } else {
            // 检查输入是否可能是梦境描述
            if (!isPossiblyDream(dreamText)) {
                // 如果不像是梦境描述，给出提示
                if (tempMessageDiv) {
                    tempMessageDiv.querySelector('.message-content').innerHTML = 
                        `<div style="color: rgba(245, 245, 245, 0.95);">
                        ${getErrorMessage('notDream', conversationContext.language)}
                        </div>`;
                }
                return;
            }
            
            // 这是新的梦境，进行解释
            // 保存当前梦境到上下文
            conversationContext.dream = dreamText;
            
            // 正常进行解梦
            const interpretation = await interpretDreamWithAI(dreamText);
            
            // 保存解释到上下文
            conversationContext.lastInterpretation = interpretation;
            
            // 保存解释到历史记录
            conversationContext.interpretationHistory.push({
                type: 'interpretation',
                dream: dreamText,
                interpretation: interpretation,
                language: conversationContext.language,
                timestamp: new Date().toISOString()
            });
            
            // Remove the contemplating message before adding the interpretation
            if (tempMessageDiv && tempMessageDiv.parentNode) {
                tempMessageDiv.remove();
            }
            
            // Add sage response to chat with typing effect
            addMessageWithTypingEffect('sage', interpretation);
        }
        
        // Auto scroll to the bottom of chat
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        // Update the contemplating message with error
        if (tempMessageDiv) {
            const errorMessage = getErrorMessage('unavailable', conversationContext.language);
            tempMessageDiv.querySelector('.message-content').innerHTML = `<div style="color: rgba(245, 245, 245, 0.9);">${errorMessage}</div>`;
        }
        console.error('Error interpreting dream:', error);
    }
}

/**
 * Adds a message to the chat interface
 * @param {string} type - 'user' or 'sage'
 * @param {string} content - The message content
 */
function addMessage(type, content) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = `message-avatar ${type}-avatar`;
    avatarDiv.innerHTML = type === 'user' ? '👤' : '🧙';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (type === 'sage') {
        contentDiv.innerHTML = content;
    } else {
        contentDiv.textContent = content;
    }
    
    if (type === 'user') {
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(avatarDiv);
    } else {
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;  // 返回消息 div 以便后续操作
}

/**
 * Adds a message with typing effect for sage responses
 * @param {string} type - 'user' or 'sage'
 * @param {string} content - The message content
 */
function addMessageWithTypingEffect(type, content) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    // Create avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.className = `message-avatar ${type}-avatar`;
    avatarDiv.innerHTML = type === 'user' ? '👤' : '🧙';
    
    // Create message content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Append elements in correct order
    if (type === 'user') {
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(avatarDiv);
    } else {
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
    }
    
    chatMessages.appendChild(messageDiv);
    
    // Type out content if it's from the sage
    if (type === 'sage') {
        let i = 0;
        const typingSpeed = 30; // milliseconds per character
        const typeEffect = setInterval(() => {
            if (i < content.length) {
                // Handle HTML tags in content
                if (content.charAt(i) === '<') {
                    // Find the closing bracket
                    const tagEnd = content.indexOf('>', i);
                    if (tagEnd !== -1) {
                        // Add the complete tag
                        contentDiv.innerHTML += content.substring(i, tagEnd + 1);
                        i = tagEnd + 1;
                        return;
                    }
                }
                
                contentDiv.innerHTML += content.charAt(i);
                i++;
                
                // Auto scroll to the bottom of chat
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                clearInterval(typeEffect);
            }
        }, typingSpeed);
    } else {
        // Regular display for user messages
        contentDiv.textContent = content;
    }
    
    // Auto scroll to the bottom of chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Interprets a dream using AI
 * @param {string} dream - The dream text to interpret
 * @returns {Promise<string>} - The interpretation
 */
async function interpretDreamWithAI(dream) {
    try {
        // 检测用户输入的语言
        const detectedLanguage = detectLanguage(dream);
        // 更新上下文中的语言
        conversationContext.language = detectedLanguage;
        
        console.log('Detected language:', detectedLanguage);
        
        // 获取对应语言的标题映射
        const sectionTitles = getSectionTitles(detectedLanguage);
        
        // API调用 - 使用ephone.ai提供的API端点
        const apiUrl = 'https://api.ephone.ai/v1/chat/completions';
        
        console.log('Sending request to ephone.ai API...');
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-dVQ2vm5VHPoh6ME0RLPAG9jpeHqxBWgkCYS0XnYy6UZa2F8w'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are a gentle, symbolic dream interpreter. The user will describe a full dream. Your task is to break the dream into symbolic parts and explain each one.

Do not explain this structure to the user. Only use it to shape your output.

---

Format your response exactly like this without adding extra line breaks:

${sectionTitles.sceneAnalysis}  
For each major scene in the dream, include:

➡️ Scene Title - Give the scene a clear, direct title that summarizes the main element (no poetic language)

🔹 **${sectionTitles.dreamImage}**: Briefly describe the moment. Keep the description concise.
🔹 **${sectionTitles.symbolicMeaning}**: What might this symbol or moment represent.
🔹 **${sectionTitles.realLifeConnection}**: What might this relate to in waking life.
🔹 **${sectionTitles.reflectionQuestion}**: A gentle question for the dreamer to ponder.

${sectionTitles.overallDreamMessage}  
Write 1 paragraph to summarize the meaning of the entire dream.

${sectionTitles.suggestions}  
Offer 1–2 gentle suggestions (like journaling, reflection, etc.)

---

IMPORTANT: Respond in the same language as the user's dream description (${detectedLanguage}). 
Keep your writing warm, intuitive, and symbolic. Use markdown bold (**) for titles. Never add extra line breaks before section titles.`
                    },
                    {
                        role: 'user',
                        content: `Interpret this dream: ${dream}`
                    }
                ],
                temperature: 0.7
            })
        });
        
        console.log('Response status:', response.status);
        
        // Check API response
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error details:', errorText);
            
            // Return different error messages based on status
            if (response.status === 401 || response.status === 403) {
                throw new Error(getErrorMessage('unavailable', detectedLanguage));
            } else if (response.status === 429) {
                throw new Error(getErrorMessage('rateLimit', detectedLanguage));
            } else if (response.status >= 500) {
                throw new Error(getErrorMessage('serverError', detectedLanguage));
            } else {
                throw new Error(getErrorMessage('unavailable', detectedLanguage));
            }
        }
        
        const data = await response.json();
        console.log('API response success:', data);
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            let content = data.choices[0].message.content;
            content = formatDreamInterpretation(content);
            return content;
        } else {
            console.error('API response format error:', data);
            throw new Error(getErrorMessage('unavailable', detectedLanguage));
        }
    } catch (error) {
        console.error('Dream interpretation API error:', error);
        
        // Return different error messages based on error type
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            return getErrorMessage('connectionError', conversationContext.language);
        } else if (error.message.includes('temporarily unavailable')) {
            return getErrorMessage('restingOracle', conversationContext.language);
        } else {
            // Use backup responses
            const backupResponses = [
                `🔍 Scene Analysis
➡️ Falling onto Unexpected Ground

🔹 **Dream Image**: You leap from a rooftop, expecting water but finding solid ground instead.
🔹 **Symbolic Meaning**: This moment reflects a gap between expectation and reality.
🔹 **Real-life Connection**: You may be taking risks without fully understanding the outcomes.
🔹 **Reflection Question**: Where else in your life have you expected softness but found hardness?

🌀 **Overall Dream Message**
This dream speaks to a journey from illusion to reality. When we make leaps in life expecting one outcome but encountering another, we're called to adjust quickly. This may be a gentle warning to check your assumptions about a current situation.

🌿 **Suggestions**
- Take time to evaluate your expectations versus reality in current life decisions
- Consider where you might need more preparation before making your next leap`,

                `🔍 Scene Analysis
➡️ Unexpected Landing Surface

🔹 **Dream Image**: ${dream.split(' ').slice(0, 3).join(' ')}... The anticipated softness never materializes.
🔹 **Symbolic Meaning**: There's a disconnect between what you're preparing for and what actually awaits.
🔹 **Real-life Connection**: You may be in a situation where your planning doesn't match the circumstances.
🔹 **Reflection Question**: What safety nets might you need to create for yourself?

🌀 **Overall Dream Message**
Dreams of falling but finding unexpected surfaces often reflect our mind processing moments of realization. The surprise element suggests you may be discovering something important about a situation you thought you understood completely.

🌿 **Suggestions**
- Practice flexibility in your approach to current challenges
- Consider creating backup plans for important life decisions`
            ];
            
            return backupResponses[Math.floor(Math.random() * backupResponses.length)];
        }
    }
}

/**
 * 格式化解梦内容，添加HTML标记使其在界面上更好看
 * @param {string} content - API返回的原始内容
 * @returns {string} - 格式化后的HTML内容
 */
function formatDreamInterpretation(content) {
    // Ensure content is not empty
    if (!content) return '';
    
    // Remove any system prompt content
    const promptKeywords = [
        'Style Guidelines',
        'system', 
        'You are a gentle',
        'Do not explain this structure',
        'Format the output clearly',
        'Do not include headings'
    ];
    
    for (const keyword of promptKeywords) {
        if (content.includes(keyword)) {
            const parts = content.split(keyword);
            content = parts[0];
        }
    }
    
    // Clean up extra whitespace and normalize line breaks
    content = content.trim()
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\s+\n/g, '\n')
        .replace(/\n\s+/g, '\n');
    
    // Fix the issue where Scene Analysis might have a newline before it
    // First, check if the content starts with a newline and Scene Analysis
    if (content.startsWith('\n')) {
        content = content.substring(1);
    }
    
    // Also replace any "newline+Scene Analysis" with just "Scene Analysis"
    content = content.replace(/^\n?🔍 /g, '🔍 ');
    content = content.replace(/\n\n?🔍 /g, '\n🔍 ');
    
    // Convert markdown bold to HTML
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 添加横线 - 使用更精确的模式匹配
    // 为所有以🌀开头的行（整体梦境信息）前添加横线
    content = content.replace(/(🌀 .*?(?:\n|$))/g, '<hr>$1');
    
    // 为所有以🌿开头的行（建议）前添加横线
    content = content.replace(/(🌿 .*?(?:\n|$))/g, '<hr>$1');
    
    // 处理可能出现在文本开头的情况
    if (content.startsWith('🌀 ')) {
        content = '<hr>' + content;
    }
    if (content.startsWith('🌿 ')) {
        content = '<hr>' + content;
    }
    
    // 确保场景分析前没有多余的换行
    content = content.replace(/\n+🔍 /g, '\n🔍 ');
    if (content.startsWith('\n')) {
        content = content.substring(1);
    }
    
    // Format list items
    content = content.replace(/(?:^|\n)- ([^\n]+)/g, '<li>$1</li>');
    content = content.replace(/(<li>[^<]+<\/li>)+/g, '<ul>$&</ul>');
    
    // Convert line breaks to paragraphs
    content = content.replace(/\n\n/g, '</p><p>');
    content = content.replace(/\n/g, '<br>');
    
    // Wrap in container
    content = '<div class="dream-interpretation"><p>' + content + '</p></div>';
    
    // Clean up any remaining markdown artifacts
    content = content.replace(/`/g, '');
    
    return content;
}

/**
 * 检查用户输入是否是翻译请求
 * @param {string} text - 用户输入的文本
 * @returns {boolean} - 是否是翻译请求
 */
function isTranslationRequest(text) {
    const translationKeywords = [
        'translate', 'translation', 'in chinese', 'in spanish', 'in french', 
        '翻译', '中文', '用中文', '换成', '转成', '用西班牙语', '用法语',
        'hablar', 'español', 'en español', 'en français', 'en chinois'
    ];
    
    const lowerText = text.toLowerCase();
    return translationKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * 从用户输入中提取目标语言
 * @param {string} text - 用户输入的文本
 * @returns {string} - 目标语言，如'chinese', 'spanish'等
 */
function extractLanguage(text) {
    const lowerText = text.toLowerCase();
    
    const languageMap = {
        'chinese': ['chinese', '中文', '中国', 'chinois'],
        'spanish': ['spanish', 'español', 'espanol'],
        'french': ['french', 'français', 'francais'],
        'japanese': ['japanese', '日本', 'japonais'],
        'german': ['german', 'deutsch', 'allemand'],
        'russian': ['russian', 'русский', 'russe'],
        'portuguese': ['portuguese', 'português', 'portugues'],
        'italian': ['italian', 'italiano'],
        'korean': ['korean', '한국', 'coréen']
    };
    
    for (const [language, keywords] of Object.entries(languageMap)) {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
            return language;
        }
    }
    
    return 'english'; // 默认英语
}

/**
 * 翻译梦境解释到目标语言
 * @param {string} interpretation - 原始解释内容
 * @param {string} targetLanguage - 目标语言
 * @returns {Promise<string>} - 翻译后的内容
 */
async function translateInterpretation(interpretation, targetLanguage) {
    try {
        // 移除HTML标记，只保留文本内容用于翻译
        const textOnly = interpretation.replace(/<[^>]*>/g, '');
        
        const apiUrl = 'https://api.ephone.ai/v1/chat/completions';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-dVQ2vm5VHPoh6ME0RLPAG9jpeHqxBWgkCYS0XnYy6UZa2F8w'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional translator. Translate the dream interpretation to ${targetLanguage}. 
Keep all of the original structure, formatting, and symbolism. Your output should follow exactly the same format 
as the input, including the emojis and section headings. Do not add any extra text or explanations.

Make sure to preserve these exact section headers with their emojis:
- 🔍 Scene Analysis
- 🌀 Overall Dream Message
- 🌿 Suggestions

Always convert the sections "Dream Image", "Symbolic Meaning", "Real-life Connection", and "Reflection Question" 
to their appropriate translations in ${targetLanguage}.`
                    },
                    {
                        role: 'user',
                        content: textOnly
                    }
                ],
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            throw new Error('Translation service temporarily unavailable.');
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            let translatedContent = data.choices[0].message.content;
            
            // 格式化翻译结果
            translatedContent = formatDreamInterpretation(translatedContent);
            return translatedContent;
        } else {
            throw new Error('Could not process translation.');
        }
    } catch (error) {
        console.error('Translation error:', error);
        return `<div class="dream-interpretation"><p>Translation service is temporarily unavailable. Please try again later.</p></div>`;
    }
}

/**
 * 检查用户输入是否是后续问题
 * @param {string} text - 用户输入的文本
 * @returns {boolean} - 是否是后续问题
 */
function isFollowUpQuestion(text) {
    // 后续问题通常包含问题词或问号
    const questionIndicators = [
        'why', 'what', 'how', 'when', 'where', 'who', 'which', 'whose', 'whom',
        '为什么', '什么', '怎么', '何时', '何处', '谁', '哪个', '?', '？'
    ];
    
    const lowerText = text.toLowerCase();
    
    // 如果有上下文中的梦境，并且用户输入包含问题词或问号，则认为是后续问题
    return conversationContext.dream !== '' && 
           (questionIndicators.some(indicator => lowerText.includes(indicator)) || 
            lowerText.includes('tell me more') || 
            lowerText.includes('more about') ||
            lowerText.includes('explain') ||
            lowerText.includes('elaborate'));
}

/**
 * 处理关于梦境的后续问题
 * @param {string} question - 用户的问题
 * @param {string} dream - 原始梦境
 * @param {string} previousInterpretation - 之前的解释
 * @param {string} language - 当前语言
 * @returns {Promise<string>} - 问题的回答
 */
async function handleFollowUpQuestion(question, dream, previousInterpretation, language) {
    try {
        const apiUrl = 'https://api.ephone.ai/v1/chat/completions';
        
        // 移除HTML标记，只保留文本内容
        const textOnlyInterpretation = previousInterpretation.replace(/<[^>]*>/g, '');
        
        // 构建对话历史上下文
        let conversationHistory = '';
        if (conversationContext.userQuestions.length > 0) {
            // 最多包含最近的3个问题
            const recentQuestions = conversationContext.userQuestions.slice(-3);
            conversationHistory = `Previous questions: ${recentQuestions.join(' | ')}`;
        }
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-dVQ2vm5VHPoh6ME0RLPAG9jpeHqxBWgkCYS0XnYy6UZa2F8w'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are a gentle, symbolic dream interpreter who continues to explore dreams with users.
                        
The user has already shared a dream and received an interpretation. Now they have a follow-up question.

${conversationHistory}

Respond in ${language} language. Your response should be thoughtful but concise. Keep a poetic, intuitive tone 
consistent with the original interpretation.`
                    },
                    {
                        role: 'user',
                        content: `My dream: ${dream}

Previous interpretation: ${textOnlyInterpretation}

My follow-up question: ${question}`
                    }
                ],
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error('Service temporarily unavailable.');
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            let answer = data.choices[0].message.content;
            
            // 简单格式化，但不使用完整的解梦格式
            const formattedAnswer = `<div class="dream-interpretation"><p>${answer.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p></div>`;
            return formattedAnswer;
        } else {
            throw new Error('Could not process response.');
        }
    } catch (error) {
        console.error('Follow-up question error:', error);
        return `<div class="dream-interpretation"><p>${getErrorMessage('unavailable', language)}</p></div>`;
    }
}

/**
 * 检查输入文本是否可能是梦境描述
 * @param {string} text - 用户输入的文本
 * @returns {boolean} - 是否可能是梦境描述
 */
function isPossiblyDream(text) {
    console.log('检查是否是梦境描述:', text);
    
    // 如果文本太短，可能不是完整的梦境描述
    if (text.length < 5) {
        return false;
    }
    
    // 检查是否是日文输入 - 更全面地检测日文字符
    const hasJapaneseChars = /[\u3040-\u309F\u30A0-\u30FF]/.test(text); // 平假名或片假名
    const hasKanji = /[\u4E00-\u9FAF]/.test(text); // 可能是汉字
    
    // 增强日文检测
    if (hasJapaneseChars) {
        console.log('检测到日文字符(平假名/片假名)');
        return true;
    }
    
    // 日文特有的助词和词汇检测
    const japaneseParticles = ['を', 'は', 'が', 'の', 'に', 'で', 'と', 'も', 'から', 'より', 'へ', 'まで'];
    for (const particle of japaneseParticles) {
        if (text.includes(particle)) {
            console.log('检测到日文助词:', particle);
            return true;
        }
    }
    
    // 增强中文梦境关键词检测
    const chineseDreamKeywords = [
        '梦到', '梦见', '梦中', '做梦', '梦境', '睡觉', '睡眠中', '梦里', '梦想', '梦', 
        '夢見', '夢到', '夢中', '做夢', '夢境', '睡覺', '睡眠中', '夢裡', '夢想', '夢'
    ];
    
    // 增强日文梦境关键词检测
    const japaneseDreamKeywords = [
        '夢', '夢を見た', '夢で', '寝て', '眠って', '見た', '見る', '夢の中', '夢の中で', 
        '夢の世界', '悪夢', '夢見た', '夢見る', '寝ている間'
    ];
    
    // 检查中文梦境关键词
    for (const keyword of chineseDreamKeywords) {
        if (text.includes(keyword)) {
            console.log('检测到中文梦境关键词:', keyword);
            return true;
        }
    }
    
    // 检查日文梦境关键词
    for (const keyword of japaneseDreamKeywords) {
        if (text.includes(keyword)) {
            console.log('检测到日文梦境关键词:', keyword);
            return true;
        }
    }
    
    const lowerText = text.toLowerCase();
    
    // 检查是否包含常见的梦境相关词汇或短语
    const dreamIndicators = [
        'dream', 'dreamt', 'dreamed', 'sleep', 'nightmare', 'vision',
        'saw', 'appeared', 'felt', 'flying', 'falling', 'chased',
        'running', 'scared', 'afraid', 'night', 'bed', 'woke up',
        'strange', 'weird', 'surreal', 'memory', 'remember',
        '噩梦', '幻象', '看见', '出现', '感觉', '飞行', 
        '坠落', '追逐', '奇怪', '怪异', '超现实', '记忆', '记得', '醒来'
    ];
    
    // 检查是否包含常见的命令或非梦境内容
    const nonDreamIndicators = [
        'translate', 'help me', 'how to', 'what is', 'tell me about',
        'explain', 'define', 'meaning of', 'definition', 'weather',
        'news', 'stock', 'price', 'buy', 'sell', 'cost', 'hello', 'hi',
        '翻译', '帮助', '如何', '什么是', '告诉我关于',
        '解释', '定义', '的意思', '天气', '新闻', '股票', '价格',
        '购买', '销售', '成本', '你好'
    ];
    
    // 特殊模式匹配 - 中文
    if (/我.*梦/.test(text) || /梦.*我/.test(text) || /我.*夢/.test(text) || /夢.*我/.test(text)) {
        console.log('检测到中文梦境模式: 我+梦/夢');
        return true;
    }
    
    // 特殊模式匹配 - 日文
    if (/私.*夢/.test(text) || /夢.*私/.test(text) || /わたし.*夢/.test(text) || /夢.*わたし/.test(text)) {
        console.log('检测到日文梦境模式: 私/わたし+夢');
        return true;
    }
    
    // 如果包含明显的非梦境指示词，返回false
    for (const indicator of nonDreamIndicators) {
        if (lowerText.includes(indicator)) {
            // 但如果同时包含明确的梦境指示词，仍然视为梦境
            if (text.includes('我梦') || text.includes('梦到') || text.includes('梦见') || 
                lowerText.includes('i dream') || lowerText.includes('had a dream') || 
                lowerText.includes('my dream') || text.includes('夢') || 
                text.includes('私の夢') || text.includes('夢を見た')) {
                return true;
            }
            return false;
        }
    }
    
    // 检查是否包含梦境相关词汇
    for (const indicator of dreamIndicators) {
        if (lowerText.includes(indicator)) {
            return true;
        }
    }
    
    // 特殊处理：检查是否包含"我"+"梦"的组合（可能不相邻）或日文的"夢"+"見"组合
    if ((text.includes('我') && text.includes('梦')) || 
        (text.includes('私') && text.includes('夢')) ||
        (text.includes('夢') && text.includes('見'))) {
        return true;
    }
    
    // 如果文本较长（超过30个字符），可能是在描述一些场景，也视为可能的梦境
    if (text.length > 30) {
        return true;
    }
    
    // 默认情况下，如果没有明确的非梦境指示，也视为可能的梦境
    return true;
}

/**
 * 检测输入文本的语言
 * @param {string} text - 用户输入的文本
 * @returns {string} - 检测到的语言，如'chinese', 'english', 'spanish'等
 */
function detectLanguage(text) {
    // 如果文本太短，难以准确检测
    if (text.length < 2) {
        return 'english';
    }
    
    // 检测日语字符
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
    if (japanesePattern.test(text)) {
        return 'japanese';
    }
    
    // 检测常见的中文字符
    const chinesePattern = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
    if (chinesePattern.test(text)) {
        // 检查是否包含日文助词，如果有则判断为日语
        const japaneseParticles = ['を', 'は', 'が', 'の', 'に', 'で', 'と', 'も', 'から', 'より', 'へ'];
        for (const particle of japaneseParticles) {
            if (text.includes(particle)) {
                return 'japanese';
            }
        }
        return 'chinese';
    }
    
    // 检测韩语字符
    const koreanPattern = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/;
    if (koreanPattern.test(text)) {
        return 'korean';
    }
    
    // 检测俄语字符
    const russianPattern = /[\u0400-\u04FF]/;
    if (russianPattern.test(text)) {
        return 'russian';
    }
    
    // 统计各语言的匹配词数和特征
    const languageScores = {
        english: 0,
        spanish: 0,
        french: 0,
        german: 0,
        portuguese: 0,
        italian: 0
    };
    
    // 英语特有字符和常见词组合
    const englishPattern = /(\s|^)(the|a|an|is|are|was|were|have|has|had|will|would|should|could|can|may|might|must|in|on|at|by|for|with|about|from|to|of|that|this|these|those|it|its|i|my|me|mine|you|your|he|his|him|she|her|hers|we|our|us|they|their|them)(\s|$)/i;
    
    // 西班牙语特有字符和常见词
    const spanishPattern = /[áéíóúüñ¿¡]|(\s|^)(el|la|los|las|un|una|unos|unas|y|o|pero|porque|como|cuando|donde|que|quien|cual|si|no|es|son|está|están)(\s|$)/i;
    
    // 法语特有字符和常见词
    const frenchPattern = /[àâäæçéèêëîïôœùûüÿ]|(\s|^)(le|la|les|un|une|des|et|ou|mais|car|comme|quand|où|que|qui|quel|quelle|si|ne|pas|est|sont)(\s|$)/i;
    
    // 德语特有字符和常见词
    const germanPattern = /[äöüß]|(\s|^)(der|die|das|ein|eine|und|oder|aber|weil|wie|wenn|wo|was|wer|welche|ob|nicht|ist|sind|ich|du|er|sie|wir|ihr|Sie|mein|dein|sein|unser|euer)(\s|$)/i;
    
    // 葡萄牙语特有字符和常见词
    const portuguesePattern = /[áàâãéêíóôõúç]|(\s|^)(o|a|os|as|um|uma|uns|umas|e|ou|mas|se|não|é|são)(\s|$)/i;
    
    // 意大利语特有字符和常见词
    const italianPattern = /[àèéìíîòóùú]|(\s|^)(il|lo|la|i|gli|le|un|uno|una|e|o|ma|perché|come|quando|dove|che|chi|quale|se|non|è|sono)(\s|$)/i;
    
    // 检测特定语言的模式
    if (englishPattern.test(text)) languageScores.english += 3;
    if (spanishPattern.test(text)) languageScores.spanish += 3;
    if (frenchPattern.test(text)) languageScores.french += 3;
    if (germanPattern.test(text)) languageScores.german += 3;
    if (portuguesePattern.test(text)) languageScores.portuguese += 3;
    if (italianPattern.test(text)) languageScores.italian += 3;
    
    // 英语常见词 - 扩展列表
    const englishWords = [
        'the', 'a', 'an', 'and', 'or', 'but', 'if', 'of', 'at', 'by', 'for', 'with', 'about', 'in', 'to', 'from',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'can', 'could', 'may', 'might', 'shall', 'should', 'must', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
        'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
        'mine', 'yours', 'hers', 'ours', 'theirs', 'who', 'whom', 'whose', 'which', 'what', 'where', 'when', 'why', 'how',
        'all', 'any', 'both', 'each', 'few', 'many', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
        'than', 'too', 'very', 'just', 'even', 'also', 'much', 'more', 'most', 'other', 'another', 'then', 'once', 'here',
        'there', 'again', 'ever', 'far', 'forward', 'now', 'still', 'today', 'together', 'well', 'almost', 'enough',
        'already', 'quite', 'rather', 'somewhat', 'yet', 'tomorrow', 'yesterday'
    ];
    
    // 西班牙语常见词
    const spanishWords = ['el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'pero', 'si', 'de', 'en', 'con', 'por', 'para'];
    
    // 法语常见词
    const frenchWords = ['le', 'la', 'les', 'un', 'une', 'et', 'ou', 'mais', 'si', 'de', 'à', 'en', 'avec', 'pour', 'par'];
    
    // 德语常见词 - 扩展列表
    const germanWords = [
        'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'aber', 'weil', 'wie', 'wenn', 'wo', 'was', 'wer', 'welche', 'ob', 'nicht',
        'ist', 'sind', 'war', 'waren', 'wird', 'werden', 'kann', 'können', 'darf', 'dürfen', 'muss', 'müssen', 'soll', 'sollen',
        'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'Sie', 'mein', 'dein', 'sein', 'ihr', 'unser', 'euer', 'Ihr',
        'mir', 'dir', 'ihm', 'uns', 'euch', 'ihnen', 'mich', 'dich', 'sich', 'von', 'zu', 'aus', 'mit', 'nach', 'bei',
        'seit', 'vor', 'durch', 'für', 'gegen', 'ohne', 'um', 'bis', 'auf', 'unter', 'über', 'neben', 'zwischen',
        'hier', 'dort', 'da', 'heute', 'morgen', 'gestern', 'jetzt', 'bald', 'später', 'immer', 'nie', 'manchmal'
    ];
    
    // 葡萄牙语常见词
    const portugueseWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'e', 'ou', 'mas', 'se', 'de', 'em', 'com', 'por', 'para'];
    
    // 意大利语常见词
    const italianWords = ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'e', 'o', 'ma', 'se', 'di', 'a', 'in', 'con', 'per'];
    
    // 将文本转换为小写并分割成单词
    const words = text.toLowerCase().split(/\s+/);
    
    // 计算每种语言的匹配词数
    for (const word of words) {
        // 清理单词，去除标点符号
        const cleanWord = word.replace(/[.,!?;:()'"]/g, '');
        if (!cleanWord) continue;
        
        if (englishWords.includes(cleanWord)) languageScores.english++;
        if (spanishWords.includes(cleanWord)) languageScores.spanish++;
        if (frenchWords.includes(cleanWord)) languageScores.french++;
        if (germanWords.includes(cleanWord)) languageScores.german++;
        if (portugueseWords.includes(cleanWord)) languageScores.portuguese++;
        if (italianWords.includes(cleanWord)) languageScores.italian++;
    }
    
    // 英语特定组合检测
    const englishCombinations = [
        /\b(I am|I'm|you are|you're|he is|he's|she is|she's|it is|it's|we are|we're|they are|they're)\b/i,
        /\b(have been|has been|had been|will be|would be|can be|could be|may be|might be|must be)\b/i,
        /\b(do not|don't|does not|doesn't|did not|didn't|will not|won't|would not|wouldn't)\b/i,
        /\b(in the|on the|at the|by the|for the|with the|about the|from the|to the|of the)\b/i,
        /\b(is a|is an|was a|was an|there is|there are|there was|there were)\b/i
    ];
    
    // 德语特定组合检测
    const germanCombinations = [
        /\b(ich bin|du bist|er ist|sie ist|es ist|wir sind|ihr seid|sie sind|Sie sind)\b/i,
        /\b(ich habe|du hast|er hat|sie hat|es hat|wir haben|ihr habt|sie haben|Sie haben)\b/i,
        /\b(ich werde|du wirst|er wird|sie wird|es wird|wir werden|ihr werdet|sie werden)\b/i,
        /\b(in dem|in der|in den|auf dem|auf der|auf den|mit dem|mit der|mit den)\b/i,
        /\b(es gibt|es gab|es wird geben|kann sein|könnte sein|muss sein|darf sein)\b/i
    ];
    
    // 检查英语和德语的特定组合
    for (const pattern of englishCombinations) {
        if (pattern.test(text)) {
            languageScores.english += 5;
        }
    }
    
    for (const pattern of germanCombinations) {
        if (pattern.test(text)) {
            languageScores.german += 5;
        }
    }
    
    // 额外检查：英语的 's 所有格和缩写形式
    if (/\b\w+'s\b|\b(don't|can't|won't|shouldn't|couldn't|wouldn't|haven't|hasn't|didn't|isn't|aren't|wasn't|weren't)\b/i.test(text)) {
        languageScores.english += 5;
    }
    
    // 额外检查：德语的复合词特征
    if (/[a-zäöüß]{10,}/i.test(text)) {
        languageScores.german += 3;
    }
    
    // 找出得分最高的语言
    let maxScore = 0;
    let detectedLanguage = 'english'; // 默认为英语，但需要有足够的证据
    
    for (const [language, score] of Object.entries(languageScores)) {
        if (score > maxScore) {
            maxScore = score;
            detectedLanguage = language;
        }
    }
    
    // 如果没有明显的语言特征或英语得分不够高，默认为英语
    return detectedLanguage;
}

/**
 * 根据语言获取错误消息
 * @param {string} errorType - 错误类型
 * @param {string} language - 语言
 * @returns {string} - 对应语言的错误消息
 */
function getErrorMessage(errorType, language) {
    const errorMessages = {
        'unavailable': {
            'english': 'The dream sage is temporarily unavailable. Please try again later.',
            'chinese': '解梦者暂时不可用。请稍后再试。',
            'spanish': 'El sabio de los sueños no está disponible temporalmente. Por favor, inténtalo más tarde.',
            'french': "Le sage des rêves est temporairement indisponible. Veuillez réessayer plus tard.",
            'german': 'Der Traumweise ist vorübergehend nicht verfügbar. Bitte versuche es später erneut.',
            'russian': 'Мудрец сновидений временно недоступен. Пожалуйста, повторите попытку позже.',
            'japanese': '夢の賢者は一時的に利用できません。後でもう一度お試しください。',
            'korean': '꿈의 현자를 일시적으로 사용할 수 없습니다. 나중에 다시 시도해 주세요.',
            'portuguese': 'O sábio dos sonhos está temporariamente indisponível. Por favor, tente novamente mais tarde.',
            'italian': "Il saggio dei sogni è temporaneamente non disponibile. Si prega di riprovare più tardi."
        },
        'rateLimit': {
            'english': 'The sage needs a moment to rest. Please try again in a few moments.',
            'chinese': '解梦者需要片刻休息。请稍后再试。',
            'spanish': 'El sabio necesita un momento para descansar. Por favor, inténtalo de nuevo en unos momentos.',
            'french': 'Le sage a besoin d\'un moment de repos. Veuillez réessayer dans quelques instants.',
            'german': 'Der Weise braucht einen Moment der Ruhe. Bitte versuche es in einigen Augenblicken erneut.',
            'russian': 'Мудрецу нужен момент для отдыха. Пожалуйста, повторите попытку через несколько мгновений.',
            'japanese': '賢者は少し休息が必要です。しばらくしてからもう一度お試しください。',
            'korean': '현자는 잠시 휴식이 필요합니다. 잠시 후에 다시 시도해 주세요.',
            'portuguese': 'O sábio precisa de um momento para descansar. Por favor, tente novamente em alguns instantes.',
            'italian': 'Il saggio ha bisogno di un momento di riposo. Si prega di riprovare tra qualche istante.'
        },
        'serverError': {
            'english': 'The sage is momentarily silent. Please try again later.',
            'chinese': '解梦者暂时沉默了。请稍后再试。',
            'spanish': 'El sabio está momentáneamente en silencio. Por favor, inténtalo más tarde.',
            'french': 'Le sage est momentanément silencieux. Veuillez réessayer plus tard.',
            'german': 'Der Weise schweigt momentan. Bitte versuche es später erneut.',
            'russian': 'Мудрец на мгновение замолчал. Пожалуйста, повторите попытку позже.',
            'japanese': '賢者は一時的に沈黙しています。後でもう一度お試しください。',
            'korean': '현자가 잠시 침묵하고 있습니다. 나중에 다시 시도해 주세요.',
            'portuguese': 'O sábio está momentaneamente em silêncio. Por favor, tente novamente mais tarde.',
            'italian': 'Il saggio è momentaneamente silenzioso. Si prega di riprovare più tardi.'
        },
        'connectionError': {
            'english': 'Unable to connect to the dream sage. Please check your connection and try again.',
            'chinese': '无法连接到解梦者。请检查您的网络连接并重试。',
            'spanish': 'No se puede conectar con el sabio de los sueños. Por favor, comprueba tu conexión e inténtalo de nuevo.',
            'french': 'Impossible de se connecter au sage des rêves. Veuillez vérifier votre connexion et réessayer.',
            'german': 'Es kann keine Verbindung zum Traumweisen hergestellt werden. Bitte überprüfe deine Verbindung und versuche es erneut.',
            'russian': 'Не удается подключиться к мудрецу сновидений. Пожалуйста, проверьте ваше соединение и попробуйте снова.',
            'japanese': '夢の賢者に接続できません。接続を確認して、もう一度お試しください。',
            'korean': '꿈의 현자에 연결할 수 없습니다. 연결을 확인하고 다시 시도해 주세요.',
            'portuguese': 'Não é possível conectar-se ao sábio dos sonhos. Verifique sua conexão e tente novamente.',
            'italian': 'Impossibile connettersi al saggio dei sogni. Si prega di controllare la connessione e riprovare.'
        },
        'restingOracle': {
            'english': 'The dream sage is resting. Please try again in a few moments.',
            'chinese': '解梦者正在休息。请稍后再试。',
            'spanish': 'El sabio de los sueños está descansando. Por favor, inténtalo de nuevo en unos momentos.',
            'french': 'Le sage des rêves se repose. Veuillez réessayer dans quelques instants.',
            'german': 'Der Traumweise ruht sich aus. Bitte versuche es in einigen Augenblicken erneut.',
            'russian': 'Мудрец сновидений отдыхает. Пожалуйста, повторите попытку через несколько мгновений.',
            'japanese': '夢の賢者は休んでいます。しばらくしてからもう一度お試しください。',
            'korean': '꿈의 현자가 휴식 중입니다. 잠시 후에 다시 시도해 주세요.',
            'portuguese': 'O sábio dos sonhos está descansando. Por favor, tente novamente em alguns instantes.',
            'italian': 'Il saggio dei sogni sta riposando. Si prega di riprovare tra qualche istante.'
        },
        'notDream': {
            'english': 'It seems you might not have described a dream. Please share a dream experience for interpretation. Dreams typically include scenes, emotions, or experiences that occurred while sleeping.',
            'chinese': '您似乎没有描述一个梦境。请分享一个梦境体验以获得解析。梦境通常包括睡眠中发生的场景、情感或体验。',
            'spanish': 'Parece que no has descrito un sueño. Por favor, comparte una experiencia de sueño para su interpretación. Los sueños suelen incluir escenas, emociones o experiencias que ocurrieron durante el sueño.',
            'french': 'Il semble que vous n\'ayez pas décrit un rêve. Veuillez partager une expérience de rêve pour l\'interprétation. Les rêves incluent généralement des scènes, des émotions ou des expériences qui se sont produites pendant le sommeil.',
            'german': 'Es scheint, dass du keinen Traum beschrieben hast. Bitte teile ein Traumerlebnis zur Interpretation mit. Träume beinhalten typischerweise Szenen, Emotionen oder Erfahrungen, die während des Schlafens auftraten.',
            'russian': 'Кажется, вы не описали сон. Пожалуйста, поделитесь сновидением для интерпретации. Сны обычно включают сцены, эмоции или опыт, которые произошли во время сна.',
            'japanese': '夢を説明していないようです。解釈のために夢の体験を共有してください。夢は通常、睡眠中に起こったシーン、感情、または経験を含みます。',
            'korean': '꿈을 설명하지 않은 것 같습니다. 해석을 위해 꿈 경험을 공유해 주세요. 꿈은 일반적으로 수면 중에 발생한 장면, 감정 또는 경험을 포함합니다.',
            'portuguese': 'Parece que você não descreveu um sonho. Por favor, compartilhe uma experiência de sonho para interpretação. Os sonhos geralmente incluem cenas, emoções ou experiências que ocorreram durante o sono.',
            'italian': 'Sembra che tu non abbia descritto un sogno. Per favore, condividi un\'esperienza di sogno per l\'interpretazione. I sogni in genere includono scene, emozioni o esperienze che si sono verificate durante il sonno.'
        }
    };
    
    // 如果没有对应语言的错误消息，使用英语
    const lang = errorMessages[errorType][language] ? language : 'english';
    return errorMessages[errorType][lang];
}

/**
 * 获取不同语言的标题映射
 * @param {string} language - 语言
 * @returns {Object} - 标题映射对象
 */
function getSectionTitles(language) {
    const titles = {
        'english': {
            sceneAnalysis: '🔍 Scene Analysis',
            dreamImage: 'Dream Image',
            symbolicMeaning: 'Symbolic Meaning',
            realLifeConnection: 'Real-life Connection',
            reflectionQuestion: 'Reflection Question',
            overallDreamMessage: '🌀 **Overall Dream Message**',
            suggestions: '🌿 **Suggestions**'
        },
        'chinese': {
            sceneAnalysis: '🔍 场景分析',
            dreamImage: '梦境画面',
            symbolicMeaning: '象征意义',
            realLifeConnection: '现实生活联系',
            reflectionQuestion: '反思问题',
            overallDreamMessage: '🌀 **整体梦境信息**',
            suggestions: '🌿 **建议**'
        },
        'spanish': {
            sceneAnalysis: '🔍 Análisis de la Escena',
            dreamImage: 'Imagen del Sueño',
            symbolicMeaning: 'Significado Simbólico',
            realLifeConnection: 'Conexión con la Vida Real',
            reflectionQuestion: 'Pregunta de Reflexión',
            overallDreamMessage: '🌀 **Mensaje General del Sueño**',
            suggestions: '🌿 **Sugerencias**'
        },
        'french': {
            sceneAnalysis: '🔍 Analyse de la Scène',
            dreamImage: 'Image du Rêve',
            symbolicMeaning: 'Signification Symbolique',
            realLifeConnection: 'Connexion à la Vie Réelle',
            reflectionQuestion: 'Question de Réflexion',
            overallDreamMessage: '🌀 **Message Global du Rêve**',
            suggestions: '🌿 **Suggestions**'
        },
        'german': {
            sceneAnalysis: '🔍 Szenenanalyse',
            dreamImage: 'Traumbild',
            symbolicMeaning: 'Symbolische Bedeutung',
            realLifeConnection: 'Verbindung zum realen Leben',
            reflectionQuestion: 'Reflexionsfrage',
            overallDreamMessage: '🌀 **Gesamte Traumbotschaft**',
            suggestions: '🌿 **Vorschläge**'
        },
        'russian': {
            sceneAnalysis: '🔍 Анализ Сцены',
            dreamImage: 'Образ Сна',
            symbolicMeaning: 'Символическое Значение',
            realLifeConnection: 'Связь с Реальной Жизнью',
            reflectionQuestion: 'Вопрос для Размышления',
            overallDreamMessage: '🌀 **Общее Послание Сна**',
            suggestions: '🌿 **Предложения**'
        },
        'japanese': {
            sceneAnalysis: '🔍 場面分析',
            dreamImage: '夢のイメージ',
            symbolicMeaning: '象徴的な意味',
            realLifeConnection: '現実生活とのつながり',
            reflectionQuestion: '内省の質問',
            overallDreamMessage: '🌀 **夢の全体的なメッセージ**',
            suggestions: '🌿 **提案**'
        },
        'korean': {
            sceneAnalysis: '🔍 장면 분석',
            dreamImage: '꿈 이미지',
            symbolicMeaning: '상징적 의미',
            realLifeConnection: '실생활 연결',
            reflectionQuestion: '성찰 질문',
            overallDreamMessage: '🌀 **전체 꿈 메시지**',
            suggestions: '🌿 **제안**'
        },
        'portuguese': {
            sceneAnalysis: '🔍 Análise da Cena',
            dreamImage: 'Imagem do Sonho',
            symbolicMeaning: 'Significado Simbólico',
            realLifeConnection: 'Conexão com a Vida Real',
            reflectionQuestion: 'Pergunta de Reflexão',
            overallDreamMessage: '🌀 **Mensagem Geral do Sonho**',
            suggestions: '🌿 **Sugestões**'
        },
        'italian': {
            sceneAnalysis: '🔍 Analisi della Scena',
            dreamImage: 'Immagine del Sogno',
            symbolicMeaning: 'Significato Simbolico',
            realLifeConnection: 'Connessione con la Vita Reale',
            reflectionQuestion: 'Domanda di Riflessione',
            overallDreamMessage: '🌀 **Messaggio Complessivo del Sogno**',
            suggestions: '🌿 **Suggerimenti**'
        }
    };
    
    // 如果没有对应语言的标题映射，使用英语
    return titles[language] || titles['english'];
}

/**
 * 根据语言获取加载提示消息
 * @param {string} language - 语言
 * @returns {string} - 加载提示消息
 */
function getContemplatingMessage(language) {
    const messages = {
        'english': 'The sage is contemplating your dream...',
        'chinese': '解梦者正在思考你的梦境...',
        'spanish': 'El sabio está contemplando tu sueño...',
        'french': "Le sage réfléchit à votre rêve...",
        'german': 'Der Weise denkt über deinen Traum nach...',
        'russian': 'Мудрец размышляет о вашем сне...',
        'japanese': '賢者はあなたの夢を考えています...',
        'korean': '현자가 당신의 꿈을 생각하고 있습니다...',
        'portuguese': 'O sábio está contemplando o seu sonho...',
        'italian': "Il saggio sta contemplando il tuo sogno..."
    };
    
    // 如果没有对应语言的加载提示消息，使用英语
    return messages[language] || messages['english'];
}