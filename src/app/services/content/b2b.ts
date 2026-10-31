/**
 * @file src/app/services/content/b2b.ts
 * @description B2B Enterprise service detail copy deck consumed by /services/[slug].
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { ServiceDetailDoc } from "../types";

export const B2B_SERVICE_DETAILS: ServiceDetailDoc[] = [
  {
    slug: "demand-generation",
    sourceId: "b2b-demand-generation",
    category: "B2B",
    number: "01",
    title: "Demand Generation",
    shortDescription:
      "Pipeline built from evidence, not hope. We plan paid media and lead acquisition as one revenue programme, instrumented end to end, tested on a weekly cadence, and reported against qualified opportunity value rather than raw form fills.",
    subServices: [
      {
        label: "Paid media strategy",
        summary:
          "Budget placed with intent: every rupee and dollar accountable to a defined segment and contribution target.",
        body: [
          "Paid media is the allocation of attention at scale, and most enterprise programmes fail because budget is decided before strategy exists. Teams spread spend across channels to satisfy vendor commitments and measure each in isolation, never reconciling the overlaps. The result is inflated attribution and rising acquisition costs that leadership has stopped trusting.",
          "We start with a media principles document that fixes audience definitions and channel roles before any platform receives money, with bid policy set against contribution targets. Budget runs in quarterly tranches with hold-backs reserved for proven winners. Planning owns allocation, the trading desk owns execution, and you receive a weekly pacing view against cost per qualified opportunity plus a monthly cross-platform reconciliation.",
        ],
      },
      {
        label: "Search engine marketing",
        summary:
          "Bid-level discipline across search and social platforms, with query intent mapped to funnel stage and landing page.",
        body: [
          "Search is where demand announces itself, yet enterprises still run it as a cost centre to be minimised. Keyword lists grow without governance, match types overlap, and negative coverage decays quietly until irrelevant queries consume the budget. Nobody owns the gap between the advertisement and the page it points to.",
          "We operate search as a weekly cycle: query-mining reports feed new ad groups, underperformers pause on pre-agreed rules, and every headline cluster traces back to a positioning message agreed with the brand team. Landing pages ship as templates with structured proof blocks. What remains with you is a programme that improves on its own, documented in a shared search playbook with clear ownership.",
        ],
      },
      {
        label: "Lead generation",
        summary:
          "Offers and gating designed around buying-committee reality, so sales receives contacts worth the conversation.",
        body: [
          "Most lead generation produces volume the sales team learns to distrust. Forms ask for information nobody verifies, and gated assets attract students and competitors. Scoring models then reward behaviour that has nothing to do with buying intent, while the real cost lands in stretched sales cycles and eroded credibility.",
          "We design offers against the stage each segment actually occupies, qualify through progressive enrichment rather than longer forms, and route only research-verified contacts to sales. Marketing and revenue operations agree the definitions in writing before launch. You get a lead flow your sellers accept, measured from first touch to closed opportunity.",
        ],
      },
      {
        label: "Campaign optimisation",
        summary:
          "Structured experimentation on a fixed cadence, so performance compounds instead of drifting between relaunches.",
        body: [
          "Optimisation fails when it becomes a synonym for fiddling. Teams change audiences, thumbnails and headlines simultaneously, lose the ability to attribute any result, and defend decisions with anecdotes. Without a testing protocol, ten months of spend produces no durable learning about what actually moves your buyers.",
          "Every campaign we run carries an experiment backlog ranked by expected impact and implementation cost. Changes ship one variable at a time against agreed thresholds, logged centrally with the hypothesis and the outcome. Clients accumulate both a winning asset library and a body of evidence that survives any team turnover.",
        ],
      },
      {
        label: "Pipeline reporting",
        summary:
          "A single revenue view connecting spend, engagement and closed opportunity in numbers finance will accept.",
        body: [
          "Enterprises often own many dashboards but no shared truth. Marketing reports MQL volume, sales reports opportunity creation, and the two never reconcile because each system defines the same term differently. Meetings become negotiations about vocabulary rather than discussions about performance, and the forecast nobody agreed to is quietly abandoned each quarter.",
          "We instrument one funnel from media spend through to signed revenue, aligning definitions with finance before the first report ships. Weekly stand-ups read from the same export leadership reads, with variance explained against plan and forecast confidence stated honestly. You end up with reporting that survives audit and earns a permanent seat in the revenue review.",
        ],
      },
    ],
  },
  {
    slug: "integrated-marketing",
    sourceId: "b2b-integrated-marketing",
    category: "B2B",
    number: "02",
    title: "Integrated Marketing",
    shortDescription:
      "One idea, many channels, no dilution. We align brand messaging and campaign architecture with channel planning so that every audience encounters a single coherent argument, whether they meet the company on a screen or in a sales conversation.",
    subServices: [
      {
        label: "Marketing strategy",
        summary:
          "A positioning and growth thesis written from research, with explicit choices about what the organisation will not fund.",
        body: [
          "Strategy documents usually describe ambition instead of making choices. They list every audience and every advantage, which is another way of committing to nothing. Without a written position on where to concentrate, resource is spread evenly toward whichever vendor is loudest that quarter.",
          "We work from commercial diagnosis: market sizing, buyer research and a frank audit of where the brand wins and loses today. The output names its trade-offs, sets a prioritised growth thesis, and carries budget principles the CFO has signed. Every downstream campaign brief inherits from this document, so the account stops contradicting itself across quarters.",
        ],
      },
      {
        label: "Campaign planning",
        summary:
          "Phased rollouts with creative and media sequenced alongside earned moments, each reinforcing the other across the buying cycle.",
        body: [
          "Campaigns underperform when the plan is a calendar rather than a sequence. Assets land without media behind them, earned activity arrives before the creative exists, and the phase meant to convert runs out of money in month two. Planning failure is almost always a failure of dependency mapping.",
          "Our plans are phased arcs with explicit entry criteria per stage and a dependency map across creative, PR and events. Contingency is held back and released only to phases that earn it. Weekly reviews track burn against the arc, so clients get campaigns that behave predictably, with decision points written down before the pressure arrives.",
        ],
      },
      {
        label: "Channel orchestration",
        summary:
          "Channel roles assigned by function, with frequency ceilings and format rules that keep one argument in play.",
        body: [
          "Multi-channel is not integration. When separate teams plan each channel against their own metric, the audience meets the same message at the wrong moment in the wrong register, repeatedly through the week. Orchestration breaks because nobody owns the total impression a viewer receives.",
          "We assign every channel a function in the argument: which introduces, which proves, which closes. A joint quarterly session fixes frequency ceilings and translates formats between platforms, with one orchestration owner signing the master flighting plan. You gain consistent exposure at lower effective frequency and attribution that finally behaves.",
        ],
      },
      {
        label: "Brand communications",
        summary:
          "Message architecture with proof points per audience, kept current through a disciplined editorial review rhythm.",
        body: [
          "Brand messaging decays silently. Launch statements written years ago circulate through decks, websites and sales scripts long after the market moved, and nobody is accountable for retiring them. The organisation sounds current in its own ears while customers hear vocabulary from two product generations ago.",
          "We maintain an architecture with a proof point per audience, reviewed each quarter against real sales calls and win-loss notes. Copy changes pass through one editorial desk, so the website, collateral and campaign work update together instead of drifting apart. The result is a voice that stays consistent without ossifying.",
        ],
      },
      {
        label: "Performance reporting",
        summary:
          "Cross-channel scorecards that rank investment by measured contribution rather than by whichever platform reports most generously.",
        body: [
          "Platform-reported metrics flatter themselves by design. Reviews built on vendor dashboards push budget toward the channels with the best reporting rather than the best contribution, and the integration argument collapses into a bidding war for credit.",
          "We consolidate every channel into one scorecard using incrementality reads and modelled contribution, each number documented down to its method. Leadership reads spend, reach and downstream conversion side by side, with reallocation recommendations attached to every cycle. Budget conversations run on evidence the whole organisation can accept.",
        ],
      },
    ],
  },
  {
    slug: "corporate-communications",
    sourceId: "b2b-corporate-communications",
    category: "B2B",
    number: "03",
    title: "Corporate Communications",
    shortDescription:
      "The company's story told with intent, from boardroom to shop floor. We build the narrative and the executive voice behind it into one communications programme designed to hold under scrutiny and market pressure.",
    subServices: [
      {
        label: "Corporate narrative",
        summary:
          "A founding argument for the company that survives contact with journalists, investors and sceptical employees alike.",
        body: [
          "Corporate narratives collapse into self-description: mission language written to please everyone and therefore memorable to nobody. When a story cannot be repeated accurately by a middle manager, or defended against a sceptical journalist, it is decoration. Decoration does not survive contact with the news.",
          "We build narrative from primary research with leadership, investors and customers, then stress-test it through draft interviews and internal road-testing before anything ships. The final artefact is a story spine with approved variants per audience, maintained by our counsel team. You get a company story people can tell without reading a script.",
        ],
      },
      {
        label: "Executive communications",
        summary:
          "Speeches, interviews and written channels that sound like one person with a position, not a committee.",
        body: [
          "Executive visibility fails when the voice is assembled by committee. Chief executives take stages reading conclusions nobody can attribute to their own thinking, and interviews default to carefully hedged nothing. Audiences detect a borrowed voice instantly, and the cost compounds against the leader's credibility.",
          "Our writers work from recorded conversations with the executive, not briefs about them. Each keynote, op-ed or investor question carries a point of view with named arguments and evidence, reviewed once with the leader and rehearsed before delivery. The outcome is a recognisable voice that opens doors the media previously kept shut.",
        ],
      },
      {
        label: "Internal communications",
        summary:
          "Cascade models and channel design that ensure strategy reaches the frontline before the rumour does.",
        body: [
          "Enterprises announce change externally first and internally second, then wonder why employees learn their own future from the news. Channels multiply without ownership, message fatigue sets in, and middle managers, the actual transmission layer for any strategy, are left unbriefed and improvising.",
          "We design cascades where leadership messaging flows through briefed manager packs, plain-language rewrites, and a channel audit that retires what fails. Tone standards are set for crisis and celebration alike, before either arrives. Clients end up with an organisation that hears from itself, measured through engagement pulses we run every quarter.",
        ],
      },
      {
        label: "Stakeholder messaging",
        summary:
          "Audience-specific framing for investors, regulators, partners and communities, consistent beneath the variation.",
        body: [
          "Large companies address many constituencies with one generic statement and call it consistency. Regulators need precision, investors need trajectory, communities need consequences described in their own terms. When framing ignores those needs, each audience fills the gap with assumptions and the company loses control of interpretation.",
          "We map every stakeholder group, define what each requires as evidence of good intent, and build message sets that hold one factual core with genuinely different emphasis. Materials sit in a living library with version control and named owners. Each audience feels addressed directly, and none of them is an afterthought.",
        ],
      },
      {
        label: "Reputation management",
        summary:
          "A standing capability to protect licence to operate, from issues monitoring through to narrative recovery.",
        body: [
          "Most reputations are managed reactively: a monitoring tool nobody reads, a crisis binder unopened since printing, and a first response improvised at midnight under pressure. Reputation is carried on other people's beliefs, which makes silence as consequential as any statement the company does issue.",
          "We run continuous issues monitoring with analyst interpretation rather than raw alerts, alongside scenario planning twice a year and spokesperson training inside the leadership calendar. When events occur, severity thresholds, response frameworks and decision rights are already agreed. Clients hold quarter-on-quarter trust scores and recovery plans with named owners.",
        ],
      },
    ],
  },
  {
    slug: "social-influencer-marketing",
    sourceId: "b2b-social-influencer",
    category: "B2B",
    number: "04",
    title: "Social & Influencer Marketing",
    shortDescription:
      "Owned channels treated as media, and creators treated as partners. We build social presence and influencer programmes to real editorial standards, with contractual clarity and measurement tied to defined commercial outcomes rather than vanity reach.",
    subServices: [
      {
        label: "Social strategy",
        summary:
          "Channel roles, editorial pillars and audience definitions written before the first post goes out.",
        body: [
          "Social programmes start from presence and end from habit, posting because the calendar demands it. Without a defined job per platform and a named audience per channel, the output is noise carrying a logo, and its budget can never be defended in a review.",
          "We set each platform a function, define pillars against live audience research, and agree response rules for comments, messages and escalations before launch. Strategy reviews run monthly against performance data, with pillars adjusted on evidence. Clients get channels with a point of view and a documented playbook any new team member can run.",
        ],
      },
      {
        label: "Creator partnerships",
        summary:
          "Creator selection and contracting built on audience overlap rather than follower count, with briefing that protects both brand and voice.",
        body: [
          "Influencer budgets leak through selection by vanity. Brands buy follower counts and receive audiences that overlap with no buying group, on deals structured so loosely that neither party knows what success was supposed to look like. Creators, briefed like suppliers, perform like suppliers.",
          "Our partnerships team screens creators on audience composition, past brand behaviour and category credibility, then structures deals with clear deliverables, usage rights and exclusivity terms documented up front. Briefs carry the message architecture inside explicit creative freedom, reviewed jointly before production. Clients build partnerships creators genuinely want to renew, with performance tracked per engagement.",
        ],
      },
      {
        label: "Content production",
        summary:
          "Native-first formats produced at platform cadence, so quality never becomes the casualty of volume.",
        body: [
          "Social content fails twice. Polished campaigns get repurposed without translation into formats audiences skip, while volume-first output erodes the brand it was meant to serve. Both come from treating production as a downstream service rather than a discipline with its own standards.",
          "We staff platform-native producers with editing and motion capability inside one pod, working from pillar calendars with defined approval lanes and a shared asset pipeline. Turnaround is measured in days rather than cycles, and every cut carries a performance hypothesis. The client ends up with a content engine and a library that feeds every other channel.",
        ],
      },
      {
        label: "Community management",
        summary:
          "Response standards and escalation paths that turn a comment section into market intelligence.",
        body: [
          "Communities are left to accumulate rather than managed. Responses depend on who happens to see the notification, complaints surface first on public threads, and years of unprompted customer language, the cheapest research in the market, evaporates unanswered into a platform's feed.",
          "We run community desks with published response-time standards, tiered escalation into product and PR, and a weekly mining report feeding recurring objections into the strategy review. Tone guidance is tested against real threads rather than hypotheticals. Clients get faster resolution, fewer public incidents, and an intelligence feed their roadmap teams actually read.",
        ],
      },
      {
        label: "Campaign measurement",
        summary:
          "Social outcomes tied to brand lift and pipeline contribution through defined baselines, not end-of-campaign screenshots.",
        body: [
          "Measurement assembled after a campaign can only flatter it. Impressions get presented as proof because nobody pre-agreed what the activity was supposed to change, and the report is written at the length the client expects rather than the truth it deserves.",
          "Every brief carries a baseline, a target metric, and the instrument that will read it: brand-lift panels, holdout groups, or attribution structures into the CRM. Reviews compare planned against observed and archive every read in the programme record. Clients gain honest social attribution and a dataset that sharpens each successive campaign.",
        ],
      },
    ],
  },
  {
    slug: "content-and-scale",
    sourceId: "b2b-content-scale",
    category: "B2B",
    number: "05",
    title: "Content & Scale",
    shortDescription:
      "Editorial operations that behave like a media company inside the brand. We produce, distribute and optimise content at volumes one-off agencies cannot reach, with the standards those same agencies claim they cannot afford to protect.",
    subServices: [
      {
        label: "Content strategy",
        summary:
          "Topic authority models mapping what the brand should own against what audiences actually search and share.",
        body: [
          "Content strategies die of enthusiasm. Teams choose topics the company enjoys discussing, publish into categories where stronger voices already hold authority, and discover eighteen months later that none of it moved a measurable needle for anyone outside the marketing function.",
          "We build a topic model from search demand, competitive coverage gaps and sales conversation analysis, then assign each cluster an owner, a format plan and a defined commercial role. The strategy ships as a living document reviewed quarterly against performance data. You get a prioritised programme where every commission answers a question someone is actually asking.",
        ],
      },
      {
        label: "Editorial production",
        summary:
          "A staffed newsroom rhythm with standards, commissions and a pipeline that ships ahead of schedule.",
        body: [
          "Production at volume usually means production at half-standard. Freelance pipelines without editors produce inconsistent voice, calendars slip the moment priorities shift, and teams burn weeks re-approving work that should have been scoped properly on day one.",
          "We operate an editorial desk: commissioning editors, subject specialists and a production manager running a rolling pipeline with briefed standards and approval gates fixed in advance. Weekly stand-ups track the backlog the way a newsroom tracks its list. Clients receive predictable volume, a consistent voice, and a reusable catalogue that feeds every channel they run.",
        ],
      },
      {
        label: "Thought leadership",
        summary:
          "Ghostwriting and structured ideation that turn executive expertise into publishable work at a monthly cadence.",
        body: [
          "Thought leadership stalls where ghostwriting replaces thinking. Writers working from old decks produce generic essays no serious publication will take, because executives are never asked for the argument underneath their credentials. One recorded hour of interview saves weeks of revision nobody believes in.",
          "Our editorial team runs quarterly ideation sessions with named executives, captures their raw positions, and develops drafts the executive annotates rather than redlines from zero. Pieces ship against a monthly calendar with review cycles measured in days. The client builds a genuine authored library and a reputation as a voice, not a brand.",
        ],
      },
      {
        label: "Content distribution",
        summary:
          "Owned, earned and paid amplification planned per asset, so good work stops dying on its publish date.",
        body: [
          "Brands fund production and starve distribution. A substantial asset goes live to the newsletter that already reads it, while the audience that needed it sees nothing, because amplification was treated as a checkbox rather than planned like a media campaign with roles per channel.",
          "Every commissioned asset carries a distribution plan at brief stage: newsletter placement, social decomposition across formats, earned outreach, and paid support sized to the remaining audience gap. Performance windows are defined so winners receive more airtime and failures retire quietly. You get each asset working for months rather than a single launch day.",
        ],
      },
      {
        label: "Search optimisation",
        summary:
          "Technical health, content quality and topical coverage optimised together, against rankings that matter commercially.",
        body: [
          "SEO programmes drift into two failure modes: technical work detached from content, or content optimised for keywords carrying no purchase intent. Teams celebrate ranking movement on terms nobody buys from while core commercial pages decay unwatched, template by template.",
          "We run technical audits, refresh cycles and internal-link architecture as one programme, prioritised by revenue contribution rather than search-volume vanity. A ranking-to-revenue model is rebuilt quarterly so shifts on commercially important terms surface immediately with remediation attached. Clients receive durable organic growth where organic is the cheapest qualified pipeline on the ledger.",
        ],
      },
    ],
  },
  {
    slug: "public-relations-pr",
    sourceId: "b2b-public-relations",
    category: "B2B",
    number: "06",
    title: "Public Relations (PR)",
    shortDescription:
      "Earned attention, engineered. We secure media placement, build executive reputations and hold narrative control under scrutiny, working to newsroom standards, source relationships and deadlines rather than the client's preferred publication schedule.",
    subServices: [
      {
        label: "Media relations",
        summary:
          "Standing relationships with the journalists who cover your category, converted into placements carrying a real story.",
        body: [
          "Media relations bought on distribution lists fails within a quarter. Pitching releases to reporters who stopped reading them years ago produces silence, and the client concludes the channel is dead when the actual problem was a pitch with no news in it and no relationship behind the sender.",
          "Our team maintains live relationships with the business, technology and trade desks that matter to the client's category, meeting journalists regularly with no ask attached. Stories are shaped to news values before outreach, with the reporter chosen for the angle rather than the volume. Clients get coverage in named publications, repeatable quarter after quarter.",
        ],
      },
      {
        label: "Press office",
        summary:
          "A staffed function for queries, statements and press events, so nothing reaches the record uncontrolled.",
        body: [
          "When a journalist calls, most companies have no one whose job it is to answer well. Statements get improvised by whoever holds the phone, approvals scramble upward, and the quote that appears is whichever one nobody had time to object to. Reactive press work is where reputations leak.",
          "We operate the client's press office as a standing service: an agreed query-handling protocol and pre-cleared statement frameworks for plausible scenarios. Announcements are desked proactively, including launches and press events with invitation and follow-through managed end to end. You get fast, consistent responses that keep the company in control of its own record.",
        ],
      },
      {
        label: "Executive profiling",
        summary:
          "Deliberate reputation building that makes named executives the recognised authority their category argues with.",
        body: [
          "Executive profiles assembled from award submissions and conference self-nominations read as corporate vanity, and are received as such. A recognised authority is built differently: a visible position taken consistently, over time, in the venues the industry actually reads.",
          "We profile executives against a reputation map: where they are known, where they are absent, and what each publication or stage would credibly carry. The record is then built through prepared interview briefings and speaking slots pursued via our own relationships. Clients get leaders whose names now precede the company instead of following it.",
        ],
      },
      {
        label: "Thought leadership",
        summary:
          "Placement of executive argument in publications that lend authority, pursued through editorial pitch rather than payment.",
        body: [
          "The earned side of thought leadership is a separate discipline from writing. A strong essay rejected by every target desk is usually a pitch failure: written for the brand's blog rather than the publication's reader, and sent to an editor with no reason to care this week.",
          "Our team works the placement like a desk editor, mapping sections and tracking what each publication runs before sharpening drafts into contribution-shaped arguments with a news hook. Exclusivity and syndication rights are handled in writing. Clients get bylines in named outlets and links that compound search authority over time.",
        ],
      },
      {
        label: "Issues communications",
        summary:
          "Positioning on contested topics decided in advance, so the company speaks from policy rather than panic.",
        body: [
          "Companies discover their positions on contested issues when a reporter forces one. With no prior agreement internally, the first answer is the least prepared one, and the market remembers the stumble far longer than the policy written afterwards to prevent it.",
          "We maintain an issues register covering plausible contested topics, with agreed positions and spokespeople designated for each. Scenarios are rehearsed twice a year, and escalation triggers are defined in writing across legal, communications and the executive suite. Clients get the discipline to speak early and accurately, where improvised silence reads as guilt.",
        ],
      },
    ],
  },
  {
    slug: "customer-marketing",
    sourceId: "b2b-customer-marketing",
    category: "B2B",
    number: "07",
    title: "Customer Marketing",
    shortDescription:
      "Customer marketing is the commercial value of the installed base, activated. We turn existing customers into advocacy, retention and expansion revenue through structured programmes rather than sporadic goodwill and birthday emails.",
    subServices: [
      {
        label: "Customer advocacy",
        summary:
          "Reference networks and advocate programmes built deliberately, with mutual value designed into the arrangement.",
        body: [
          "Advocacy is usually extracted rather than built. Sales asks a happy customer for a reference call at quarter-end, the favours accumulate as resentment on both sides, and the best accounts burn out because nobody designed what they received in return.",
          "We structure advocacy as a programme: a tiered reference network with consent properly tracked, preparation for every call, and an explicit value exchange through early access, executive forums or recognition. Participation is measured and renewed. Clients get references that convert reliably because the advocate feels like a partner, not a resource.",
        ],
      },
      {
        label: "Retention campaigns",
        summary:
          "Churn drivers identified through behavioural data and answered with sequenced intervention, not blanket discounting.",
        body: [
          "Retention spend concentrates on customers already leaving, because renewal reminders are easy to fund and diagnosis is not. The account that quietly stopped logging in six months ago receives the same generic re-engagement email as the one negotiating termination, while the earliest churn signals go completely unanswered.",
          "We work from health scores built on usage behaviour and support history, triggering designed interventions per risk pattern: success replays for adoption failures, executive outreach for relationship risk. Campaign cadence is reviewed with revenue operations monthly. Clients keep renewals that would have lapsed and measure the margin recovered by doing it.",
        ],
      },
      {
        label: "Lifecycle communications",
        summary:
          "Automated sequences across onboarding, adoption and renewal that carry brand tone without becoming spam.",
        body: [
          "Lifecycle email decays into noise. Onboarding flows written at launch are still firing three product generations later, and renewal sequences repeat the pitch the customer already accepted, because nobody in the organisation owns the lifecycle from onboarding through to exit.",
          "We audit and rebuild lifecycle journeys stage by stage, writing sequences from current product reality with defined triggers, suppression rules and tone held to brand standards. Performance is reviewed quarterly against action and renewal correlation. Clients get communications customers actually read, and a maintenance process that keeps them honest.",
        ],
      },
      {
        label: "Case studies",
        summary:
          "Customer stories produced to editorial standards, with specifics a sceptical buyer can verify and act on.",
        body: [
          "Most case studies are two organisations complimenting each other. Outcomes are hedged, numbers absent, and the reader, a peer evaluating a purchase, learns nothing except that the vendor has polite customers. Stories like this are quietly distrusted by exactly the audience they aim to convince.",
          "We produce case studies as reportage: recorded interviews with the customer, real constraints stated honestly, and quantified outcomes agreed and signed off by both sides. Each story is decomposed for web, video and sales use at production. Clients get proof assets sellers request by name and prospects forward internally without embarrassment.",
        ],
      },
      {
        label: "Customer events",
        summary:
          "User conferences and executive forums designed around peer learning, not product theatre from the stage.",
        body: [
          "Customer events fail when the agenda belongs to the host. Keynote-heavy programmes where every session is a disguised product update produce warm evenings and cold evaluations, and the strategic accounts who travelled furthest decide the next invitation goes unanswered.",
          "We design events around what customers want from each other: peer case sessions, facilitated roundtables on shared problems, and stage time allocated to customer narrative first. Logistics, invitations and executive hosting run from our events desk, with value measured in connections made rather than badges scanned. Clients get events their communities ask to return to.",
        ],
      },
    ],
  },
  {
    slug: "account-based-marketing",
    sourceId: "b2b-abm",
    category: "B2B",
    number: "08",
    title: "Account-Based Marketing (ABM)",
    shortDescription:
      "Revenue directed at named accounts with the precision of a campaign and the patience of a relationship. We research, map and engage enterprise buying committees with personalisation that survives scrutiny, and measure every programme by pipeline it creates.",
    subServices: [
      {
        label: "Account research",
        summary:
          "Commercial intelligence on every named account, refreshed on cadence and written for sellers who must use it.",
        body: [
          "Account lists assembled from firmographic filters are not research. They describe who might buy in theory while telling the seller nothing about leadership changes, expansion signals, or the internal argument the account is having this quarter, which is the only intelligence that shifts outcomes.",
          "Our research desk builds account dossiers from filings, hiring data, public statements and newsroom output, updated on a defined cadence and flagged when triggers fire. Each dossier answers what changed, what it implies commercially, and where to enter. Clients hold a living library that makes first meetings feel like second ones.",
        ],
      },
      {
        label: "Audience mapping",
        summary:
          "Buying committees identified by name and role, with influence mapped rather than guessed from job titles.",
        body: [
          "Enterprise deals are decided by groups no org chart explains. Marketing targets the title and misses the internal champion; sales reaches the budget holder only after the specification was written by someone unnamed. Mapping by job function rather than demonstrated influence leaves the real decision structure invisible.",
          "We map each committee through relationship graphing, engagement history and primary research, marking the champion, the blocker and the silent voter the paper process ignores. Coverage is tracked per role against pipeline, with named gaps closing in weekly reviews. Every campaign then engages a living structure you can see.",
        ],
      },
      {
        label: "Personalised campaigns",
        summary:
          "Account-specific creative and offer design that references the buyer's reality, built at scale through meaningful templates.",
        body: [
          "Personalisation collapses into mail-merge when the variable is a name and the substance is a template. Enterprise buyers recognise mass messaging wearing their logo within seconds, and one hollow personalised touch costs more credibility than an honest generic alternative ever would.",
          "We build campaigns from research inputs: account-specific angles, sector proof and named business pain selected per segment, produced through modular creative systems where the variables carry real meaning. Direct outreach and digital sequences compose as one account narrative. Campaigns arrive talking about the buyer's own quarter.",
        ],
      },
      {
        label: "Sales enablement",
        summary:
          "Account tools sellers genuinely use, sequenced to the deal situation they face rather than the campaign that produced them.",
        body: [
          "Enablement libraries fail because they are built for the person who made them. Content organised by campaign rather than by deal situation means sellers navigating a live competitive replacement never search the archive; they ask a colleague, and the asset might as well not exist.",
          "We work from call recordings and win-loss data to build what sellers reach for: stage-specific sequences and battlecards against named competitors, opening with the argument rather than the agenda. Adoption is measured monthly and shelved assets cut back. Your sales force then engages committees with the same intelligence marketing carries.",
        ],
      },
      {
        label: "Account measurement",
        summary:
          "Progress tracked through engagement depth and committee coverage, tied to revenue rather than to clicks.",
        body: [
          "Campaign metrics mislead in account-based work. An enterprise deal involves months and many humans, so a dashboard full of engagement volume can sit on top of accounts that have stalled completely, and nobody learns which tier to repair until the quarter is gone.",
          "We measure depth per account: roles engaged, coverage against the committee map, content consumed in deal context, and stage movement defined with sales before launch. Tier reviews run monthly with reallocation decisions attached, every metric tracing into the CRM record. Attention then lands where revenue will, on an honest scoreboard.",
        ],
      },
    ],
  },
];
