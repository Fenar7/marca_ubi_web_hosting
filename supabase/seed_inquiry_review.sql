-- Run explicitly after the inquiry migrations. No external ingestion or notifications.
WITH examples(n, origin, channel, name, company, service, summary, age, state) AS (
    VALUES
        (1, 'contact', NULL, 'Mira Vale', 'Paper Finch Studio', 'Branding', 'We are opening a bookshop and gallery in March. We need a visual identity, signage and a small set of launch templates. Could you recommend a discovery schedule and a phased estimate?', '2 hours', 'new'),
        (2, 'start_project', NULL, 'Dan North', 'Ceramic North', 'Web & Digital', 'Our ceramics studio needs a bilingual portfolio and a stockist directory. The current site is difficult to update, so we would like a manageable CMS and accessible product pages.', '5 hours', 'new'),
        (3, 'chat_pod', NULL, 'Imani Shaw', 'Stillwater Index', 'UI/UX Design', 'We are redesigning a quarterly editorial publication and need clearer navigation for its growing archive. We can share the current sitemap and reader feedback.', '8 hours', 'reviewed'),
        (4, 'manual', 'referral', 'Ari Rivers', 'Cinder Atlas', 'Mobile Apps', 'An existing client referred a community membership team. They want a discovery sprint focused on onboarding, membership verification and event check-in.', '14 hours', 'new'),
        (5, 'contact', NULL, 'Sana Reed', 'Room Eight Editions', 'Branding', 'Please send a proposal for naming and packaging for three small-batch products. We are targeting a summer launch and need a practical handoff for our print partner.', '1 day', 'reviewed'),
        (6, 'manual', 'phone', 'Perry Ellis', 'Moss Circuit', 'Full-Suite Advisory', 'The operations team called to discuss strategy and a customer portal. Their budget was postponed and the team requested we close the current inquiry.', '2 days', 'closed'),
        (7, 'start_project', NULL, 'Mira Vale', 'Paper Finch Studio', 'Web & Digital', 'Following up separately about an online events calendar and ticketing integration. This is a possible second phase after the bookshop identity work.', '3 days', 'new'),
        (8, 'chat_pod', NULL, 'Rhea Snow', 'Field Meridian', 'UI/UX Design', 'We have reporting prototypes and need usability testing across desktop and mobile. Please scope discovery, a facilitated prototype review and handoff recommendations.', '4 days', 'reviewed'),
        (9, 'manual', 'email', 'Oli Lane', 'Quiet Harbor Press', 'Other', 'A partner offered an editorial collaboration but later withdrew the proposal. The original request is retained for context.', '6 days', 'closed'),
        (10, 'contact', NULL, 'Ira Bell', NULL, 'Other', 'I would like to discuss a possible research collaboration. Can we arrange a short introductory call?', '7 days', 'new'),
        (11, 'start_project', NULL, 'Kit Stone', 'Trace Assembly', 'Web & Digital', 'We need to replace a legacy web catalogue. Please include a migration plan for a few hundred entries, a reusable case-study template and a content training session. We need to validate accessibility throughout, and we have a small team that can own content after launch.', '9 days', 'reviewed'),
        (12, 'manual', 'phone', 'Jo Hart', 'Olive Relay', 'Branding', 'Our team needs a refreshed identity ahead of a trade fair. The first priority is an updated wordmark and a signage system that works with the venue templates.', '11 days', 'new')
), fixture_rows AS (
    SELECT examples.*,
        md5('inquiries-redesign-20261124:inquiry:' || n)::uuid AS id,
        CASE WHEN n = 6 THEN NULL WHEN n IN (1, 7) THEN 'finch@seed.example.invalid'
            ELSE 'inquiry-' || n || '@seed.example.invalid' END AS email,
        CASE WHEN n IN (4, 6, 12) THEN '+120255501' || lpad(n::text, 2, '0') END AS phone,
        (SELECT id FROM public.profiles WHERE status = 'active' AND role = 'admin' ORDER BY id LIMIT 1) AS fixture_owner
    FROM examples
), inserted_leads AS (
    INSERT INTO public.leads (
        id, name, company, email, service_category, lead_source_id, status_id,
        source_detail, expected_value, brief_payload
    )
    SELECT md5('inquiries-redesign-20261124:lead:' || n)::uuid,
        name, company, email, service, 'a0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001', 'Temporary inquiry review', 0,
        jsonb_build_object('synthetic_benchmark', true, 'inquiry_test_batch', 'inquiries-redesign-20261124')
    FROM fixture_rows WHERE n IN (1, 3, 5)
    ON CONFLICT DO NOTHING
    RETURNING id
), inserted_inquiries AS (
    INSERT INTO public.inquiries (
        id, origin, original_channel, received_at, name, email, phone, company,
        service_category, summary, brief, state, close_reason, assigned_to, lead_id, outcome, test_batch
    )
    SELECT f.id, origin, channel, now() - age::interval, name, email, phone, company,
        service, summary,
        CASE WHEN n IN (2, 7, 11) THEN jsonb_build_object('timeline', 'Within the next quarter') ELSE '{}'::jsonb END,
        state, CASE WHEN state = 'closed' THEN 'The contact withdrew the request.' END,
        CASE WHEN n IN (1, 3, 5, 6, 8, 11) THEN fixture_owner END,
        linked.id, CASE WHEN linked.id IS NULL THEN 'needs_review' ELSE 'linked' END,
        'inquiries-redesign-20261124'
    FROM fixture_rows AS f
    LEFT JOIN LATERAL (
        SELECT lead.id FROM public.leads AS lead
        WHERE lead.id = md5('inquiries-redesign-20261124:lead:' || CASE WHEN f.n = 7 THEN 1 ELSE f.n END)::uuid
          AND lead.brief_payload->>'inquiry_test_batch' = 'inquiries-redesign-20261124'
        UNION ALL
        SELECT lead.id FROM inserted_leads AS lead
        WHERE lead.id = md5('inquiries-redesign-20261124:lead:' || CASE WHEN f.n = 7 THEN 1 ELSE f.n END)::uuid
    ) AS linked ON true
    ON CONFLICT (id) DO NOTHING
    RETURNING id, received_at, state
)
INSERT INTO public.inquiry_activity (inquiry_id, event_type, created_at)
SELECT id, 'received', received_at FROM inserted_inquiries
UNION ALL
SELECT id, 'triaged', received_at + interval '30 minutes' FROM inserted_inquiries WHERE state <> 'new';
