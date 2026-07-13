import { beforeEach, describe, expect, test, vi } from 'vitest';
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { deleteEntry, readCollection, writeEntry } from '../../src/lib/local';

vi.mock('node:fs');

const ENTRY_HEAD = { date: '2026-06-15', id: '2026-06-15' } as const;
const ENTRY_TAIL = { location: 'Shanghai', title: 'Sample Event' } as const;
const SORTED_JSON = '{\n    "date": "2026-06-15",\n    "location": "Shanghai",\n    "title": "Sample Event"\n}';

const contentRoot = join(process.cwd(), 'src/content');

beforeEach(() => {
    vi.resetAllMocks();
});

describe('deleteEntry', () => {
    test('unlinks the entry file when it exists', () => {
        vi.mocked(existsSync).mockReturnValue(true);

        deleteEntry('events', '2026-06-15');

        expect(unlinkSync).toHaveBeenCalledWith(join(contentRoot, 'events', '2026-06-15.json'));
    });

    test('no-ops silently when the file is missing', () => {
        vi.mocked(existsSync).mockReturnValue(false);

        deleteEntry('events', 'missing-entry');

        expect(unlinkSync).not.toHaveBeenCalled();
    });

    test('throws on unsafe ids without touching disk', () => {
        expect(() => deleteEntry('events', '../escape')).toThrow('Invalid id: ../escape');
        expect(() => deleteEntry('events', 'nested/id')).toThrow('Invalid id: nested/id');
        expect(existsSync).not.toHaveBeenCalled();
        expect(unlinkSync).not.toHaveBeenCalled();
    });
});

describe('readCollection', () => {
    test('maps filenames to ids and spreads parsed JSON', () => {
        vi.mocked(existsSync).mockReturnValue(true);
        vi.mocked(readdirSync).mockReturnValue(['alpha.json', 'beta.json'] as never);
        vi.mocked(readFileSync).mockReturnValueOnce('{"tag":"first"}').mockReturnValueOnce('{"tag":"second"}');

        const entries = readCollection('things');

        expect(entries).toEqual([
            { id: 'alpha', tag: 'first' },
            { id: 'beta', tag: 'second' },
        ]);
        expect(readFileSync).toHaveBeenCalledWith(join(contentRoot, 'things', 'alpha.json'), 'utf-8');
    });

    test('filters out non-json files', () => {
        vi.mocked(existsSync).mockReturnValue(true);
        vi.mocked(readdirSync).mockReturnValue(['.DS_Store', 'entry.json', 'notes.txt'] as never);
        vi.mocked(readFileSync).mockReturnValue('{"title":"Entry"}');

        const entries = readCollection('things');

        expect(entries).toEqual([{ id: 'entry', title: 'Entry' }]);
        expect(readFileSync).toHaveBeenCalledTimes(1);
    });

    test('returns an empty array when the directory does not exist', () => {
        vi.mocked(existsSync).mockReturnValue(false);

        expect(readCollection('missing')).toEqual([]);
        expect(readdirSync).not.toHaveBeenCalled();
    });
});

describe('writeEntry', () => {
    test('writes sorted keys with 4-space indent and no trailing newline to the collection path', () => {
        writeEntry('events', '2026-06-15', { ...ENTRY_TAIL, ...ENTRY_HEAD });

        expect(vi.mocked(writeFileSync).mock.calls[0]).toEqual([
            join(contentRoot, 'events', '2026-06-15.json'),
            SORTED_JSON,
        ]);
    });

    test('strips id from the serialized data', () => {
        writeEntry('outcomes', '1', { id: '1', title: 'Entry' });

        expect(vi.mocked(writeFileSync).mock.calls[0]).toEqual([
            join(contentRoot, 'outcomes', '1.json'),
            '{\n    "title": "Entry"\n}',
        ]);
    });

    test('throws on unsafe ids without writing', () => {
        expect(() => writeEntry('events', '../escape', {})).toThrow('Invalid id: ../escape');
        expect(() => writeEntry('events', 'dot.dot', {})).toThrow('Invalid id: dot.dot');
        expect(() => writeEntry('events', '', {})).toThrow('Invalid id: ');
        expect(writeFileSync).not.toHaveBeenCalled();
    });
});
