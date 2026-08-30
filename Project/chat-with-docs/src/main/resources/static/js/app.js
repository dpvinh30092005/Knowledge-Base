const fileInput = document.getElementById('fileInput');
const uploadBox = document.querySelector('.upload-box');
const docList = document.getElementById('docList');
const docEmpty = document.getElementById('docEmpty');
const messages = document.getElementById('messages');
const welcome = document.getElementById('welcome');
const question = document.getElementById('question');
const sendBtn = document.getElementById('sendBtn');
const toast = document.getElementById('toast');

let hasDocs = false;

// Prior conversation turns ({ role, content }) sent with each question so the
// backend can resolve follow-ups like "it" or "that". Kept in send order.
const history = [];

function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Safely render markdown (marked -> DOMPurify). Falls back to plain text if libs aren't ready.
function renderMarkdown(el, text) {
    if (window.marked && window.DOMPurify) {
        const html = window.DOMPurify.sanitize(
            window.marked.parse(text, { gfm: true, breaks: true }));
        el.innerHTML = html;
        el.querySelectorAll('a').forEach(a => {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        });
    } else {
        el.textContent = text;
    }
}

// Parse a raw SSE block into { event, data } per the SSE spec.
function parseSseBlock(raw) {
    let eventName = 'message';
    const dataLines = [];
    for (let line of raw.split('\n')) {
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith('event:')) {
            eventName = line.slice(6).replace(/^ /, '');
        } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).replace(/^ /, ''));
        }
    }
    return { event: eventName, data: dataLines.join('\n') };
}

fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    // Loading state: dim the upload box and show a spinner while chunking runs.
    const uploadDefault = uploadBox.innerHTML;
    uploadBox.classList.add('loading');
    uploadBox.innerHTML = '<span class="spinner"></span> Processing…';

    // A placeholder document row with its own spinner until the server responds.
    if (!hasDocs) { docEmpty.remove(); hasDocs = true; }
    const li = document.createElement('li');
    li.className = 'processing';
    li.innerHTML = '<span class="name">' + escapeHtml(file.name) +
        '</span><span class="spinner"></span>';
    docList.appendChild(li);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/documents', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        li.classList.remove('processing');
        li.innerHTML = '<span class="name">' + escapeHtml(data.fileName) +
            '</span><span class="count">' + data.chunkCount + ' chunks</span>';
        showToast('Uploaded “' + data.fileName + '”');
    } catch (err) {
        li.remove();
        if (!docList.querySelector('li')) {
            docList.appendChild(docEmpty);
            hasDocs = false;
        }
        showToast('Failed to upload document: ' + err.message);
    } finally {
        uploadBox.classList.remove('loading');
        uploadBox.innerHTML = uploadDefault;
        fileInput.value = '';
    }
});

function addMessage(role) {
    if (welcome) welcome.remove();
    const msg = document.createElement('div');
    msg.className = 'msg ' + role;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (role === 'bot') bubble.classList.add('markdown');
    msg.appendChild(bubble);
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
    return { msg, bubble };
}

// Turn [n] markers in the rendered answer into clickable citation chips.
// Returns the set of source numbers actually cited. Skips code blocks.
function linkCitations(container, sources) {
    const maxIdx = sources ? sources.length : 0;
    const cited = new Set();
    if (maxIdx === 0) return cited;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.parentElement.closest('pre, code, .cite')) continue;
        if (/\[\d+\]/.test(node.nodeValue)) textNodes.push(node);
    }

    textNodes.forEach(node => {
        const text = node.nodeValue;
        const frag = document.createDocumentFragment();
        let last = 0;
        text.replace(/\[(\d+)\]/g, (match, num, offset) => {
            const idx = parseInt(num, 10);
            frag.appendChild(document.createTextNode(text.slice(last, offset)));
            if (idx >= 1 && idx <= maxIdx) {
                const sup = document.createElement('sup');
                sup.className = 'cite';
                sup.textContent = idx;
                sup.dataset.idx = idx;
                sup.title = 'Source ' + idx;
                frag.appendChild(sup);
                cited.add(idx);
            } else {
                frag.appendChild(document.createTextNode(match));
            }
            last = offset + match.length;
            return match;
        });
        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
    });
    return cited;
}

function renderSources(msgEl, sources, cited) {
    if (!sources || sources.length === 0) return;
    // Show only the passages the answer cited; fall back to all if none were cited.
    const shown = (cited && cited.size)
        ? sources.filter(s => cited.has(s.index))
        : sources;
    if (shown.length === 0) return;

    const details = document.createElement('details');
    details.className = 'sources';
    const summary = document.createElement('summary');
    summary.textContent = 'Sources (' + shown.length + ')';
    details.appendChild(summary);
    shown.forEach(s => {
        const item = document.createElement('div');
        item.className = 'source-item';
        item.dataset.idx = s.index;
        const loc = (s.pageNumber != null)
            ? escapeHtml(s.fileName) + ' · page ' + s.pageNumber
            : escapeHtml(s.fileName);
        item.innerHTML = '<span class="src-num">' + s.index + '</span>' +
            '<span class="file">' + loc + '</span>' +
            '<div class="passage">' + escapeHtml(s.text) + '</div>';
        details.appendChild(item);
    });
    msgEl.appendChild(details);
}

// Clicking a [n] chip opens the sources panel and highlights that passage.
messages.addEventListener('click', e => {
    const chip = e.target.closest('.cite');
    if (!chip) return;
    const msg = chip.closest('.msg');
    const details = msg.querySelector('details.sources');
    if (details) details.open = true;
    const card = msg.querySelector('.source-item[data-idx="' + chip.dataset.idx + '"]');
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        card.classList.add('active');
        setTimeout(() => card.classList.remove('active'), 1600);
    }
});

async function send() {
    const text = question.value.trim();
    if (!text) return;

    const userMsg = addMessage('user');
    userMsg.bubble.textContent = text;
    messages.scrollTop = messages.scrollHeight;

    question.value = '';
    question.style.height = 'auto';
    sendBtn.disabled = true;

    const bot = addMessage('bot');
    const bubble = bot.bubble;
    bubble.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';

    let answer = '';
    let sources = null;
    let firstToken = true;

    try {
        const res = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: text, history })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let sep;
            while ((sep = buffer.indexOf('\n\n')) !== -1) {
                const block = buffer.slice(0, sep);
                buffer = buffer.slice(sep + 2);
                if (!block.trim()) continue;

                const { event, data } = parseSseBlock(block);
                if (event === 'sources') {
                    sources = JSON.parse(data);
                } else if (event === 'token') {
                    if (firstToken) { bubble.textContent = ''; firstToken = false; }
                    answer += JSON.parse(data).t;
                    renderMarkdown(bubble, answer);
                    messages.scrollTop = messages.scrollHeight;
                } else if (event === 'error') {
                    throw new Error(JSON.parse(data).message);
                }
            }
        }

        if (firstToken) bubble.textContent = '(no content returned)';
        const cited = linkCitations(bubble, sources);
        renderSources(bot.msg, sources, cited);

        // Record the completed turn so the next question carries this context.
        if (answer) {
            history.push({ role: 'user', content: text });
            history.push({ role: 'assistant', content: answer });
        }
    } catch (err) {
        bubble.classList.remove('markdown');
        bubble.textContent = 'An error occurred: ' + err.message;
    } finally {
        sendBtn.disabled = false;
        question.focus();
    }
}

sendBtn.addEventListener('click', send);
question.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
    }
});
question.addEventListener('input', () => {
    question.style.height = 'auto';
    question.style.height = Math.min(question.scrollHeight, 120) + 'px';
});
