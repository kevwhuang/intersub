import { FONT_MONO, LEVELS, STYLES, TIMINGS } from '@lib/constants';

const GROUP_LABEL_STYLE: React.CSSProperties = { color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '.08em', margin: '0 0 8px', textTransform: 'uppercase' };
const GROUP_STYLE: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 };

function getChipClassName(isActive: boolean) {
    return isActive ? 'chip chip--active' : 'chip';
}

export default function FilterChips({ activeLevel, activeLocation, activeTiming, locations, onLevelChange, onLocationChange, onStartNew, onTimingChange }: {
    activeLevel: string;
    activeLocation: string;
    activeTiming: string;
    locations: string[];
    onLevelChange: (value: string) => void;
    onLocationChange: (value: string) => void;
    onStartNew: () => void;
    onTimingChange: (value: string) => void;
}) {
    return (
        <div style={{ alignItems: 'flex-end', display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                    <p style={GROUP_LABEL_STYLE}>When</p>
                    <ul style={GROUP_STYLE}>
                        {TIMINGS.map(timing => (
                            <li key={timing.value}>
                                <button
                                    className={getChipClassName(activeTiming === timing.value)}
                                    onClick={() => onTimingChange(timing.value)}
                                    type="button"
                                >
                                    {timing.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <p style={GROUP_LABEL_STYLE}>Where</p>
                    <ul style={GROUP_STYLE}>
                        <li>
                            <button
                                className={getChipClassName(activeLocation === 'all')}
                                onClick={() => onLocationChange('all')}
                                type="button"
                            >
                                Everywhere
                            </button>
                        </li>
                        {locations.map(location => (
                            <li key={location}>
                                <button
                                    className={getChipClassName(activeLocation === location)}
                                    onClick={() => onLocationChange(location)}
                                    type="button"
                                >
                                    {location}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <p style={GROUP_LABEL_STYLE}>Who</p>
                    <ul style={GROUP_STYLE}>
                        <li>
                            <button
                                className={getChipClassName(activeLevel === 'all')}
                                onClick={() => onLevelChange('all')}
                                type="button"
                            >
                                Everyone
                            </button>
                        </li>
                        {LEVELS.map(level => (
                            <li key={level}>
                                <button
                                    className={getChipClassName(activeLevel === level)}
                                    onClick={() => onLevelChange(level)}
                                    type="button"
                                >
                                    {level}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <button
                className="dashboard-button dashboard-button--primary"
                onClick={onStartNew}
                style={STYLES.buttonNew}
                type="button"
            >
                +&ensp;New event
            </button>
        </div>
    );
}
