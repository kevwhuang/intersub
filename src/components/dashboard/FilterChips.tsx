import { FONT_MONO, STYLES } from '@lib/constants';
import { getDifficultyMeta } from '@lib/utils';

export default function FilterChips({ activeFilters, activeLocation, locations, onFilterToggle, onLocationChange, onNewSeminar }: {
    activeFilters: string[];
    activeLocation: string;
    locations: string[];
    onFilterToggle: (value: string) => void;
    onLocationChange: (value: string) => void;
    onNewSeminar: () => void;
}) {
    function chipClassName(active: boolean) {
        return active ? 'dashboard-chip dashboard-chip--active' : 'dashboard-chip';
    }

    const groupLabelStyle: React.CSSProperties = { color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '.08em', margin: '0 0 8px', textTransform: 'uppercase' };

    return (
        <div style={{ alignItems: 'flex-end', display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                    <p style={groupLabelStyle}>Location</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {['all', ...locations].map(location => (
                            <button className={chipClassName(activeLocation === location)} key={location} onClick={() => onLocationChange(location)}>
                                {location === 'all' ? 'All locations' : location}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <p style={groupLabelStyle}>Level</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button className={chipClassName(activeFilters.length === 0)} onClick={() => onFilterToggle('all')}>
                            All levels
                        </button>
                        {['Beginner', 'Intermediate', 'Advanced'].map(difficulty => (
                            <button className={chipClassName(activeFilters.includes(difficulty))} key={difficulty} onClick={() => onFilterToggle(difficulty)}>
                                {getDifficultyMeta(difficulty).label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <button className="dashboard-button--primary" onClick={onNewSeminar} style={{ alignItems: 'center', display: 'inline-flex', fontSize: 14, gap: 6, padding: '10px 16px', whiteSpace: 'nowrap' }}>
                +&ensp;New seminar
            </button>
        </div>
    );
}
