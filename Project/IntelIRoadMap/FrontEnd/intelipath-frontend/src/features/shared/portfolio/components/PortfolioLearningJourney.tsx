import React from 'react';
import { Check, CircleDot, ShieldCheck } from 'lucide-react';
import type { PortfolioLearningJourney as LearningJourney } from '../api/portfolioApi';
import './PortfolioLearningJourney.css';

interface Props {
  journey?: LearningJourney | null;
}

const clampPercent = (value: number | null | undefined) =>
  Math.min(100, Math.max(0, Math.round(value ?? 0)));

export const PortfolioLearningJourney: React.FC<Props> = ({ journey }) => {
  if (!journey || (!journey.coreSkills?.length && !journey.stages?.length)) return null;

  const progress = clampPercent(journey.progress);
  const readiness = clampPercent((journey.readiness ?? 0) * 100);
  const maxDemand = Math.max(1, ...journey.coreSkills.map(skill => skill.marketJobCount ?? 0));

  return (
    <section id="journey" className="portfolio-journey reveal" aria-labelledby="journey-title">
      <div className="portfolio-journey__inner">
        <header className="portfolio-journey__header">
          <p className="portfolio-journey__kicker">Learning journey</p>
          <h2 id="journey-title">Building toward {journey.targetCareerRole}</h2>
          <p>The map reflects current skills and completed roadmap activity.</p>
        </header>

        <div className="portfolio-journey__progress" aria-label={`Roadmap ${progress}% complete`}>
          <div className="portfolio-journey__progress-copy">
            <span>Roadmap progress</span>
            <strong>{progress}%</strong>
          </div>
          <div className="portfolio-journey__track" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
          {journey.readinessRequiredCount != null && (
            <p>{journey.readinessHeldCount ?? 0} of {journey.readinessRequiredCount} core skills held · {readiness}% career readiness</p>
          )}
        </div>

        {journey.stages?.length > 0 && (
          <ol className="portfolio-journey__stages" aria-label="Roadmap stages">
            {journey.stages.map((stage, index) => (
              <li key={`${stage.name}-${index}`} className={stage.currentNodes > 0 ? 'is-current' : undefined}>
                <span className="portfolio-journey__stage-marker" aria-hidden="true">
                  {stage.completedNodes === stage.totalNodes && stage.totalNodes > 0 ? <Check /> : <CircleDot />}
                </span>
                <div>
                  <strong>{stage.name}</strong>
                  <span>{stage.completedNodes}/{stage.totalNodes} steps complete</span>
                </div>
              </li>
            ))}
          </ol>
        )}

        {journey.coreSkills?.length > 0 && (
          <div className="portfolio-journey__skill-map">
            <div className="portfolio-journey__map-heading">
              <h3>Skill Map</h3>
              <div className="portfolio-journey__legend" aria-label="Skill map legend">
                <span><i className="is-held" />Held</span>
                <span><i className="is-verified" />Verified</span>
                <span><i />Next to learn</span>
              </div>
            </div>
            <ul>
              {journey.coreSkills.map((skill) => {
                const held = skill.proficiency != null;
                const verified = Boolean(skill.verifiedBy);
                const demand = skill.marketJobCount ?? 0;
                const size = 72 + Math.round((demand / maxDemand) * 32);
                return (
                  <li
                    key={skill.skillName}
                    className={`${held ? 'is-held' : 'is-gap'} ${verified ? 'is-verified' : ''}`}
                    style={{ '--skill-size': `${size}px` } as React.CSSProperties}
                    title={`${skill.skillName}${held ? ` · proficiency ${skill.proficiency}/4` : ' · next to learn'}${verified ? ` · verified by ${skill.verifiedBy}` : ''}`}
                  >
                    {verified && <ShieldCheck aria-hidden="true" />}
                    <span>{skill.skillName}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};
