# Graph Report - marca_ubi_web_hosting  (2026-11-05)

## Corpus Check
- Large corpus: 888 files · ~848,600 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2549 nodes · 6448 edges · 140 communities (108 shown, 32 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Header Navigation & Liquid Glass Experience
- Sales Intelligence & CRM Engine
- Editorial & Blog Architecture
- Curtain Stage & Motion Choreography
- Sales Intelligence & CRM Engine
- Header Navigation & Liquid Glass Experience
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Services & Interactive Accordions
- Sales Intelligence & CRM Engine
- Client Ingestion & Project Briefs
- Client Ingestion & Project Briefs
- Editorial & Blog Architecture
- Editorial & Blog Architecture
- Curtain Stage & Motion Choreography
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Subsystem 25: src_app_chat_pod_engine_context
- Header Navigation & Liquid Glass Experience
- Editorial & Blog Architecture
- Sales Intelligence & CRM Engine
- Editorial & Blog Architecture
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Subsystem 32: src_app_chat_pod_engine_match
- Subsystem 33: agents_skills_antislop_human_contrast_check
- Editorial & Blog Architecture
- Sales Intelligence & CRM Engine
- Editorial & Blog Architecture
- Subsystem 37: tests_e2e_chatpod_spec
- Client Ingestion & Project Briefs
- Sales Intelligence & CRM Engine
- Curtain Stage & Motion Choreography
- Client Ingestion & Project Briefs
- Database Schema & Security Layer
- Editorial & Blog Architecture
- Sales Intelligence & CRM Engine
- Client Ingestion & Project Briefs
- Services & Interactive Accordions
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Subsystem 49: src_app_admin_components_dashboard_executivemasthead
- Sales Intelligence & CRM Engine
- Curtain Stage & Motion Choreography
- Platform Core & Turbopack Optimization
- Sales Intelligence & CRM Engine
- Editorial & Blog Architecture
- Editorial & Blog Architecture
- Header Navigation & Liquid Glass Experience
- Platform Core & Turbopack Optimization
- Sales Intelligence & CRM Engine
- Database Schema & Security Layer
- Sales Intelligence & CRM Engine
- Client Ingestion & Project Briefs
- Subsystem 62: scripts_verify_sprint_7_2
- Database Schema & Security Layer
- Sales Intelligence & CRM Engine
- Subsystem 65: src_app_chat_pod_intake_review_reviewrow
- Subsystem 66: src_app_components_smoothscrollprovider_smoothscrollprovider
- Header Navigation & Liquid Glass Experience
- Editorial & Blog Architecture
- Subsystem 69: scripts_verify_sprint_9_1
- Subsystem 70: scripts_verify_sprint_9_2
- Sales Intelligence & CRM Engine
- Database Schema & Security Layer
- Sales Intelligence & CRM Engine
- Subsystem 74: package_scripts
- Sales Intelligence & CRM Engine
- Subsystem 76: src_app_admin_components_layout_adminrootclientprovider
- Client Ingestion & Project Briefs
- Client Ingestion & Project Briefs
- Sales Intelligence & CRM Engine
- Subsystem 80: tests_unit_chatpod_contrast_test
- Subsystem 81: scripts_verify_contrast_wcag
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Subsystem 86: ref_node_child_process
- Subsystem 87: scripts_verify_sprint_8_2
- Sales Intelligence & CRM Engine
- Client Ingestion & Project Briefs
- Kinetic Media & Video Pipeline
- Database Schema & Security Layer
- Sales Intelligence & CRM Engine
- Subsystem 93: scripts_verify_sprint_8_1
- Sales Intelligence & CRM Engine
- Subsystem 95: src_app_components_initialloader_initialloader
- Subsystem 96: src_app_lib_avatar_schemas
- Editorial & Blog Architecture
- Client Ingestion & Project Briefs
- Platform Core & Turbopack Optimization
- Header Navigation & Liquid Glass Experience
- Subsystem 101: ref_https
- Platform Core & Turbopack Optimization
- Subsystem 103: scripts_verify_server_action_boundaries
- Sales Intelligence & CRM Engine
- Editorial & Blog Architecture
- Subsystem 106: agents_mcp
- Subsystem 107: scripts_phase_3_execution_watcher
- Subsystem 108: scripts_verify_sprint_5_3
- Subsystem 109: src_app_admin_workspace_components_activityrowitem
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Client Ingestion & Project Briefs
- Subsystem 118: scripts_phase_1_execution_watcher
- Subsystem 119: scripts_phase_7_execution_watcher
- Editorial & Blog Architecture
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Sales Intelligence & CRM Engine
- Subsystem 128: scripts_cto_pr_auditor_watcher
- Subsystem 129: scripts_master_pr_auditor_watcher
- Subsystem 130: scripts_phase_1_remediation_watcher
- Subsystem 131: scripts_phase_2_remediation_watcher
- Subsystem 132: scripts_phase_3_remediation_watcher
- Subsystem 133: scripts_phase_4_execution_watcher
- Subsystem 134: scripts_phase_4_remediation_watcher
- Subsystem 135: scripts_phase_5_execution_watcher
- Subsystem 136: scripts_phase_5_remediation_watcher
- Subsystem 137: scripts_phase_6_execution_watcher
- Subsystem 138: scripts_phase_6_remediation_watcher
- Subsystem 139: scripts_redesign_execution_watcher

## God Nodes (most connected - your core abstractions)
1. `react` - 174 edges
2. `next` - 133 edges
3. `createClient()` - 86 edges
4. `CrmUserRole` - 48 edges
5. `ChatPod()` - 40 edges
6. `dotenv` - 32 edges
7. `LeadPriority` - 32 edges
8. `FunnelBucket` - 29 edges
9. `ClientHeader()` - 27 edges
10. `pg` - 26 edges

## Surprising Connections (you probably didn't know these)
- `seedSanityBlog()` --indirect_call--> `token()`  [INFERRED]
  scripts/seed-sanity-blog.ts → tests/unit/chatpod-contrast.test.ts
- `MockUser` --references--> `CrmUserRole`  [EXTRACTED]
  tests/actions/lead_activity_actions.test.ts → src/types/crm.ts
- `MockUser` --references--> `CrmUserRole`  [EXTRACTED]
  tests/actions/lead_inline_actions.test.ts → src/types/crm.ts
- `MockCaller` --references--> `CrmUserRole`  [EXTRACTED]
  tests/actions/stage_transition_actions.test.ts → src/types/crm.ts
- `runSprint21Verification()` --calls--> `sanitizeRedirectUrl()`  [EXTRACTED]
  scripts/verify-sprint-2-1.ts → src/app/lib/auth-redirect.ts

## Import Cycles
- 4-file cycle: `src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx -> src/app/admin/components/modals/index.ts -> src/app/admin/components/modals/LeadDetailModal.tsx -> src/app/admin/components/DossierDrawer/index.ts -> src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx`

## Communities (140 total, 32 thin omitted)

### Community 0 - "Sales Intelligence & CRM Engine"
Cohesion: 0.07
Nodes (64): logLeadActivityAction(), ActivityTimeline(), ActivityTimelineProps, getActivityTypeLabel(), renderActivityGlyph(), ClientDossierDrawer(), ClientDossierDrawerProps, LeadDossierData (+56 more)

### Community 1 - "Sales Intelligence & CRM Engine"
Cohesion: 0.05
Nodes (36): react, BackgroundVideoEngine(), BackgroundVideoEngineProps, ClientHomeExperience(), ClientHomeExperienceProps, CareersCutout(), CareersCutoutProps, ConnectCutout() (+28 more)

### Community 2 - "Sales Intelligence & CRM Engine"
Cohesion: 0.07
Nodes (43): zod@^4.3.6, zod, authenticateAndAuthorizeCaller(), sanitizeInputText(), transitionToConvertedAction(), transitionToLostAction(), transitionToNegotiationAction(), unlockConvertedLeadAction() (+35 more)

### Community 3 - "Sales Intelligence & CRM Engine"
Cohesion: 0.08
Nodes (40): runPhase1Verification(), updatePersonnelCoordinates(), AssignClientWorkLeadsFormData, assignClientWorkLeadsSchema, clientWorkDeliveryStages, clientWorkHealthEnum, clientWorkHealthStatuses, clientWorkMilestoneStatusEnum (+32 more)

### Community 4 - "Sales Intelligence & CRM Engine"
Cohesion: 0.09
Nodes (18): calculateContrastRatio(), hexToLuminance(), ROOT_DIR, getContrastRatio(), getLuminance(), getContrastRatio(), getLuminance(), getContrastRatio() (+10 more)

### Community 5 - "Header Navigation & Liquid Glass Experience"
Cohesion: 0.09
Nodes (36): DRAFT_RETENTION_DAYS, clearDraft(), CONSENT_KEY, DRAFT_KEY, DRAFT_MESSAGE_LIMIT, hasBeenNudged(), hasGrantedConsent(), isBlocks() (+28 more)

### Community 6 - "Sales Intelligence & CRM Engine"
Cohesion: 0.09
Nodes (35): CommercialDealRow, EditLeadModal(), EditLeadModalProps, formatCurrencyLive(), FunnelStatusOption, LeadDetailDto, LeadDetailResponse, TouchpointPayload (+27 more)

### Community 7 - "Editorial & Blog Architecture"
Cohesion: 0.07
Nodes (30): BlogCtaBanner(), CalloutValue, CalloutVariant, ChildSpan, CodeBlockValue, ComparisonTableValue, ExecutiveSummaryValue, FaqSectionValue (+22 more)

### Community 8 - "Curtain Stage & Motion Choreography"
Cohesion: 0.10
Nodes (27): gsap, @gsap/react, FloatingExploreButton(), Header(), menuItems, cards, HowWeWork(), titleLines (+19 more)

### Community 9 - "Sales Intelligence & CRM Engine"
Cohesion: 0.10
Nodes (32): authenticateCaller(), CallerIdentity, generateIcsCalendarInviteAction(), reactivateExpiredOnHoldLeadsAction(), sanitizeInputText(), scheduleFollowUpAction(), transitionToOnHoldAction(), RFC-5545 (+24 more)

### Community 10 - "Header Navigation & Liquid Glass Experience"
Cohesion: 0.11
Nodes (30): ChatPod(), isFilled(), lastTurnNumber(), matchOption(), menuForMode(), replyWeight(), scrollDepthPct(), timestamps() (+22 more)

### Community 11 - "Sales Intelligence & CRM Engine"
Cohesion: 0.13
Nodes (28): runSprint32Verification(), assertActiveAdmin(), setTeamUserStatus(), suspendTeamUser(), updateTeamUserRole(), updateUserPermissions(), CategoryUnderlineTabs(), CategoryUnderlineTabsProps (+20 more)

### Community 12 - "Sales Intelligence & CRM Engine"
Cohesion: 0.10
Nodes (32): buildPodPayload(), displayValue(), replyChannel(), reviewRows(), slotsToFields(), serviceInterestLabel(), FIELD_TO_SLOT, fromValidation() (+24 more)

### Community 13 - "Sales Intelligence & CRM Engine"
Cohesion: 0.05
Nodes (7): next, RoutePlaceholderProps, quickLinks, socialLinks, dynamic, siteUrl, metadata

### Community 14 - "Sales Intelligence & CRM Engine"
Cohesion: 0.12
Nodes (21): updateLeadStatusInlineAction(), OverdueBadge(), InlinePrioritySelect(), InlinePrioritySelectProps, PRIORITY_OPTIONS, hexToRgba(), InlineStatusOption, InlineStatusSelect() (+13 more)

### Community 15 - "Services & Interactive Accordions"
Cohesion: 0.10
Nodes (24): B2B_SERVICES, B2C_SERVICES, ServiceCategory, ServiceItem, ACCORDION_CARDS, ALL_DOCS, B2B_SERVICE_DETAILS, B2C_SERVICE_DETAILS (+16 more)

### Community 16 - "Sales Intelligence & CRM Engine"
Cohesion: 0.12
Nodes (34): buildIndex(), familyRoot(), fuzzyScore(), isAuthoredName(), keywordScore(), namedOwners(), rank(), typoStems() (+26 more)

### Community 17 - "Client Ingestion & Project Briefs"
Cohesion: 0.12
Nodes (26): @sanity/icons, ProjectForm(), SERVICE_ICONS, Step1Props, Step1Services(), Step2Business(), Step2Props, Step3Details() (+18 more)

### Community 18 - "Client Ingestion & Project Briefs"
Cohesion: 0.14
Nodes (32): SHORT_BRIEF_SLOTS, SLOT_ORDER, SlotDefinition, SLOTS, advance(), blockingSlot(), canSubmit(), currentSlot() (+24 more)

### Community 19 - "Editorial & Blog Architecture"
Cohesion: 0.09
Nodes (28): ALL_SERVICES_HREF, FAQ_HREF, PERSISTENT_MENU, SERVICE_ALIASES, STUDIO, asChip, buildIntentTable(), FALLBACK_REPLIES (+20 more)

### Community 20 - "Editorial & Blog Architecture"
Cohesion: 0.08
Nodes (32): eslintConfig, browserslist, devDependencies, @axe-core/playwright@^4.14.0, dotenv@^18.0.8, eslint@^9, eslint-config-next@16.1.6, @faker-js/faker@^10.6.0 (+24 more)

### Community 21 - "Curtain Stage & Motion Choreography"
Cohesion: 0.11
Nodes (23): @sanity/image-url, ReelModal(), ReelModalProps, ClientDisplayWork, WorksCurtain(), WorksCurtainProps, WorksSection(), SanityWork (+15 more)

### Community 22 - "Sales Intelligence & CRM Engine"
Cohesion: 0.10
Nodes (23): adminResetPersonnelPassword(), adminRevokePersonnelSessions(), generateSecureTemporaryPassword(), getPersonnelProfile(), SuspendUserModalProps, ExecutiveMasthead(), ExecutiveMastheadProps, PersonnelAuditTimeline() (+15 more)

### Community 23 - "Sales Intelligence & CRM Engine"
Cohesion: 0.10
Nodes (15): dotenv, pg, executeAs(), runSprint13Verification(), TEST_USERS, TestUser, clearSessionClaims(), runVerification() (+7 more)

### Community 24 - "Sales Intelligence & CRM Engine"
Cohesion: 0.12
Nodes (22): authenticateManagerCaller(), batchReassignOverdueLeadsAction(), getManagerWorkloadDataAction(), ManagerWorkloadData, OverdueLeadSummary, RepWorkloadTelemetry, sanitizeInputText(), WorkloadActionResult (+14 more)

### Community 25 - "Subsystem 25: src_app_chat_pod_engine_context"
Cohesion: 0.14
Nodes (29): CARDINALS, collapse(), DEPTH_PHRASES, exhausted(), FollowUp, followUp(), handOver(), nothingNumbered() (+21 more)

### Community 26 - "Header Navigation & Liquid Glass Experience"
Cohesion: 0.15
Nodes (26): nextConfig, securityHeaders, assert(), runSprint22Verification(), loginAction(), checkRateLimit(), clearAllRateLimits(), LOCKOUT_DURATION_MS (+18 more)

### Community 27 - "Editorial & Blog Architecture"
Cohesion: 0.09
Nodes (25): collisions, DEFAULT_CASES, { index, duplicates }, SEQUENCES, sources, kb, sources, getKnowledgeBase() (+17 more)

### Community 28 - "Sales Intelligence & CRM Engine"
Cohesion: 0.08
Nodes (29): assertActiveAdmin(), assertActiveStaffManager(), executeLeadReassignment(), getRepDealInventory(), LeadReassignmentWizardModalProps, ActiveDealSummary, ActivityActor, AtomicReassignmentResult (+21 more)

### Community 29 - "Editorial & Blog Architecture"
Cohesion: 0.12
Nodes (24): authoredReadingMinutes(), BlogListingClient(), BlogListingClientProps, fallbackInitial(), formatDate(), latestPublishedAt(), lqipFor(), pad2() (+16 more)

### Community 30 - "Sales Intelligence & CRM Engine"
Cohesion: 0.10
Nodes (24): calculatePercentiles(), LatencyDistribution, LoadBenchmarkMetrics, LoadBenchmarkOptions, main(), runLoadBenchmark(), CHANNELS, cleanSyntheticLeads() (+16 more)

### Community 31 - "Sales Intelligence & CRM Engine"
Cohesion: 0.14
Nodes (23): assert(), client, runSprint51Verification(), assert(), client, runSprint52Verification(), getPgPool(), POST() (+15 more)

### Community 32 - "Subsystem 32: src_app_chat_pod_engine_match"
Cohesion: 0.13
Nodes (26): ACCEPT_MARGIN, ACCEPT_THRESHOLD, AliasEntry, ALWAYS_RESOLVABLE, Candidate, CONTINUITY_PRIOR, decide(), DISAMBIGUATION_WIDTH (+18 more)

### Community 33 - "Subsystem 33: agents_skills_antislop_human_contrast_check"
Cohesion: 0.13
Nodes (18): contrast_ratio(), linearize(), luminance(), main(), parse_hex(), parse_pairing(), parse_reference_rows(), reference_doc_path() (+10 more)

### Community 34 - "Editorial & Blog Architecture"
Cohesion: 0.09
Nodes (24): AnyPortableBlock, BlockSpan, CalloutBlock, CodeBlock, ComparisonMatrix, ComparisonMatrixRow, EmpiricalBenchmark, FaqItem (+16 more)

### Community 35 - "Sales Intelligence & CRM Engine"
Cohesion: 0.13
Nodes (16): BucketCounts, BucketTabConfig, BucketTabId, FilterActionBar(), FilterActionBarProps, FilterDropdownOption, PRIORITY_OPTIONS, isLeadOverdue() (+8 more)

### Community 36 - "Editorial & Blog Architecture"
Cohesion: 0.12
Nodes (20): CareersListingClient(), CareersListingClientProps, CareersPage(), metadata, revalidate, SITE_URL, JobDetailClient(), JobDetailClientProps (+12 more)

### Community 37 - "Subsystem 37: tests_e2e_chatpod_spec"
Cohesion: 0.16
Nodes (25): actions(), answerTurn(), ask(), atTheBlank(), atTheNameBlank(), chipsAtRest(), composer(), FREE_TEXT (+17 more)

### Community 38 - "Client Ingestion & Project Briefs"
Cohesion: 0.23
Nodes (15): assert(), runVerification(), KpiCard(), KpiCardProps, extractKpiMetrics(), formatFullCurrency(), formatKpiCurrency(), formatSyncTimestamp() (+7 more)

### Community 39 - "Sales Intelligence & CRM Engine"
Cohesion: 0.15
Nodes (18): submitContactInquiry(), InquiryComposer(), TRACKS, DeduplicationAction, evaluateLeadDeduplication(), ExistingLeadRecord, IncomingInquiryPayload, DispatchAlertResult (+10 more)

### Community 40 - "Curtain Stage & Motion Choreography"
Cohesion: 0.14
Nodes (16): BRAND_STATEMENTS, ClientHeaderProps, HEADER_DISCIPLINES, HEADER_SECTORS, TICKER_DISCIPLINES, TICKER_SECTORS, DEFAULT_STAGE_WORDS, KineticStage() (+8 more)

### Community 41 - "Client Ingestion & Project Briefs"
Cohesion: 0.17
Nodes (17): assertAdminRole(), assertManagerOrAdminRole(), CallerIdentity, getAgencySettingsAction(), simulateInboundBriefAction(), updateAgencySettingsAction(), InboundSubmissionItem, IngestionActivityItem (+9 more)

### Community 42 - "Database Schema & Security Layer"
Cohesion: 0.09
Nodes (23): dependencies, gsap@^3.14.2, @gsap/react@^2.1.2, lenis@^1.3.17, next@16.1.6, next-sanity@^12.1.0, pg@^8.23.1, react@19.2.3 (+15 more)

### Community 43 - "Editorial & Blog Architecture"
Cohesion: 0.18
Nodes (11): sanity, authorSchema, blockContentSchema, careerApplicationSchema, careerPostingSchema, categorySchema, companyProfileSubmissionSchema, faqItemSchema (+3 more)

### Community 44 - "Sales Intelligence & CRM Engine"
Cohesion: 0.17
Nodes (17): assignClientWorkDirectorsAction(), authenticateAndAuthorizeCaller(), updateClientWorkHealthAction(), updateClientWorkMilestoneAction(), updateClientWorkStageAction(), WorksActionResult, AdminWorksPage(), metadata (+9 more)

### Community 45 - "Client Ingestion & Project Briefs"
Cohesion: 0.14
Nodes (14): ActiveDealItem, CATEGORY_PILLS, CommercialDealsTable(), CommercialDealsTableProps, DEFAULT_DEALS, formatRupees(), getInitials(), DEFAULT_STAGES (+6 more)

### Community 46 - "Services & Interactive Accordions"
Cohesion: 0.12
Nodes (18): isServiceInterest(), SERVICE_INTEREST_OPTIONS, SERVICE_INTEREST_ROUTING, UNDECIDED_SERVICE, validateServiceInterests(), allowedServices(), chipsFrom(), LIMITS (+10 more)

### Community 47 - "Sales Intelligence & CRM Engine"
Cohesion: 0.20
Nodes (13): createTeamUser(), NavigationItem, AddTeamMemberModal(), AddTeamMemberModalProps, AddTeamMemberDrawer, AddTeamMemberDrawerProps, EnclaveTabItem, getInitialAllowedTabs() (+5 more)

### Community 48 - "Sales Intelligence & CRM Engine"
Cohesion: 0.13
Nodes (16): ExecutiveKpiGrid(), ExecutiveKpiGridProps, formatCurrency(), ActiveDealItem, ActivityFeedItem, CommercialDealsTableProps, ExecutiveDashboardKpis, ExecutiveKpiGridProps (+8 more)

### Community 49 - "Subsystem 49: src_app_admin_components_dashboard_executivemasthead"
Cohesion: 0.17
Nodes (16): ExecutiveMasthead(), ExecutiveMastheadProps, TIMEFRAME_OPTIONS, CadenceLabel, calculateMetricDelta(), DynamicRevenueSplinePoint, generateTimeframeSplinePoints(), resolveTimeframeBounds() (+8 more)

### Community 50 - "Sales Intelligence & CRM Engine"
Cohesion: 0.19
Nodes (12): AdminMobileDrawer(), AdminMobileDrawerProps, AdminSidebar(), AdminSidebarProps, AdminWorkspaceShellProps, isTabAuthorized(), NAVIGATION_GROUPS, NavigationGroup (+4 more)

### Community 51 - "Curtain Stage & Motion Choreography"
Cohesion: 0.14
Nodes (14): AboutSection(), getMetricCountStops(), metrics, renderMetricTitle(), renderServiceTitle(), services, ContactCtaSection(), Hero() (+6 more)

### Community 52 - "Platform Core & Turbopack Optimization"
Cohesion: 0.10
Nodes (11): DETERMINISTIC_SEED_IDENTITIES, OrchestratorConfig, SeedIdentity, TestOrchestrator, codeFilesToAudit, packageJson, playwrightConfigContent, requiredFiles (+3 more)

### Community 53 - "Sales Intelligence & CRM Engine"
Cohesion: 0.17
Nodes (15): getPersonnelDeals(), getTeamRoster(), CommercialVelocityScorecards(), CommercialVelocityScorecardsProps, BucketFilter, RepresentativeDealLedger(), RepresentativeDealLedgerProps, AdminTeamPage() (+7 more)

### Community 54 - "Editorial & Blog Architecture"
Cohesion: 0.20
Nodes (16): POST(), runtime, CompanyProfileModal(), CompanyProfileModalProps, triggerProfileDownload(), COMPANY_PROFILE_SUBMISSION_FIELD_ORDER, CompanyProfileSubmissionErrors, CompanyProfileSubmissionInput (+8 more)

### Community 55 - "Editorial & Blog Architecture"
Cohesion: 0.14
Nodes (14): gatherSources(), withTimeout(), revalidate, siteUrl, revalidate, siteUrl, SERVICE_DETAILS, categoriesQuery (+6 more)

### Community 56 - "Header Navigation & Liquid Glass Experience"
Cohesion: 0.19
Nodes (12): ClientHeader(), MonumentalFooter(), NAV_LINKS, metadata, PrivacyPage(), metadata, SecurityPage(), metadata (+4 more)

### Community 57 - "Platform Core & Turbopack Optimization"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 58 - "Sales Intelligence & CRM Engine"
Cohesion: 0.16
Nodes (13): AdminWorkspaceShell(), LeadUrlSync(), NewLeadDrawer, NewLeadDrawerProps, NewLeadModal(), NewLeadModalProps, AdminWorkspaceLayout(), dynamic (+5 more)

### Community 59 - "Database Schema & Security Layer"
Cohesion: 0.30
Nodes (10): RFC-3986, @supabase/ssr, runSprint21Verification(), EnvConfig, envSchema, getEnv(), validateEnv(), createClient() (+2 more)

### Community 60 - "Sales Intelligence & CRM Engine"
Cohesion: 0.14
Nodes (12): RFC-4122, logoutAction(), AdminBreadcrumbLabelUpdateDetail, AdminBreadcrumbs(), CrumbItem, LEAD_CODE_REGEX, ROUTE_NAME_MAP, SECTION_MAP (+4 more)

### Community 61 - "Client Ingestion & Project Briefs"
Cohesion: 0.23
Nodes (5): @playwright/test, RFC-5545, calculateContrastRatio(), calculateRelativeLuminance(), ensureAuthenticatedSession()

### Community 62 - "Subsystem 62: scripts_verify_sprint_7_2"
Cohesion: 0.12
Nodes (15): allSprintCode, assertions, dataGridScss, dataGridTsx, inlineActionsTs, inlinePriorityScss, inlinePriorityTsx, inlineStatusScss (+7 more)

### Community 63 - "Database Schema & Security Layer"
Cohesion: 0.19
Nodes (12): ChatPodBoundary(), ChatPod, ChatPodShell(), EXCLUDED_ROUTES, useMountPermitted(), KnowledgeBase, circularXX, graphik (+4 more)

### Community 64 - "Sales Intelligence & CRM Engine"
Cohesion: 0.20
Nodes (10): CommercialDirectoryTableProps, EditUserPermissionsModalProps, PersonnelActionMenu(), PersonnelActionMenuProps, formatRoleName(), PersonnelCard(), PersonnelCardProps, PersonnelCardGridProps (+2 more)

### Community 65 - "Subsystem 65: src_app_chat_pod_intake_review_reviewrow"
Cohesion: 0.21
Nodes (14): ReviewRow, SubmitOutcome, IntakeFlow, AnswerBlock, SlotId, Block(), isInternal(), MessageBubble() (+6 more)

### Community 66 - "Subsystem 66: src_app_components_smoothscrollprovider_smoothscrollprovider"
Cohesion: 0.26
Nodes (13): SmoothScrollProvider(), SmoothScrollProviderProps, acquireOverlayScrollLock(), announce(), holders, isOverlayScrollLocked(), listeners, lockViewport() (+5 more)

### Community 67 - "Header Navigation & Liquid Glass Experience"
Cohesion: 0.21
Nodes (13): googleapis@^171.4.0, googleapis, appendCompanyProfileSubmissionToGoogleSheet(), createSheetsClient(), ensureHeaderRow(), ensureSheetExists(), getGoogleSheetsConfig(), GOOGLE_SHEETS_HEADERS (+5 more)

### Community 68 - "Editorial & Blog Architecture"
Cohesion: 0.21
Nodes (7): next-sanity, checkRateLimit(), POST(), rateLimitMap, apiVersion, dataset, projectId

### Community 69 - "Subsystem 69: scripts_verify_sprint_9_1"
Cohesion: 0.13
Nodes (13): actionsContent, cronRouteContent, filesToAudit, migrationContent, onHoldModalContent, requiredFiles, ROOT_DIR, schedulerContent (+5 more)

### Community 70 - "Subsystem 70: scripts_verify_sprint_9_2"
Cohesion: 0.13
Nodes (13): badgeScss, badgeUtilsContent, dataGridContent, filesToAudit, mobileCardContent, modalContent, modalScss, pageContent (+5 more)

### Community 71 - "Sales Intelligence & CRM Engine"
Cohesion: 0.23
Nodes (9): LoginSchema, LogoutActionResult, resolveClientIp(), LoginForm(), AdminLoginPage(), metadata, GET(), sanitizeRedirectUrl() (+1 more)

### Community 72 - "Database Schema & Security Layer"
Cohesion: 0.25
Nodes (11): authenticateCallerAndAuthorize(), AvatarActionResult, extractStoragePathFromUrl(), removeUserAvatarAction(), updateUserAvatarAction(), AvatarUploadModal(), AvatarUploadModalProps, TargetMemberAvatarContext (+3 more)

### Community 73 - "Sales Intelligence & CRM Engine"
Cohesion: 0.19
Nodes (11): LeadsTableSkeleton(), DealsWorkspaceClient(), DealsWorkspaceClientProps, formatDealValue(), formatStageAge(), FunnelStatusItem, HydratedDealItem, SortField (+3 more)

### Community 74 - "Subsystem 74: package_scripts"
Cohesion: 0.14
Nodes (14): scripts, build, dev, dev:clean, dev:webpack, lint, start, test:a11y (+6 more)

### Community 75 - "Sales Intelligence & CRM Engine"
Cohesion: 0.23
Nodes (9): updateLeadInlineAction(), updateLeadPriorityInlineAction(), InlineMutationResultPayload, InlinePriorityInput, inlinePrioritySchema, InlineStatusInput, inlineStatusSchema, MockLead (+1 more)

### Community 76 - "Subsystem 76: src_app_admin_components_layout_adminrootclientprovider"
Cohesion: 0.21
Nodes (10): AdminRootClientProvider(), AdminRootClientProviderProps, adminButtonFont, adminMono, adminNumeric, adminSans, AdminRootLayout(), dynamic (+2 more)

### Community 77 - "Client Ingestion & Project Briefs"
Cohesion: 0.25
Nodes (10): AuditLogItem, SettingsWorkspaceClientProps, AgencySettings, agencySettingsSchema, CANONICAL_SERVICE_CATEGORIES, CanonicalServiceCategory, SimulateInboundBriefInput, simulateInboundBriefSchema (+2 more)

### Community 78 - "Client Ingestion & Project Briefs"
Cohesion: 0.24
Nodes (9): ContactHero(), StudioCards(), StudioLocation, STUDIOS, WantToWorkWithUs(), ContactPage(), jsonLdGraph, metadata (+1 more)

### Community 79 - "Sales Intelligence & CRM Engine"
Cohesion: 0.28
Nodes (11): convertInboundLeadToDealAction(), createManualLead(), getActiveTeamAssignees(), isValidUuid(), updateLeadAssignee(), updateLeadDealParameters(), updateLeadDetailsAction(), normalizePhone() (+3 more)

### Community 80 - "Subsystem 80: tests_unit_chatpod_contrast_test"
Cohesion: 0.21
Nodes (10): dotOpacities(), inkOf(), keyframesBlock(), luminance(), pod, ratio(), resolveValue(), scss (+2 more)

### Community 81 - "Subsystem 81: scripts_verify_contrast_wcag"
Cohesion: 0.26
Nodes (9): ColorTokenPair, getContrastRatio(), getRelativeLuminance(), runContrastAudit(), assertAntiSlopRules(), assertFileExists(), GateResult, ROOT_DIR (+1 more)

### Community 82 - "Sales Intelligence & CRM Engine"
Cohesion: 0.23
Nodes (8): assert(), runVerification(), dynamic, GET(), runtime, KpiQueryInput, kpiQuerySchema, KpiApiResponseEnvelope

### Community 83 - "Sales Intelligence & CRM Engine"
Cohesion: 0.17
Nodes (10): assertions, filterBarScss, filterBarTsx, leadsPageTsx, requiredFiles, ROOT_DIR, skeletonScss, skeletonTsx (+2 more)

### Community 84 - "Sales Intelligence & CRM Engine"
Cohesion: 0.23
Nodes (9): getLeadActivitiesAction(), DeduplicationDecision, LeadActivityInput, leadActivityInputSchema, LeadActivityItem, LeadActionResult, LeadActivityType, MockLead (+1 more)

### Community 85 - "Sales Intelligence & CRM Engine"
Cohesion: 0.27
Nodes (8): clearLeadFollowUp(), formatCurrency(), formatDate(), TaskCard(), TaskCardProps, TaskLeadItem, AdminTasksPage(), metadata

### Community 86 - "Subsystem 86: ref_node_child_process"
Cohesion: 0.18
Nodes (8): actionsContent, convertedModalContent, filesToAudit, lostModalContent, requiredFiles, ROOT_DIR, scssContent, testSuites

### Community 87 - "Subsystem 87: scripts_verify_sprint_8_2"
Cohesion: 0.18
Nodes (9): actionContent, composerContent, drawerContent, filesToAudit, requiredFiles, ROOT_DIR, scssContent, testFiles (+1 more)

### Community 88 - "Sales Intelligence & CRM Engine"
Cohesion: 0.25
Nodes (7): getLeadDetails(), DealDossierPage(), DealDossierPageProps, generateMetadata(), generateMetadata(), LeadDossierPage(), LeadDossierPageProps

### Community 89 - "Client Ingestion & Project Briefs"
Cohesion: 0.24
Nodes (8): formatLakhsCurrency(), generateMonotoneBezierPath(), PERIOD_OPTIONS, Point2D, RevenueDynamicsCard(), RevenueDynamicsCardProps, SIX_MONTH_DATA, MonthlyRevenueMetric

### Community 90 - "Kinetic Media & Video Pipeline"
Cohesion: 0.22
Nodes (8): __dirname, downloadFile(), __filename, processAll(), ROOT_DIR, TARGET_DIR, TEMP_DIR, VETTED_ASSETS

### Community 91 - "Database Schema & Security Layer"
Cohesion: 0.33
Nodes (3): runSprint31Verification(), createAdminClient(), resetAdminClientCache()

### Community 92 - "Sales Intelligence & CRM Engine"
Cohesion: 0.29
Nodes (6): runSprint42Verification(), LeadReassignmentFormData, leadReassignmentSchema, RepInventoryQueryInput, repInventoryQuerySchema, TeamAuditAction

### Community 93 - "Subsystem 93: scripts_verify_sprint_8_1"
Cohesion: 0.20
Nodes (8): dossierUtilsContent, drawerContent, filesToAudit, orgDossierContent, requiredFiles, ROOT_DIR, scssContent, testFiles

### Community 94 - "Sales Intelligence & CRM Engine"
Cohesion: 0.22
Nodes (7): crmErrorRate, FILTER_PARAMS, gridReadDuration, options, statusUpdateDuration, successfulOperations, timelineFetchDuration

### Community 95 - "Subsystem 95: src_app_components_initialloader_initialloader"
Cohesion: 0.33
Nodes (5): conceptWords, InitialLoader(), decodeImageElement(), preloadCriticalAssets(), preloadImageSource()

### Community 96 - "Subsystem 96: src_app_lib_avatar_schemas"
Cohesion: 0.33
Nodes (6): ALLOWED_AVATAR_MIME_TYPES, AllowedAvatarMimeType, MAX_AVATAR_RAW_BYTES, targetUserIdSchema, UpdateAvatarPayload, updateAvatarPayloadSchema

### Community 97 - "Editorial & Blog Architecture"
Cohesion: 0.25
Nodes (8): getAllServiceSlugs(), generateStaticParams(), revalidate, sitemap(), siteUrl, STATIC_RELEASE_DATE, sitemapPostsQuery, activeCareersQuery

### Community 98 - "Client Ingestion & Project Briefs"
Cohesion: 0.39
Nodes (5): resetTemporaryPassword(), metadata, ResetPasswordPage(), PasswordCriteria, ResetPasswordForm()

### Community 99 - "Platform Core & Turbopack Optimization"
Cohesion: 0.29
Nodes (6): ./tsconfig.json, compilerOptions, noEmit, skipLibCheck, extends, include

### Community 100 - "Header Navigation & Liquid Glass Experience"
Cohesion: 0.29
Nodes (6): CHAT_POD_PATH, CHAT_POD_SCSS_PATH, CLIENT_HEADER_PATH, COMPOSER_PATH, NAVIGATION_OVERLAY_PATH, PERSONA_HEADER_PATH

### Community 101 - "Subsystem 101: ref_https"
Cohesion: 0.40
Nodes (4): AVATAR_ASSIGNMENTS, AvatarMapping, downloadFile(), main()

### Community 102 - "Platform Core & Turbopack Optimization"
Cohesion: 0.33
Nodes (4): fs, path, ROOT_DIR, TARGET_DIR

### Community 103 - "Subsystem 103: scripts_verify_server_action_boundaries"
Cohesion: 0.33
Nodes (5): ACTIONS_DIR, APP_DIR, BoundaryViolation, ROOT_DIR, violations

### Community 104 - "Sales Intelligence & CRM Engine"
Cohesion: 0.47
Nodes (5): dynamic, GET(), isCronAuthorized(), POST(), runtime

### Community 105 - "Editorial & Blog Architecture"
Cohesion: 0.47
Nodes (5): ALLOWED_EXTENSIONS, checkRateLimit(), getClientIp(), POST(), rateLimitMap

### Community 106 - "Subsystem 106: agents_mcp"
Cohesion: 0.40
Nodes (4): figma, FIGMA_PERSONAL_ACCESS_TOKEN, npx, @smithery/figma-mcp

### Community 107 - "Subsystem 107: scripts_phase_3_execution_watcher"
Cohesion: 0.50
Nodes (3): fs, interval, path

## Knowledge Gaps
- **19 isolated node(s):** `npx`, `@smithery/figma-mcp`, `FIGMA_PERSONAL_ACCESS_TOKEN`, `RFC-3986`, `RFC-5545` (+14 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 897 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Sales Intelligence & CRM Engine` to `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Editorial & Blog Architecture`, `Curtain Stage & Motion Choreography`, `Sales Intelligence & CRM Engine`, `Header Navigation & Liquid Glass Experience`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Services & Interactive Accordions`, `Client Ingestion & Project Briefs`, `Client Ingestion & Project Briefs`, `Editorial & Blog Architecture`, `Curtain Stage & Motion Choreography`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Subsystem 25: src_app_chat_pod_engine_context`, `Editorial & Blog Architecture`, `Sales Intelligence & CRM Engine`, `Editorial & Blog Architecture`, `Client Ingestion & Project Briefs`, `Sales Intelligence & CRM Engine`, `Curtain Stage & Motion Choreography`, `Client Ingestion & Project Briefs`, `Database Schema & Security Layer`, `Sales Intelligence & CRM Engine`, `Client Ingestion & Project Briefs`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Subsystem 49: src_app_admin_components_dashboard_executivemasthead`, `Sales Intelligence & CRM Engine`, `Curtain Stage & Motion Choreography`, `Sales Intelligence & CRM Engine`, `Editorial & Blog Architecture`, `Header Navigation & Liquid Glass Experience`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Database Schema & Security Layer`, `Sales Intelligence & CRM Engine`, `Subsystem 65: src_app_chat_pod_intake_review_reviewrow`, `Subsystem 66: src_app_components_smoothscrollprovider_smoothscrollprovider`, `Sales Intelligence & CRM Engine`, `Database Schema & Security Layer`, `Sales Intelligence & CRM Engine`, `Subsystem 76: src_app_admin_components_layout_adminrootclientprovider`, `Client Ingestion & Project Briefs`, `Client Ingestion & Project Briefs`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Client Ingestion & Project Briefs`, `Subsystem 95: src_app_components_initialloader_initialloader`, `Client Ingestion & Project Briefs`, `Subsystem 109: src_app_admin_workspace_components_activityrowitem`, `Subsystem 120: src_app_admin_workspace_deals_id_loading`, `Subsystem 121: src_app_admin_workspace_team_id_loading`?**
  _High betweenness centrality (0.317) - this node is a cross-community bridge._
- **What connects `npx`, `@smithery/figma-mcp`, `FIGMA_PERSONAL_ACCESS_TOKEN` to the rest of the system?**
  _19 weakly-connected nodes found - possible missing edges._
- **Should `Sales Intelligence & CRM Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.07028112449799197 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Sales Intelligence & CRM Engine` to `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Editorial & Blog Architecture`, `Curtain Stage & Motion Choreography`, `Sales Intelligence & CRM Engine`, `Header Navigation & Liquid Glass Experience`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Services & Interactive Accordions`, `Client Ingestion & Project Briefs`, `Editorial & Blog Architecture`, `Curtain Stage & Motion Choreography`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Header Navigation & Liquid Glass Experience`, `Sales Intelligence & CRM Engine`, `Editorial & Blog Architecture`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Editorial & Blog Architecture`, `Client Ingestion & Project Briefs`, `Sales Intelligence & CRM Engine`, `Curtain Stage & Motion Choreography`, `Client Ingestion & Project Briefs`, `Database Schema & Security Layer`, `Sales Intelligence & CRM Engine`, `Client Ingestion & Project Briefs`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Subsystem 49: src_app_admin_components_dashboard_executivemasthead`, `Sales Intelligence & CRM Engine`, `Curtain Stage & Motion Choreography`, `Sales Intelligence & CRM Engine`, `Editorial & Blog Architecture`, `Editorial & Blog Architecture`, `Header Navigation & Liquid Glass Experience`, `Sales Intelligence & CRM Engine`, `Database Schema & Security Layer`, `Sales Intelligence & CRM Engine`, `Database Schema & Security Layer`, `Sales Intelligence & CRM Engine`, `Subsystem 65: src_app_chat_pod_intake_review_reviewrow`, `Subsystem 66: src_app_components_smoothscrollprovider_smoothscrollprovider`, `Editorial & Blog Architecture`, `Sales Intelligence & CRM Engine`, `Database Schema & Security Layer`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Subsystem 76: src_app_admin_components_layout_adminrootclientprovider`, `Client Ingestion & Project Briefs`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Sales Intelligence & CRM Engine`, `Editorial & Blog Architecture`, `Client Ingestion & Project Briefs`, `Sales Intelligence & CRM Engine`, `Editorial & Blog Architecture`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Should `Sales Intelligence & CRM Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.05144230769230769 - nodes in this community are weakly interconnected._
- **Why does `next-sanity` connect `Editorial & Blog Architecture` to `Editorial & Blog Architecture`, `Editorial & Blog Architecture`, `Editorial & Blog Architecture`, `Database Schema & Security Layer`, `Editorial & Blog Architecture`, `Curtain Stage & Motion Choreography`, `Editorial & Blog Architecture`, `Editorial & Blog Architecture`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `Sales Intelligence & CRM Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.0655367231638418 - nodes in this community are weakly interconnected._