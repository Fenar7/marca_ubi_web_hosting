import type { ClientWorkItem, ClientWorkMilestone } from '@/types/crm';

interface SampleProject {
  company: string;
  scope: string;
  value: number;
  stage: ClientWorkItem['delivery_stage'];
  health: ClientWorkItem['health_status'];
  kickoff: string;
  delivery: string | null;
  creative?: string;
  technical?: string;
  milestones: ReadonlyArray<readonly [string, ClientWorkMilestone['status']]>;
}

const PROJECTS: readonly SampleProject[] = [
  {
    company: 'Paper Finch Studio',
    scope: 'Retail identity and art direction',
    value: 240_000,
    stage: 'kickoff',
    health: 'on_track',
    kickoff: '2026-11-20',
    delivery: null,
    creative: '01',
    milestones: [
      ['Confirm project brief', 'in_progress'],
      ['Schedule discovery workshop', 'pending'],
    ],
  },
  {
    company: 'Ceramic North',
    scope: 'Brand positioning and naming',
    value: 310_000,
    stage: 'strategy',
    health: 'blocked',
    kickoff: '2026-10-28',
    delivery: '2026-11-25',
    creative: '02',
    milestones: [
      ['Complete discovery interviews', 'completed'],
      ['Review naming shortlist', 'in_progress'],
      ['Approve positioning', 'pending'],
    ],
  },
  {
    company: 'Fable Orchard',
    scope: 'Commerce site design',
    value: 480_000,
    stage: 'design_ui_ux',
    health: 'on_track',
    kickoff: '2026-11-04',
    delivery: '2026-12-11',
    creative: '01',
    technical: '01',
    milestones: [
      ['Approve site map', 'completed'],
      ['Approve wireframes', 'completed'],
      ['Review visual designs', 'in_progress'],
      ['Hand off to development', 'pending'],
    ],
  },
  {
    company: 'Cinder Atlas',
    scope: 'Member portal build',
    value: 650_000,
    stage: 'development',
    health: 'at_risk',
    kickoff: '2026-10-19',
    delivery: '2026-11-27',
    technical: '02',
    milestones: [
      ['Approve prototype', 'completed'],
      ['Build member dashboard', 'in_progress'],
      ['Prepare staging release', 'pending'],
    ],
  },
  {
    company: 'Stillwater Index',
    scope: 'Editorial site launch',
    value: 390_000,
    stage: 'review_qa',
    health: 'on_track',
    kickoff: '2026-10-26',
    delivery: '2026-12-04',
    creative: '02',
    technical: '01',
    milestones: [
      ['Complete content migration', 'completed'],
      ['Run accessibility checks', 'completed'],
      ['Review launch checklist', 'in_progress'],
    ],
  },
  {
    company: 'Juniper Signal',
    scope: 'Campaign toolkit and templates',
    value: 185_000,
    stage: 'delivered',
    health: 'completed',
    kickoff: '2026-10-12',
    delivery: '2026-11-13',
    milestones: [
      ['Approve campaign toolkit', 'completed'],
      ['Deliver editable templates', 'completed'],
    ],
  },
];

/** Provide fresh read-only preview records. Sample identifiers cannot pass the UUID validation required by Works mutations. */
export function createSampleClientWorks(): ClientWorkItem[] {
  return PROJECTS.map((project, index) => {
    const number = String(index + 1).padStart(2, '0');
    const id = `sample-work-${number}`;
    const updatedAt = project.health === 'completed'
      ? '2026-11-13T12:00:00Z'
      : '2026-11-23T09:00:00Z';

    return {
      id,
      project_code: `SAMPLE-${number}`,
      lead_id: `sample-lead-${number}`,
      client_name: `Sample client ${number}`,
      company: project.company,
      service_scope: project.scope,
      contract_value: project.value,
      delivery_stage: project.stage,
      health_status: project.health,
      kickoff_date: project.kickoff,
      target_delivery_date: project.delivery,
      created_at: `${project.kickoff}T09:00:00Z`,
      updated_at: updatedAt,
      creative_lead_id: project.creative ? `sample-creative-${project.creative}` : null,
      tech_lead_id: project.technical ? `sample-technical-${project.technical}` : null,
      creative_lead: project.creative
        ? { full_name: `Sample creative lead ${project.creative}` }
        : null,
      tech_lead: project.technical
        ? { full_name: `Sample technical lead ${project.technical}` }
        : null,
      milestones: project.milestones.map(([title, status], milestoneIndex) => ({
        id: `${id}-milestone-${milestoneIndex + 1}`,
        title,
        status,
        completed_at: status === 'completed' ? updatedAt : null,
      })),
    };
  });
}
