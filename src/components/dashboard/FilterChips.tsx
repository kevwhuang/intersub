import { FONT_MONO, LEVELS, STYLES } from '@lib/constants';

const GROUP_LABEL_STYLE: React.CSSProperties = { color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '.08em', margin: '0 0 8px', textTransform: 'uppercase' };

const TIMINGS = [
    { label: 'All', value: 'all' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Past', value: 'past' },
] as const;

function getChipClassName(isActive: boolean) {
    return isActive ? 'chip chip--active' : 'chip';
}

export default function FilterChips({ activeLevel, activeLocation, activeTiming, locations, onLevelChange, onLocationChange, onNewEvent, onTimingChange }: {
    activeLevel: string;
    activeLocation: string;
    activeTiming: string;
    locations: string[];
    onLevelChange: (value: string) => void;
    onLocationChange: (value: string) => void;
    onNewEvent: () => void;
    onTimingChange: (value: string) => void;
}) {
    return (
        <div style={{ alignItems: 'flex-end', display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                    <p style={GROUP_LABEL_STYLE}>When</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {TIMINGS.map(timing => (
                            <button className={getChipClassName(activeTiming === timing.value)} key={timing.value} onClick={() => onTimingChange(timing.value)}>
                                {timing.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <p style={GROUP_LABEL_STYLE}>Where</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button className={getChipClassName(activeLocation === 'all')} onClick={() => onLocationChange('all')}>
                            Everywhere
                        </button>
                        {locations.map(location => (
                            <button className={getChipClassName(activeLocation === location)} key={location} onClick={() => onLocationChange(location)}>
                                {location}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <p style={GROUP_LABEL_STYLE}>Who</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button className={getChipClassName(activeLevel === 'all')} onClick={() => onLevelChange('all')}>
                            Everyone
                        </button>
                        {LEVELS.map(level => (
                            <button className={getChipClassName(activeLevel === level)} key={level} onClick={() => onLevelChange(level)}>
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <button className="dashboard-button dashboard-button--primary" onClick={onNewEvent} style={{ alignItems: 'center', display: 'inline-flex', gap: 6, padding: '10px 16px', whiteSpace: 'nowrap' }}>
                +&ensp;New event
            </button>
        </div>
    );
}
