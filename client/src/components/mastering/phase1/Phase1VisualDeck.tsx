import { NuancePanel } from './NuancePanel';
import { DynamicsPanel } from './DynamicsPanel';
import { FrequenciesPanel } from './FrequenciesPanel';
import { StereoImagePanel } from './StereoImagePanel';

export function Phase1VisualDeck({ sessionId }: { sessionId: string }) {
  return (
    <section
      className="auto-grid dense"
      style={{ ['--card-min' as any]: '340px' }}
      data-session={sessionId}
    >
      <NuancePanel className="terminal-window card hoverable" />
      <DynamicsPanel className="terminal-window card hoverable" />
      <FrequenciesPanel className="terminal-window card hoverable" />
      <StereoImagePanel className="terminal-window card hoverable" />
    </section>
  );
}
