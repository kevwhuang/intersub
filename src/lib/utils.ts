export function formatDate(iso: string): string {
    if (!iso) return '';

    const date = new Date(iso + 'T00:00:00');

    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getDifficultyMeta(difficulty: string) {
    const map: Record<string, { bg: string; cover: string; fg: string; ink: string; label: string }> = {
        Advanced: { bg: 'var(--color-error-bg)', cover: '#f4ecef', fg: 'var(--color-error-ink)', ink: '#a4324a', label: 'Advanced' },
        Beginner: { bg: 'var(--color-success-bg)', cover: '#eef4f1', fg: 'var(--color-success)', ink: '#0d7a5f', label: 'Beginner' },
        Intermediate: { bg: 'var(--color-warn-bg)', cover: '#f6f0e6', fg: 'var(--color-warn)', ink: '#9a5b00', label: 'Intermediate' },
    };

    return map[difficulty] ?? { bg: '#eceef2', cover: '#f0f1f4', fg: '#4a515e', ink: '#4a515e', label: difficulty };
}

export function getInitials(title: string): string {
    return title.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
}

export function parseSeminarContent(md: string): Array<{ content: string; type: 'h' | 'li' | 'p' }> {
    const blocks: Array<{ content: string; type: 'h' | 'li' | 'p' }> = [];

    for (const line of (md || '').split('\n')) {
        const trimmed = line.trim();

        if (!trimmed) continue;
        if (trimmed.startsWith('## ')) blocks.push({ content: trimmed.slice(3), type: 'h' });
        else if (trimmed.startsWith('- ')) blocks.push({ content: trimmed.slice(2), type: 'li' });
        else blocks.push({ content: trimmed, type: 'p' });
    }

    return blocks;
}
