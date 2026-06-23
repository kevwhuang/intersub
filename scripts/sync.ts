import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API_URL = process.argv[2] || 'http://localhost:8888/api/seminars';
const OUTPUT_DIR = join(import.meta.dirname, '..', 'src', 'content', 'seminars');

interface Seminar {
    content: string;
    cover?: string;
    date: string;
    difficulty?: string;
    id: string;
    location: string;
    title: string;
}

async function importSeminars() {
    console.log(`Fetching from ${API_URL}`);

    const response = await fetch(API_URL);

    if (!response.ok) {
        console.error(`Failed: ${response.status} ${response.statusText}`);
        process.exit(1);
    }

    const seminars: Seminar[] = await response.json();

    console.log(`Found ${seminars.length} seminars`);

    if (existsSync(OUTPUT_DIR)) {
        rmSync(OUTPUT_DIR, { recursive: true });
    }

    mkdirSync(OUTPUT_DIR, { recursive: true });

    for (let index = 0; index < seminars.length; index++) {
        const seminar = seminars[index];
        const filename = `${index + 1}.json`;
        const data: Record<string, string> = {
            content: seminar.content,
            ...(seminar.cover ? { cover: seminar.cover } : {}),
            date: seminar.date,
            ...(seminar.difficulty ? { difficulty: seminar.difficulty } : {}),
            location: seminar.location,
            title: seminar.title,
        };

        const json = JSON.stringify(data, Object.keys(data).sort(), 4);

        writeFileSync(join(OUTPUT_DIR, filename), json);
        console.log(`  ${filename}: ${seminar.title}`);
    }

    console.log(`\nWrote ${seminars.length} files to src/content/seminars/`);
}

importSeminars();
