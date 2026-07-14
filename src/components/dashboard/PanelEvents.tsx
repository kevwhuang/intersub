import { Fragment } from 'react';

import EditForm from '@components/dashboard/EditForm';
import EventRow from '@components/dashboard/EventRow';
import EventTableHeader from '@components/dashboard/EventTableHeader';
import FilterChips from '@components/dashboard/FilterChips';
import TableEmpty from '@components/dashboard/TableEmpty';
import { FONT_MONO, LEVELS, STYLES } from '@lib/constants';

const EVENT_FORM_ROWS: EditFormField<EventFormData>[][] = [
    [{ errorMessage: 'Title is required.', key: 'title', kind: 'input', label: 'Title', required: true }],
    [
        { errorMessage: 'Date is required.', key: 'date', kind: 'date', label: 'Date', required: true },
        { errorMessage: 'Time must be a 24-hour range.', key: 'time', kind: 'input', label: 'Time', required: true },
    ],
    [
        { errorMessage: 'Location is required.', key: 'location', kind: 'input', label: 'Location', required: true },
        { key: 'level', kind: 'select', label: 'Who', options: LEVELS },
    ],
    [{ errorMessage: 'Cover must be a URL or internal image path.', key: 'cover', kind: 'input', label: 'Cover' }],
    [{ errorMessage: 'Content is required.', key: 'content', kind: 'textarea', label: 'Content', labelSuffix: '\u00B7 Markdown', minHeight: 200, mono: true, required: true, rows: 9 }],
];

export default function PanelEvents({ activeLevel, activeLocation, activeTiming, allEvents, editingEventId, eventForm, eventFormErrors, events, isMobile, isSaving, locations, onCancelEdit, onLevelChange, onLocationChange, onRequestDelete, onSave, onSort, onStartEdit, onStartNew, onTimingChange, onUpdate, sortDirection, sortKey }: {
    activeLevel: string;
    activeLocation: string;
    activeTiming: string;
    allEvents: AdminEvent[];
    editingEventId: string | null;
    eventForm: EventFormData | null;
    eventFormErrors: Record<string, boolean>;
    events: AdminEvent[];
    isMobile: boolean;
    isSaving: boolean;
    locations: string[];
    onCancelEdit: () => void;
    onLevelChange: (value: string) => void;
    onLocationChange: (value: string) => void;
    onRequestDelete: (id: string) => void;
    onSave: () => Promise<void>;
    onSort: (field: string) => void;
    onStartEdit: (id: string) => void;
    onStartNew: () => void;
    onTimingChange: (value: string) => void;
    onUpdate: (fields: Partial<EventFormData>) => void;
    sortDirection: SortDirection;
    sortKey: string;
}) {
    function renderRow(entry: AdminEvent) {
        return (
            <EventRow
                entry={entry}
                isMobile={isMobile}
                key={entry.id}
                onDelete={() => onRequestDelete(entry.id)}
                onEdit={() => onStartEdit(entry.id)}
            />
        );
    }

    if (editingEventId !== null && eventForm) {
        return (
            <EditForm
                editingId={editingEventId}
                entity="event"
                fieldRows={EVENT_FORM_ROWS}
                form={eventForm}
                formErrors={eventFormErrors}
                isMobile={isMobile}
                isSaving={isSaving}
                onCancel={onCancelEdit}
                onDelete={() => onRequestDelete(editingEventId)}
                onSave={onSave}
                onUpdate={onUpdate}
            />
        );
    }

    return (
        <div style={{ margin: '0 auto', maxWidth: 1_280 }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={STYLES.headingPanel}>Events</h1>
                <div style={{ color: STYLES.colorGhost, display: 'flex', flexWrap: 'wrap', fontFamily: FONT_MONO, fontSize: 12, gap: '4px 8px', letterSpacing: '.06em', textTransform: 'lowercase' }}>
                    <span>
                        {allEvents.length}
                        {' '}
                        {allEvents.length === 1 ? 'event' : 'events'}
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <span>
                        {locations.length}
                        {' '}
                        {locations.length === 1 ? 'location' : 'locations'}
                    </span>
                    {LEVELS.map((level) => {
                        const count = allEvents.filter(entry => entry.level === level).length;

                        if (!count) return null;

                        return (
                            <Fragment key={level}>
                                <span aria-hidden="true">&middot;</span>
                                <span>
                                    {count}
                                    {' '}
                                    {level}
                                </span>
                            </Fragment>
                        );
                    })}
                </div>
            </div>
            <FilterChips
                activeLevel={activeLevel}
                activeLocation={activeLocation}
                activeTiming={activeTiming}
                locations={locations}
                onLevelChange={onLevelChange}
                onLocationChange={onLocationChange}
                onStartNew={onStartNew}
                onTimingChange={onTimingChange}
            />
            <div
                aria-label={!events.length || isMobile ? undefined : 'Events'}
                role={!events.length || isMobile ? undefined : 'table'}
                style={STYLES.tableBase}
                tabIndex={0}
            >
                {!isMobile && events.length > 0 && (
                    <EventTableHeader
                        onSort={onSort}
                        sortDirection={sortDirection}
                        sortKey={sortKey}
                    />
                )}
                {events.length > 0
                    ? events.map(renderRow)
                    : <TableEmpty description="Try a different search or filter, or add a new event." title="No events found" />}
            </div>
        </div>
    );
}
