/**
 * @file src/app/services/content/b2c.ts
 * @description B2C Consumer service detail copy deck consumed by /services/[slug]
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { ServiceDetailDoc } from "../types";

export const B2C_SERVICE_DETAILS: ServiceDetailDoc[] = [
  {
    slug: "integrated-creativity",
    sourceId: "b2c-integrated-creativity",
    category: "B2C",
    number: "01",
    title: "Integrated Creativity",
    shortDescription:
      "Strategy, design, and build work as one discipline here, so a consumer brand says the same thing from first impression to checkout. Ideas usually fracture when teams plan separately; we hold one shared rhythm and a single source of truth from concept to the surfaces people use.",
    subServices: [
      {
        label: "Brand strategy",
        summary:
          "We fix what a brand stands for and who it serves, so every later decision has something firm to refer back to.",
        body: [
          "Brand strategy decides the ground a consumer brand stands on. It names the audience truth the brand serves and the behaviours that make the promise real. Most brands get this wrong by treating strategy as a rebrand, launching a fresh logo while the underlying promise stays vague and unfelt.",
          "We run positioning workshops with your leadership, back them with semiotic and cultural research, and settle the work in a messaging house and a set of repeatable brand codes. What you keep is a defensible point of view your teams can quote in the room and test new work against before anything ships.",
        ],
      },
      {
        label: "Creative platform",
        summary:
          "One big idea becomes a repeatable system a brand can run for years, rather than a campaign that burns out on arrival.",
        body: [
          "A creative platform is the idea underneath the campaigns. It gives a brand a territory wide enough to keep generating work but sharp enough to stay recognisable. Teams get this wrong by commissioning a strong first idea, then chasing it with weaker executions that quietly contradict it.",
          "We define the platform as an idea system: a central thought plus the creative rules that express it, with proof points that keep it honest. Every future activation is judged against those rules, so the platform compounds rather than decays. The client keeps a renewable engine for campaign ideas.",
        ],
      },
      {
        label: "Campaign development",
        summary:
          "We carry one insight from early script through to rollout, so the idea that tested well survives the production that ships it.",
        body: [
          "Campaign development is the discipline of protecting an idea while it gets made. Consumer work usually dies between the pitch and the shoot, softened by round after round of approvals and briefs that quietly change along the way. The result is a safe version nobody disagrees with and nobody remembers.",
          "We run concept sprints against a locked idea, then write treatments and phased rollout plans that stay tied to the original test. Every cut-down and market adaptation follows one master, with a single owner guarding it. Clients get campaigns that land with the force of the version everyone approved.",
        ],
      },
      {
        label: "Design systems",
        summary:
          "We build the reusable components and rules that let a brand look consistent without a designer policing every output.",
        body: [
          "A design system turns brand direction into parts people can actually use. Too many consumer brands rely on a static guidelines PDF that no one opens, so every team rebuilds the wheel and the look drifts. Without shared components and rules, consistency becomes a daily argument.",
          "We build token libraries and component kits with clear motion principles, inside the tools your teams already use, then set simple governance for versioning and change. Designers spend their time on ideas, not on re-justifying type scales. The client keeps a living system that holds the brand together across every surface it ships.",
        ],
      },
      {
        label: "Digital experiences",
        summary:
          "We design the owned apps and sites where consumers meet the brand, built around their tasks rather than the org chart.",
        body: [
          "Digital experience is where a consumer brand is tested most often and judged most quickly. Plenty of well-loved brands ship sites and apps that look striking but frustrate in use, because the interface follows internal structure instead of the jobs people arrive to do.",
          "We map the journeys that matter and prototype them early, testing with real users before a line of production code is written. Handover to engineering uses the same component system as the rest of the brand, so nothing is reinvented at build. The client keeps experiences that convert and hold together.",
        ],
      },
    ],
  },
  {
    slug: "social-influencer",
    sourceId: "b2c-social-influencer",
    category: "B2C",
    number: "02",
    title: "Social & Influencer",
    shortDescription:
      "Presence is not strategy. We plan social and creator work around what each network is genuinely for, then produce the native, scroll-stopping material that turns passive followers into people who advocate for the brand with their own audience.",
    subServices: [
      {
        label: "Social strategy",
        summary:
          "We decide what your brand is doing on each network and why, then set a repeatable tone, content pillars, and posting rhythm.",
        body: [
          "Social strategy is the difference between being everywhere and being effective. Many consumer brands spread across every network and post the same thing on all of them, treating that as a plan. Accounts grow slowly and the team burns out, while nothing shifts for the business.",
          "We start from a channel audit and audience mapping, decide the job each platform does, then set editorial pillars and a rolling calendar around it. Work is planned a month ahead but leaves room to react to culture. The result is a strategy that makes next week easy to decide.",
        ],
      },
      {
        label: "Creator partnerships",
        summary:
          "We match your brand with creators people already trust, then structure the deal so both sides get real value from it.",
        body: [
          "Creator partnerships put your brand inside a relationship an audience already believes. Too often brands buy reach by follower count and pick the biggest names, then get hollow placements the creator clearly does not use. Trust cannot be rented by audience size alone.",
          "We score creators on genuine fit rather than follower count, brief them tightly, then handle contracts and usage rights. Long relationships beat one-off posts, so we build talent benches that keep working. What lands is creator content that looks native because it genuinely is.",
        ],
      },
      {
        label: "Platform content",
        summary:
          "We make material built for each feed's format and behaviour, not a single campaign asset resized and pasted across every network.",
        body: [
          "Platform content is what people actually see, and each network rewards a different behaviour. The usual failure is one hero asset, cropped and reposted everywhere, reading as native on none of them. Audiences can smell the recycled post within a single frame.",
          "We plan around each feed's native format, building hooks and vertical edits that match how the platform is used. Teams shoot once but assemble many versions, and early engagement decides what scales. What ships is content that performs inside each feed instead of simply occupying it.",
        ],
      },
      {
        label: "Community management",
        summary:
          "We run replies and comments as brand voice, with clear service levels so the community stays healthy.",
        body: [
          "Community management is where a brand stops broadcasting and starts listening. Many teams leave their comments to a rota or ignore them entirely, which turns a loyal audience into a neglected one. The reply you miss becomes the thread a rival answers instead.",
          "We set a response service level and a tone guide, with an escalation path for anything sensitive. We surface user content worth amplifying and track the sentiment that shifts. The community ends up feeling genuinely attended to rather than farmed out.",
        ],
      },
      {
        label: "Campaign reporting",
        summary:
          "We report what social and creator work truly did for the brand, beyond vanity likes and reach that meant nothing.",
        body: [
          "Campaign reporting decides whether anyone learns from the work. The failure mode is a deck full of impressions and likes that no one trusts and that fail to explain what they are for. Vanity numbers feel good and change nothing.",
          "We build a small KPI tree tied to business goals, then measure engagement quality and contribution to demand rather than raw impressions. Reporting runs to a monthly cadence with honest reads on what underperformed, ending in a number your team can defend in a budget review.",
        ],
      },
    ],
  },
  {
    slug: "digital-performance",
    sourceId: "b2c-digital-performance",
    category: "B2C",
    number: "03",
    title: "Digital Performance",
    shortDescription:
      "We run measurable channels where every pound is accountable: search, social, and the owned journey that receives them. Rather than chase clicks in the dark, we fix the tracking first and test honestly against real targets, reporting only what proves a contribution to revenue.",
    subServices: [
      {
        label: "Paid search and social",
        summary:
          "We buy attention where intent and audience actually meet, then steer budget against real commercial targets rather than surface clicks.",
        body: [
          "Paid search and social put your brand in front of people ready to act or worth reaching. The common mistake is over-trusting last-click figures, which quietly rewards bottom-funnel terms and starves the demand a brand needs tomorrow. Accounts drift toward cheap conversions nobody asked for.",
          "We structure campaigns around intent and audience, set clear bidding and budget rules, then prove effect with incrementality tests rather than platform self-reporting. Creative refresh follows a fixed cadence to fight fatigue. What you get is a media engine that scales real demand rather than chasing cheap clicks.",
        ],
      },
      {
        label: "SEO",
        summary:
          "We grow durable organic visibility through technical health and genuine authority, so you stop renting attention you once owned.",
        body: [
          "SEO earns placement that costs nothing per click once it is won. Brands treat it as a one-off technical audit, or worse as keyword stuffing, then watch rivals take ground they once held. Organic visibility quietly decays the moment attention lapses.",
          "We work in layers that stack: technical crawl and performance first, then content that answers real search intent, with authority built through genuine links. Priorities are set by opportunity, then tracked on a rolling roadmap. The payoff is organic growth that compounds instead of resetting each year.",
        ],
      },
      {
        label: "Conversion optimisation",
        summary:
          "We raise the share of visitors who act by testing honest hypotheses, not opinions or design taste dressed up as data.",
        body: [
          "Conversion optimisation is about getting more from the traffic you already pay for. Too many teams relaunch on instinct or copy a competitor's layout, then cannot explain what moved the number. A redesign that feels fresh can quietly break the one path that converted.",
          "We start from behavioural evidence and rank a queue of testable hypotheses, then run controlled experiments against a clear primary metric. Findings feed a documented backlog the whole team can use, leaving a compounding record of what genuinely persuades a shopper to act.",
        ],
      },
      {
        label: "Analytics setup",
        summary:
          "We build the measurement layer your reporting depends on, so decisions rest on data you can actually believe.",
        body: [
          "Analytics setup is unglamorous and decides everything downstream. Brands bolt on tools piecemeal, end up with tracking nobody trusts after a platform change, and argue over whose dashboard is correct. Bad data dressed as confidence is worse than admitting you do not know yet.",
          "We design the data layer and govern tags so events stay standard across web and app, moving toward server-side collection where privacy demands it. One definition per metric is documented and shared. You end up with a measurement foundation every other capability here quietly relies on.",
        ],
      },
      {
        label: "Performance reporting",
        summary:
          "We turn raw campaign data into decisions, showing what worked and where the budget should go next.",
        body: [
          "Performance reporting exists to guide the next choice, not to recount the last one. Most reports drown in metrics and say nothing about causes, leaving teams to guess. A number without context invites the loudest person in the room to invent one.",
          "We combine attribution modelling with a lighter market-mix read, then publish a recurring board-ready view that ties spend to outcomes. Each figure carries a written read and a recommendation. Clients get reporting that ends with a decision rather than a shrug.",
        ],
      },
    ],
  },
  {
    slug: "sports-marketing",
    sourceId: "b2c-sports-marketing",
    category: "B2C",
    number: "04",
    title: "Sports Marketing",
    shortDescription:
      "Sport hands a brand a tribe it could never assemble alone. We help you choose the right right and activate it far beyond the event itself, then prove what it changed for the business. Logo placement is the entry fee, not the plan; the value lives in deliberate activation.",
    subServices: [
      {
        label: "Partnership strategy",
        summary:
          "We help you choose the teams, leagues, and events worth backing, then negotiate terms that give you room to activate.",
        body: [
          "Partnership strategy is deciding which sport is actually yours. Brands chase the biggest name for the badge, then find the audience barely overlaps with their buyers and the contract leaves no rights to use. A sponsorship can look prestigious and still be strategically empty.",
          "We map audience fit and category exclusivity against your goals, then value the rights honestly before you commit. Negotiation secures the activation space a deal needs to work. You end up with a partnership chosen for returns rather than for the logo on a shirt.",
        ],
      },
      {
        label: "Athlete and talent activations",
        summary:
          "We turn signed athletes into working partners across content and product rather than static faces on a poster.",
        body: [
          "Athlete activation decides whether a signing earns its keep. The default is a single photo shoot and a poster nobody photographs back, leaving an athlete's real influence unused. Talent sitting still is money quietly left on the table.",
          "We build year-round plans across shoots and product collaborations, with clear usage rights and personal-brand alignment. Genuine access, not scripted reads, is what audiences reward. The signed talent ends up working for the brand across every channel.",
        ],
      },
      {
        label: "Sponsorship campaigns",
        summary:
          "We turn signed rights into campaigns that run through the whole year, not just on the days the logo is visible.",
        body: [
          "Sponsorship campaigns activate the rights you paid for. Too many brands switch on only around match day, then go dark for months, forfeiting the value they bought. The trophy lifts and the audience promptly forgets you were there.",
          "We plan an always-on layer plus tentpole moments tied to the calendar, feeding each phase with tailored content and offers. Rights are used across media and retail at once. The sponsorship keeps earning between the headline fixtures instead of going dark.",
        ],
      },
      {
        label: "Fan engagement",
        summary:
          "We build the communities and matchday moments where fans meet your brand on their terms, not as an unwanted interruption.",
        body: [
          "Fan engagement is where sponsorships either come alive or embarrass themselves. Brands talk at supporters with promotions no fan asked for, and wonder why loyalty does not transfer. Passion is not a channel you can simply rent for an afternoon.",
          "We design matchday experiences and membership offers that give fans something real, then meet them on the platforms they already use. Listening and participation matter more than volume. The fans who remain choose the brand rather than merely seeing it.",
        ],
      },
      {
        label: "Measurement",
        summary:
          "We show what a sports partnership genuinely did for brand and sales, beyond the inflated media-value claims the industry trades in.",
        body: [
          "Measurement is how sponsorships survive or get cut. Brands accept soft media-equivalency numbers that flatter the deal and convince no one in finance, then lose support the moment budgets tighten. Value claimed is not value proven to anyone with a spreadsheet.",
          "We pair brand-lift studies with sponsorship-effect modelling, then tie in ticketing and CRM data to link the partnership to outcomes. Reporting runs on a set cadence against goals agreed at the start, producing evidence that defends renewal with numbers finance will accept.",
        ],
      },
    ],
  },
  {
    slug: "crm-and-loyalty",
    sourceId: "b2c-crm-loyalty",
    category: "B2C",
    number: "05",
    title: "CRM & Loyalty",
    shortDescription:
      "The customer you already have is the cheapest one to sell to again. We build consented first-party data and map the moments worth messaging, then design loyalty people want. The aim is a relationship that earns permission and returns profit, not an inbox your best customers learn to avoid.",
    subServices: [
      {
        label: "CRM strategy",
        summary:
          "We plan how you capture and reward customer data, so relationship marketing earns permission rather than spending it away.",
        body: [
          "CRM strategy governs how a brand uses everything it knows about its customers. Done badly, it is an endless feed of discounts to a list that never stops growing or buying. The asset gets used up until people simply unsubscribe.",
          "We define consent and first-party data capture, segment the audience by real behaviour and value, then agree the message each group should get and why. Every plan balances return against patience a customer can extend. Clients get a CRM built to last rather than to blast.",
        ],
      },
      {
        label: "Lifecycle journeys",
        summary:
          "We map the path from first contact to repeat buyer and automate the messages that matter at each turning point.",
        body: [
          "Lifecycle journeys cover the moments when a customer decides to stay or quietly leave. Brands send one welcome email and call it automation, missing the far more valuable moments that come later. A customer's second year should not feel like their first.",
          "We map the stages that matter, then trigger flows from onboarding through to win-back, fired off real events. Each journey is measured and pruned where it underperforms. What remains is a system that speaks to people at the moment worth reaching them.",
        ],
      },
      {
        label: "Loyalty programmes",
        summary:
          "We design loyalty schemes that change behaviour and lift value, rather than another discount club customers only visit for deals.",
        body: [
          "Loyalty programmes should make the best customers feel genuinely recognised. Most become discount clubs instead, training buyers to wait for offers and eroding the margins they were meant to protect. Points alone rarely earn real affection.",
          "We model tier and reward economics against spend and design a currency that is earned and burned usefully, with non-price benefits that recognise people beyond discounts. Progression and status are engineered deliberately. The result is a programme that shifts behaviour instead of subsidising the same purchases.",
        ],
      },
      {
        label: "Marketing automation",
        summary:
          "We run your campaigns across email, SMS, and apps from one system, so the right message reaches the right person automatically.",
        body: [
          "Marketing automation turns CRM strategy into messages that reach people at scale. Brands set conflicting rules and over-contact the same customers, often letting flows break without anyone noticing. Automation without oversight is just a faster way to annoy the wrong person.",
          "We choose a platform and configure it properly, then build flows with suppression logic so no one is over-messaged. Delivery quality and consent are monitored continuously. The automated comms feel personal because the system respects the customer's context.",
        ],
      },
      {
        label: "Retention analysis",
        summary:
          "We measure whether customers actually come back and spend more, so you fix the quiet leaks that vanity metrics hide.",
        body: [
          "Retention analysis reveals whether a brand keeps the customers it wins. Teams chase sign-ups and open rates while churn, the quiet profit-killer, goes unexamined and uncounted. A growing list can still mask a shrinking business.",
          "We build cohort retention curves and model lifetime value, then flag churn signals worth acting on before they cost you the customer. Findings route straight back into lifecycle and loyalty work, giving a clear view of where value leaks and how to patch each hole.",
        ],
      },
    ],
  },
  {
    slug: "public-relations",
    sourceId: "b2c-public-relations",
    category: "B2C",
    number: "06",
    title: "Public Relations (PR)",
    shortDescription:
      "Earned attention carries a credibility paid reach cannot buy, because an editor or fan chose to cover you rather than being paid. We find the stories worth telling and reach the right people, then protect the brand when the room turns. Fame is built deliberately, not hoped for.",
    subServices: [
      {
        label: "Media relations",
        summary:
          "We place your brand in the publications your audience reads by pitching stories they genuinely want to run.",
        body: [
          "Media relations is how a brand earns coverage it did not buy. The usual approach is a press release fired at every journalist on a list, which is ignored because it offers no story worth running. Volume in an inbox is not influence.",
          "We build sharp story angles and target a real shortlist of writers, then pitch to what each one actually covers. Embargoes, exclusives, and timing are managed deliberately. Coverage lands because the pitch was worth their reader's attention.",
        ],
      },
      {
        label: "Press events",
        summary:
          "We stage moments that give journalists a reason to show up and something worth writing about when they do.",
        body: [
          "Press events fail when they are mistaken for decoration. A branded room and a catering spread do not make a story, and reporters who attend purely for the coffee file the invite and never write the piece. Attendance is not the outcome.",
          "We build each event around a genuine news hook and brief the talent to match, securing access worth a journalist's diary slot. The run-of-day is built for the live report. What follows is coverage rather than a photo of the set.",
        ],
      },
      {
        label: "Product launches",
        summary:
          "We plan the run-up and the follow-through of a launch so a new product earns attention instead of a quiet welcome.",
        body: [
          "A product launch is where PR either proves its worth or shows how thin it was. Brands announce on the day with no build-up and no reason to care, so the release sinks within a single news cycle. A reveal without a story is only an inventory update.",
          "We phase the launch from seeding and embargoed reviews through to reveal and follow-up, giving press and creators the angles that matter. Timing and access are the whole lever. The launch opens to people who were already anticipating it.",
        ],
      },
      {
        label: "Cultural storytelling",
        summary:
          "We root your brand in the culture people care about, telling stories worth sharing instead of shouting at them.",
        body: [
          "Cultural storytelling makes a brand part of what people are already talking about. Brands force themselves into trends they do not belong in, and the effort shows a mile off. A culture you join too late only reveals that you were watching from outside.",
          "We read cultural currents early and build stories with real editorial value, partnering with the voices and platforms that give a brand permission to speak. Restraint matters as much as ideas. The narratives travel because they land inside culture rather than on top of it.",
        ],
      },
      {
        label: "Reputation management",
        summary:
          "We protect and shape how your brand is perceived, preparing for the bad days before they arrive.",
        body: [
          "Reputation management is won or lost before the crisis hits. Brands improvise statements at the worst possible moment, when a considered line had been ready all along. Silence mistaken for caution can cost more than the story itself.",
          "We map the issues that could reach the brand, then prepare holding statements and monitor the conversation, training spokespeople for hard questions. Response runs on an agreed playbook, not a scramble. The reputation is tended every quiet day, not only in the loud ones.",
        ],
      },
    ],
  },
  {
    slug: "live-experiences",
    sourceId: "b2c-live-experiences",
    category: "B2C",
    number: "07",
    title: "Live Experiences",
    shortDescription:
      "Nothing earns a consumer's attention quite like a moment shared in the same room. We design pop-ups, launches, and activations that feel worth leaving the house for. Every event here is planned against a clear purpose and run like a broadcast, so the memory survives well past the teardown.",
    subServices: [
      {
        label: "Experience strategy",
        summary:
          "We decide what an event must achieve and why anyone should bother coming, before a single creative decision gets made.",
        body: [
          "Experience strategy gives a live event a job beyond looking impressive. Brands plan a spectacle first and search for a purpose afterwards, which is how budgets vanish into beautiful rooms nobody remembers the point of. An event without a reason is only expensive decoration.",
          "We set the objective and define the audience outcome, then choose the measures that show the difference it made. Every later decision is tested against that brief. The experience earns a clear role in the wider brand plan rather than being a standalone party.",
        ],
      },
      {
        label: "Event creative",
        summary:
          "We design the concept and flow of an event so it tells a story and gives guests something worth talking about.",
        body: [
          "Event creative is the difference between decoration and an experience. Too many activations are a logo and a photo wall, which a guest forgets before reaching the exit. The concept should be something people describe to friends afterwards.",
          "We build the theme and the guest journey, designing the moments worth photographing or sharing with each beat planned on purpose. Creative ties straight back to the brand's platform. The event feels like an idea rather than a well-furnished room.",
        ],
      },
      {
        label: "Spatial design",
        summary:
          "We plan the physical space so movement and flow make the experience feel effortless to walk through.",
        body: [
          "Spatial design turns a venue into an experience instead of a crowd. Poor layout creates bottlenecks and hides the very thing you paid to show, ruining the guest's memory of the brand. Flow is felt long before it is noticed.",
          "We design the walk-throughs and wayfinding, then plan access and safety for real footfall before the doors open. Physical builds are prototyped and pressure-tested against capacity. The finished space guides people naturally toward the moments that matter.",
        ],
      },
      {
        label: "Live production",
        summary:
          "We run the day itself, coordinating crew and suppliers so the event happens exactly as planned.",
        body: [
          "Live production is where ambition meets a fixed clock. Events fail on the day through unclear running orders and suppliers nobody briefed properly, not through weak ideas. The best creative in the world will not survive a schedule nobody rehearsed.",
          "We build a detailed run-of-show and rehearse every cue and talent appearance against it, managing suppliers and crew to one shared plan. One producer owns the day from first build to final teardown. What the client sees is a live event that runs on time and looks entirely effortless.",
        ],
      },
      {
        label: "Audience engagement",
        summary:
          "We turn spectators into participants, giving guests active roles that make the experience theirs to remember.",
        body: [
          "Audience engagement decides whether a guest simply watches an event or actually joins it. Passive crowds remember less and share far less, which shrinks the value of the whole production. Attention is cheap; willing participation has to be earned in the moment.",
          "We design interaction and second-screen moments that pull people in, then make joining easy and genuinely rewarding. Participation data feeds straight into the CRM. The audience leaves having done something rather than merely seen it.",
        ],
      },
    ],
  },
  {
    slug: "retail-activation",
    sourceId: "b2c-retail-activation",
    category: "B2C",
    number: "08",
    title: "Retail Activation",
    shortDescription:
      "The shelf is the busiest, most crowded moment in a consumer's day. We plan how a brand wins there, through creative that earns attention at the point of sale and experiences that make a store worth visiting, then read the till data honestly to see what actually sold.",
    subServices: [
      {
        label: "Retail strategy",
        summary:
          "We plan where and how your brand should show up and convert the shopper standing in front of it.",
        body: [
          "Retail strategy is where brand plans meet the hard reality of the shop floor. Marketing built in isolation often ignores range and merchandising, then is surprised when demand never converts to sales at the shelf. A campaign nobody can actually buy is only expensive theatre.",
          "We map the shopper journey and plan range and price, then set the in-store role the brand must play against competitors. The strategy aligns the marketing and the shopkeeper around one target, built for how a product is genuinely chosen.",
        ],
      },
      {
        label: "Point-of-sale creative",
        summary:
          "We design the displays and signage that win attention and drive purchase right where the transaction happens.",
        body: [
          "Point-of-sale creative works in seconds, in a room full of noise and rival brands fighting for the same eye. Brands reuse their campaign artwork unchanged and are baffled when it disappears into the aisle. Screen creative rarely survives contact with a shop floor.",
          "We design displays and signage for the actual viewing distance, the sightline, and the rules each retailer sets. Compliance is planned in so nothing is rejected at install. Creative earns attention and sells at the moment of decision.",
        ],
      },
      {
        label: "Visual merchandising",
        summary:
          "We arrange the shelf and space so products tell a story and lead a shopper naturally toward buying them.",
        body: [
          "Visual merchandising is the silent salesperson on the shop floor. A shelf stocked without a story reads as plain clutter, while careful adjacencies and fixturing can lift a whole category without a single extra promotion. Poor presentation quietly costs you the sale.",
          "We build planograms and merchandising guides around story and shopper flow, then check them live in store and correct where they drift. Staff get simple, clear standards to hold the look, so the shelf sells as neatly as it displays.",
        ],
      },
      {
        label: "In-store experiences",
        summary:
          "We create reasons to visit and stay, turning a routine shopping trip into something a customer chooses to remember.",
        body: [
          "In-store experiences make a physical shop worth travelling to in a world where everything else can be delivered. Brands bolt on theatre that has no link to the sale and then cannot explain its value. A spectacle that sells nothing is only a cost.",
          "We plan an activation calendar of demonstrations and sampling, then brief and equip the staff who run them. Every experience is tied to a product or an offer that converts. The store becomes somewhere people choose to visit rather than merely pass through.",
        ],
      },
      {
        label: "Sell-through measurement",
        summary:
          "We track what actually leaves the till, so success is judged by sales and not by the shipments you promised.",
        body: [
          "Sell-through measurement is retail's honest moment. Brands celebrate shipping stock into stores as though it were a sale, when the only number that matters is what a shopper takes off the shelf. Stock sitting in a warehouse has sold to no one.",
          "We read point-of-sale and syndicated data and measure promotional lift against a control, then trace how activations move units week to week. Learnings feed back into the next plan, giving clear proof of what sold and why it moved.",
        ],
      },
    ],
  },
];
