import React, { useMemo, useState } from 'react';
import { Plus, Search, ShieldCheck, X } from 'lucide-react';
import type { PortfolioData } from '../api/portfolioApi';
import { EditableText } from './EditableText';
import './PortfolioSkillsShowcase.css';

type Skill = PortfolioData['skills'][number];
type Filter = 'all' | 'verified' | 'declared';

interface Props {
  skills: Skill[];
  isEditable: boolean;
  onRename: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

const INITIAL_LIMIT = 12;

export const PortfolioSkillsShowcase: React.FC<Props> = ({ skills, isEditable, onRename, onRemove, onAdd }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const verifiedCount = skills.filter(skill => skill.verified).length;
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return [...skills]
      .filter(skill => filter === 'all' || (filter === 'verified' ? skill.verified : !skill.verified))
      .filter(skill => !normalizedQuery || `${skill.category} ${skill.stack}`.toLocaleLowerCase().includes(normalizedQuery))
      .sort((a, b) => Number(Boolean(b.verified)) - Number(Boolean(a.verified)) || a.category.localeCompare(b.category));
  }, [filter, query, skills]);

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_LIMIT);
  const hiddenCount = filtered.length - visible.length;

  return (
    <section id="skills" className="portfolio-skills reveal" aria-labelledby="portfolio-skills-title">
      <div className="portfolio-skills__inner">
        <header className="portfolio-skills__header">
          <p>Capability index</p>
          <h2 id="portfolio-skills-title">My Skills</h2>
          <span>{skills.length} skills{verifiedCount > 0 ? ` · ${verifiedCount} verified` : ''}</span>
        </header>

        {skills.length > 0 && (
          <div className="portfolio-skills__toolbar">
            <div className="portfolio-skills__filters" role="group" aria-label="Filter skills">
              {(['all', 'verified', 'declared'] as const).map(value => (
                <button key={value} type="button" className={filter === value ? 'is-active' : ''} onClick={() => { setFilter(value); setExpanded(false); }}>
                  {value === 'all' ? 'All' : value === 'verified' ? 'Verified' : 'Declared'}
                </button>
              ))}
            </div>
            {skills.length > INITIAL_LIMIT && (
              <label className="portfolio-skills__search">
                <Search aria-hidden="true" />
                <span className="sr-only">Search skills</span>
                <input value={query} onChange={event => { setQuery(event.target.value); setExpanded(false); }} placeholder="Find a skill" />
              </label>
            )}
          </div>
        )}

        <ul className="portfolio-skills__list">
          {visible.map(skill => (
            <li key={skill.id} className={[skill.verified ? 'is-verified' : '', isEditable ? 'is-editable' : ''].filter(Boolean).join(' ')}>
              {isEditable && (
                <button type="button" className="portfolio-skills__remove" onClick={() => onRemove(skill.id)} aria-label={`Remove ${skill.category}`}>
                  <X aria-hidden="true" />
                </button>
              )}
              <span className="portfolio-skills__status" aria-label={skill.verified ? 'Verified skill' : 'Declared skill'}>
                {skill.verified ? <ShieldCheck aria-hidden="true" /> : <i aria-hidden="true" />}
              </span>
              <EditableText isEditable={isEditable} value={skill.category} onChange={value => onRename(skill.id, value)} className="portfolio-skills__name" />
              {skill.verified && <small>{skill.evidenceSource === 'TRANSCRIPT' ? 'Transcript' : skill.evidenceSource === 'GITHUB_PROJECT' ? 'GitHub' : 'Verified'}</small>}
            </li>
          ))}
        </ul>

        {filtered.length === 0 && <p className="portfolio-skills__empty">No skills match this view.</p>}

        <div className="portfolio-skills__actions">
          {hiddenCount > 0 && <button type="button" onClick={() => setExpanded(true)}>Show {hiddenCount} more</button>}
          {expanded && filtered.length > INITIAL_LIMIT && <button type="button" onClick={() => setExpanded(false)}>Show fewer</button>}
          {isEditable && <button type="button" onClick={onAdd}><Plus aria-hidden="true" /> Add skill</button>}
        </div>
      </div>
    </section>
  );
};
