// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('searchBox').addEventListener('input', performSearch);
    
    // Close search results when clicking elsewhere
    document.addEventListener('click', function(e) {
        const searchResults = document.getElementById('searchResults');
        const searchBox = document.getElementById('searchBox');
        
        if (e.target !== searchResults && 
            e.target !== searchBox && 
            !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
});

function performSearch() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase().trim();
    const searchResults = document.getElementById('searchResults');
    const searchResultsList = document.getElementById('searchResultsList');
    
    // If search is empty, hide results
    if (searchTerm === '') {
        searchResults.style.display = 'none';
        return;
    }
    
    // Clear previous results
    searchResultsList.innerHTML = '';
    
    // Search content data
    const contentData = [
        {
            title: "Recurring Dreams: Patterns, Messages, and the Soul's Repetition",
            url: getRelativePath("journal/recurring.html"),
            description: "You've had this dream before. Maybe it changes slightly. Maybe not at all. But it returns — again and again — whispering what has not yet been heard.",
            keywords: ["recurring", "repetition", "pattern", "loop", "message", "lesson", "unresolved", "blocked", "qi", "integration", "transformation", "cycle", "return"]
        },
        {
            title: "Dreaming of Being Attacked: Fear, Protection, and Inner Conflict",
            url: getRelativePath("journal/attacked.html"),
            description: "The dream comes fast. A stranger lunges. A shadow strikes. A figure chases you down. Whether you fight back or freeze, this dream doesn't always mean you're in danger.",
            keywords: ["attacked", "violence", "threat", "fear", "protection", "conflict", "defense", "boundaries", "trauma", "powerless", "fight", "freeze", "shadow", "danger", "safety"]
        },
        {
            title: "Dreaming of Losing Hair: Aging, Identity, and Fear of Loss",
            url: getRelativePath("journal/hair-loss.html"),
            description: "Hair falls. In the sink, on the floor, through your fingers. In a dream, it can feel unsettling, even frightening. But it often speaks to a deeper story — about who you are, and what you fear losing.",
            keywords: ["hair loss", "balding", "aging", "identity", "fear", "transformation", "vitality", "spirit", "anxiety", "appearance", "power", "vulnerability", "acceptance", "letting go", "self-image"]
        },
        {
            title: "Dreaming of a Car Crash: Loss of Control, Impact, and Emotional Reckoning",
            url: getRelativePath("journal/car-crash.html"),
            description: "One moment you're driving — the next, impact. Dreams of car crashes are loud, sudden, and unforgettable. But they often reveal more about your inner direction than any real road.",
            keywords: ["car crash", "accident", "collision", "vehicle", "control", "impact", "direction", "flow", "truth", "consequences", "change", "warning", "fear", "revelation", "awakening", "path"]
        },
        {
            title: "Dreaming of Fire: Transformation, Emotion, and Inner Power",
            url: getRelativePath("journal/fire.html"),
            description: "Fire in dreams is never quiet. It burns, it spreads, it consumes — or warms, protects, and lights the way. To dream of fire is to confront what is untamed, emotional, and deeply alive within you.",
            keywords: ["fire", "burning", "flame", "transformation", "emotion", "passion", "anger", "destruction", "purification", "rebirth", "yang", "change", "power", "heat", "energy"]
        },
        {
            title: "Dreaming of Exams: Pressure, Self-Worth, and Readiness Revealed",
            url: getRelativePath("journal/exam.html"),
            description: "You walk into a room. The exam has begun. You didn't study. Or you can't find the questions. Or the clock is already running out. To dream of exams is to meet the parts of you still afraid of being measured.",
            keywords: ["exam", "test", "assessment", "pressure", "self-worth", "readiness", "anxiety", "evaluation", "measurement", "study", "classroom", "education", "fear", "failure"]
        },
        {
            title: "Dreaming of Pregnancy: Growth, Potential, and Inner Creation",
            url: getRelativePath("journal/pregnancy.html"),
            description: "To dream of pregnancy is to feel something forming within — slowly, silently, powerfully. It may not be about a child, but about an idea, a transformation, a self yet to be born.",
            keywords: ["pregnancy", "birth", "growth", "creation", "potential", "transformation", "development", "inner life", "creativity", "maturity", "responsibility"]
        },
        {
            title: "Dreaming of Weddings: Symbolism of Union, Change, and Emotional Commitment",
            url: getRelativePath("journal/wedding.html"),
            description: "A wedding in a dream is not always about romance. It may not be about a partner at all. Instead, it often represents a transition — a union between old and new selves.",
            keywords: ["wedding", "marriage", "commitment", "union", "transition", "change", "integration", "harmony", "yin yang", "relationship", "ceremony"]
        },
        {
            title: "Dreaming of Spiders: Symbolism, Fear, and Emotional Insight",
            url: getRelativePath("journal/spider.html"),
            description: "Dreams involving spiders are common and can evoke a range of emotions, from fear to fascination. These dreams often carry deep symbolic meanings.",
            keywords: ["spider", "web", "fear", "anxiety", "creativity", "patience", "feminine", "power", "manipulation", "symbolism"]
        },
        {
            title: "Why You Keep Dreaming About Someone Who Has Died",
            url: getRelativePath("journal/died.html"),
            description: "Some dreams feel like visitations. You see someone who's no longer here — a loved one, a relative, a figure from your past. They may speak, look at you, embrace you — or simply appear.",
            keywords: ["death", "died", "departed", "grief", "loss", "visitation", "spirit", "afterlife", "memory", "healing", "closure", "deceased"]
        },
        {
            title: "Why You Keep Dreaming About Being Late",
            url: getRelativePath("journal/late.html"),
            description: "You're rushing. The train is leaving. The meeting has started. The ceremony is over. You're late — and no matter how fast you move, you can't catch up.",
            keywords: ["late", "rushing", "missing", "delay", "time", "pressure", "anxiety", "urgency", "opportunity", "transition"]
        },
        {
            title: "Why You Keep Dreaming About Flying",
            url: getRelativePath("journal/flying.html"),
            description: "Flying in a dream often feels euphoric. There is weightlessness, freedom, a sense of rising above everything. But not all flying dreams are joyful.",
            keywords: ["flying", "dream", "freedom", "weightlessness", "euphoric", "transcend", "escape", "spirit", "shen", "control"]
        },
        {
            title: "What Does It Mean to Dream of a Snake?",
            url: getRelativePath("journal/snake.html"),
            description: "A snake in a dream makes you pause. It moves without sound. It watches. It waits. In Eastern tradition, the snake is not evil.",
            keywords: ["snake", "dream", "transformation", "change", "hidden", "strength", "intelligence"]
        },
        {
            title: "Why You Keep Dreaming About Your Ex",
            url: getRelativePath("journal/ex.html"),
            description: "An ex in a dream is never just a person — it's a story that never finished writing. These dreams can stir longing, regret, relief, or even guilt.",
            keywords: ["ex", "lover", "past", "relationship", "heart", "unfinished", "unresolved"]
        },
        {
            title: "Water in Dreams: Emotion, Flow, and Balance",
            url: getRelativePath("journal/water.html"),
            description: "Water is one of the most ancient and universal dream symbols. It has no shape of its own — it becomes what contains it.",
            keywords: ["water", "emotion", "flow", "balance", "wisdom", "yield", "powerful"]
        },
        {
            title: "Why You Keep Dreaming Your Teeth Are Falling Out",
            url: getRelativePath("journal/teeth.html"),
            description: "Teeth falling out in dreams is one of the most searched symbols in the world — and one of the most misunderstood.",
            keywords: ["teeth", "falling", "loss", "decay", "control", "aging", "exposure", "self-image"]
        },
        {
            title: "Why You Keep Dreaming About Being Chased",
            url: getRelativePath("journal/chase.html"),
            description: "To be chased in a dream is to feel urgency without direction. Your body runs, your breath shortens, but often — you don't know what you're running from.",
            keywords: ["chase", "run", "pursue", "anxiety", "fear", "avoidance", "escape", "shadow"]
        },
        {
            title: "Why You Keep Dreaming About Falling",
            url: getRelativePath("journal/falling.html"),
            description: "Falling in a dream is sudden, powerless, and unforgettable. It pulls you out of the sky, out of sleep, and sometimes — out of your sense of control.",
            keywords: ["falling", "sudden", "powerless", "unforgettable", "sky", "sleep", "control"]
        },
        {
            title: "Why You Keep Dreaming About Being Naked in Public",
            url: getRelativePath("journal/naked.html"),
            description: "To be naked in a dream — especially in front of others — is to feel exposed. Not just without clothing, but without protection, without performance.",
            keywords: ["naked", "exposure", "public", "feeling", "self-consciousness", "vulnerability", "self-awareness"]
        }
    ];
    
    // Perform search
    const results = contentData.filter(item => {
        return (
            item.title.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.keywords.some(keyword => keyword.includes(searchTerm))
        );
    });
    
    // Display results
    if (results.length > 0) {
        results.forEach(result => {
            const li = document.createElement('li');
            li.className = 'search-result-item';
            li.innerHTML = `
                <a href="${result.url}" target="_blank">${result.title}</a>
                <p>${result.description}</p>
            `;
            searchResultsList.appendChild(li);
        });
    } else {
        searchResultsList.innerHTML = '<li class="no-results">No results found</li>';
    }
    
    searchResults.style.display = 'block';
}

// Helper function to handle relative paths
function getRelativePath(path) {
    // Check if we're in the journal directory
    if (window.location.pathname.includes('/journal/')) {
        return '../' + path;
    }
    return path;
} 