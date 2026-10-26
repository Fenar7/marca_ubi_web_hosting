-- Seed Dataset: supabase/seed.sql
-- Module: Production Seed Engine & Realistic Enterprise Agency Pipeline
-- Author: Fenar7 <86710532+Fenar7@users.noreply.github.com>
-- Architectural Standard: Master PRD Section 15.4 (Sprint 1.4 Deliverable)

-- 1. Provision Agency Authentication Identities and Core Staff Profiles
-- Provisions 4 agency operational staff across all key CRM governance tiers:
-- 1 Admin, 1 Sales Manager, and 2 Sales Executives.
INSERT INTO auth.users (id, email)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@marcaubi.com'),
    ('00000000-0000-0000-0000-000000000002', 'manager@marcaubi.com'),
    ('00000000-0000-0000-0000-000000000003', 'exec1@marcaubi.com'),
    ('00000000-0000-0000-0000-000000000004', 'exec2@marcaubi.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role, job_title, status)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@marcaubi.com', 'Marc Founder', 'admin', 'Agency Director & Founder', 'active'),
    ('00000000-0000-0000-0000-000000000002', 'manager@marcaubi.com', 'Elena Vance', 'sales_manager', 'Head of Commercial Growth', 'active'),
    ('00000000-0000-0000-0000-000000000003', 'exec1@marcaubi.com', 'Tariq Al-Mansoor', 'sales_executive', 'Senior Account Closer', 'active'),
    ('00000000-0000-0000-0000-000000000004', 'exec2@marcaubi.com', 'Sophia Sterling', 'sales_executive', 'Strategic Partnerships Lead', 'active')
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    job_title = EXCLUDED.job_title,
    status = EXCLUDED.status;

-- 2. Reference Funnel Stages and Acquisition Channels
INSERT INTO public.lead_sources (id, name, color_code, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Website Form', '#ff6100', true),
    ('a0000000-0000-0000-0000-000000000002', 'WhatsApp Inbound', '#22c55e', true),
    ('a0000000-0000-0000-0000-000000000003', 'Direct Referral', '#3b82f6', true),
    ('a0000000-0000-0000-0000-000000000004', 'Founder / Executive Outreach', '#a855f7', true),
    ('a0000000-0000-0000-0000-000000000005', 'Cold Campaign', '#eab308', true)
ON CONFLICT (name) DO UPDATE SET
    color_code = EXCLUDED.color_code,
    is_active = EXCLUDED.is_active;

INSERT INTO public.funnel_statuses (id, name, bucket, color_code, sort_order, is_active)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'New', 'open', '#ffffff', 10, true),
    ('b0000000-0000-0000-0000-000000000002', 'Contacted', 'open', '#94a3b8', 20, true),
    ('b0000000-0000-0000-0000-000000000003', 'On Hold', 'open', '#f59e0b', 30, true),
    ('b0000000-0000-0000-0000-000000000004', 'Qualified', 'potential', '#38bdf8', 40, true),
    ('b0000000-0000-0000-0000-000000000005', 'Proposal Sent', 'potential', '#818cf8', 50, true),
    ('b0000000-0000-0000-0000-000000000006', 'Negotiation', 'potential', '#ff6100', 60, true),
    ('b0000000-0000-0000-0000-000000000007', 'Converted', 'converted', '#22c55e', 70, true),
    ('b0000000-0000-0000-0000-000000000008', 'Lost', 'lost', '#ef4444', 80, true)
ON CONFLICT (name) DO UPDATE SET
    bucket = EXCLUDED.bucket,
    color_code = EXCLUDED.color_code,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

-- 3. Realistic Enterprise Commercial Pipeline (50 Representative Accounts)
-- Populates 50 luxury accounts spanning UAE high-end developers, hospitality, and conglomerates.
-- Accurately distributes deals across the 4 commercial macro buckets (Open, Potential, Converted, Lost).
INSERT INTO public.leads (
    id, lead_id, name, company, email, phone, budget_bracket, preferred_channel, 
    service_category, priority, status_id, lead_source_id, assigned_to, expected_value, 
    next_follow_up, notes, created_at
) VALUES
-- New & Inbound Leads (Open Bucket)
('c0000000-0000-0000-0000-000000000001', 'LD-1001', 'Rashid Al-Maktoum', 'Emaar Hospitality Group', 'rashid@emaar.ae', '+971501234501', '$100k-$250k', 'Email', 'Web & Digital', 'High', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 185000.00, NOW() + INTERVAL '2 days', 'Inbound brief for global luxury resort digital experience redesign.', NOW() - INTERVAL '10 days'),
('c0000000-0000-0000-0000-000000000002', 'LD-1002', 'Farah Haddad', 'Damac Luxury Living', 'farah.h@damacgroup.com', '+971559876502', '$50k-$100k', 'Meeting', 'UI/UX Design', 'Medium', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 95000.00, NOW() + INTERVAL '1 day', 'Penthouse buyer digital portal and 3D architectural visualizer.', NOW() - INTERVAL '9 days'),
('c0000000-0000-0000-0000-000000000003', 'LD-1003', 'Alexander Wright', 'Majid Al Futtaim Lifestyle', 'alex.wright@maf.ae', '+971523456703', '$250k+', 'Phone', 'Full-Suite Advisory', 'High', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 320000.00, NOW() - INTERVAL '1 day', 'Omnichannel luxury retail customer journey overhaul. Overdue initial contact.', NOW() - INTERVAL '8 days'),
('c0000000-0000-0000-0000-000000000004', 'LD-1004', 'Noora Al-Kaabi', 'Aldar Properties PJSC', 'noora.k@aldar.com', '+971507654304', '$100k-$250k', 'WhatsApp', 'Branding', 'Medium', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 140000.00, NOW() + INTERVAL '3 days', 'Rebranding initiative for Saadiyat Island cultural district residences.', NOW() - INTERVAL '7 days'),
('c0000000-0000-0000-0000-000000000005', 'LD-1005', 'Jean-Luc Dubois', 'Chalhoub Group Luxury', 'jeanluc@chalhoub.com', '+971551122305', '$50k-$100k', 'Email', 'Web & Digital', 'Low', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', NULL, 75000.00, NULL, 'Unassigned inbound website inquiry for niche fragrance flagship web design.', NOW() - INTERVAL '6 days'),
('c0000000-0000-0000-0000-000000000006', 'LD-1006', 'Khadija Al-Nuaimi', 'Jumeirah Hotels & Resorts', 'khadija.n@jumeirah.com', '+971508899006', '$100k-$250k', 'Meeting', 'UI/UX Design', 'High', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 190000.00, NOW() - INTERVAL '2 days', 'VIP concierge member booking flow redesign. Overdue discovery call follow-up.', NOW() - INTERVAL '12 days'),
('c0000000-0000-0000-0000-000000000007', 'LD-1007', 'Marcus Sterling', 'Al Tayer Luxury Motors', 'msterling@altayer.com', '+971562233407', '$50k-$100k', 'Phone', 'Web & Digital', 'Medium', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 85000.00, NOW() + INTERVAL '4 days', 'Bespoke configurator experience for custom Ferrari and Aston Martin fleet.', NOW() - INTERVAL '11 days'),
('c0000000-0000-0000-0000-000000000008', 'LD-1008', 'Fatima Al-Marzouqi', 'Atlantis The Royal Residences', 'fatima.m@atlantistheroyal.com', '+971503344508', '$250k+', 'Meeting', 'Full-Suite Advisory', 'High', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 275000.00, NOW() + INTERVAL '1 day', 'Ultra-luxury immersive 3D digital penthouse presentation suite.', NOW() - INTERVAL '10 days'),
('c0000000-0000-0000-0000-000000000009', 'LD-1009', 'David Chen', 'Kerzner International', 'david.c@kerzner.com', '+971557788909', '$100k-$250k', 'WhatsApp', 'Branding', 'Medium', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 130000.00, NOW() + INTERVAL '5 days', 'Brand identity evolution for upcoming One&Only resort development.', NOW() - INTERVAL '8 days'),
('c0000000-0000-0000-0000-000000000010', 'LD-1010', 'Zayd Al-Ghurair', 'Dubai Holding Real Estate', 'zayd.g@dubaiholding.com', '+971509900110', '$250k+', 'Phone', 'Web & Digital', 'High', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 240000.00, NOW() + INTERVAL '14 days', 'On hold pending Q4 commercial budget reallocation.', NOW() - INTERVAL '20 days'),
('c0000000-0000-0000-0000-000000000011', 'LD-1011', 'Layla Bin Brek', 'Meraas Lifestyle Destinations', 'layla.b@meraas.ae', '+971561122311', '$50k-$100k', 'Email', 'UI/UX Design', 'Medium', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 80000.00, NOW() + INTERVAL '21 days', 'On hold until City Walk expansion launch in next fiscal quarter.', NOW() - INTERVAL '15 days'),

-- Qualified & Potential Pipeline Deals (Potential Bucket)
('c0000000-0000-0000-0000-000000000012', 'LD-1012', 'Omar Al-Futtaim', 'Al-Futtaim Automotive', 'omar.f@alfuttaim.com', '+971504455612', '$100k-$250k', 'Meeting', 'Mobile Apps', 'High', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 210000.00, NOW() + INTERVAL '2 days', 'Enterprise mobile app for private vehicle fleet servicing and telemetry.', NOW() - INTERVAL '14 days'),
('c0000000-0000-0000-0000-000000000013', 'LD-1013', 'Sara Al-Rostamani', 'Sobha Realty Luxury', 'sara.r@sobharealty.com', '+971553344513', '$100k-$250k', 'Email', 'Web & Digital', 'High', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 165000.00, NOW() - INTERVAL '3 days', 'Sobha Hartland 2 interactive web presentation. Overdue proposal briefing.', NOW() - INTERVAL '18 days'),
('c0000000-0000-0000-0000-000000000014', 'LD-1014', 'Christian Laurent', 'Bvlgari Resort & Residences Dubai', 'claurent@bulgarihotels.com', '+971526677814', '$100k-$250k', 'Phone', 'Branding', 'Medium', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 150000.00, NOW() + INTERVAL '3 days', 'Private island private marina member collateral and brand guidelines.', NOW() - INTERVAL '16 days'),
('c0000000-0000-0000-0000-000000000015', 'LD-1015', 'Tariq Bin Hendi', 'Omniyat Middle East', 'tariq.h@omniyat.com', '+971508822315', '$250k+', 'Meeting', 'Web & Digital', 'High', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 290000.00, NOW() + INTERVAL '1 day', 'The Lana Dorchester architectural showcase and ultra-luxury marketing portal.', NOW() - INTERVAL '15 days'),
('c0000000-0000-0000-0000-000000000016', 'LD-1016', 'Hessa Al-Sabah', 'Nakheel Waterfront Communities', 'hessa.s@nakheel.com', '+971554499016', '$100k-$250k', 'WhatsApp', 'UI/UX Design', 'Medium', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 175000.00, NOW() + INTERVAL '4 days', 'Palm Jebel Ali master community interactive zoning map and investor deck.', NOW() - INTERVAL '13 days'),
('c0000000-0000-0000-0000-000000000017', 'LD-1017', 'Arthur Pendelton', 'Dubai South Aviation District', 'apendelton@dubaisouth.ae', '+971501199817', '$100k-$250k', 'Email', 'Full-Suite Advisory', 'High', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 225000.00, NOW() + INTERVAL '2 days', 'Comprehensive proposal sent for private jet terminal passenger UX overhaul.', NOW() - INTERVAL '22 days'),
('c0000000-0000-0000-0000-000000000018', 'LD-1018', 'Nouf Al-Mazrouei', 'Museum of the Future Cultural', 'nouf.m@museumofthefuture.ae', '+971529988718', '$100k-$250k', 'Meeting', 'Web & Digital', 'High', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 195000.00, NOW() - INTERVAL '1 day', 'WebGL interactive exhibition preview. Overdue proposal feedback follow-up.', NOW() - INTERVAL '25 days'),
('c0000000-0000-0000-0000-000000000019', 'LD-1019', 'Sebastian Rossi', 'Cavalli Tower Residences', 'srossi@cavallitower.com', '+971563377819', '$50k-$100k', 'Phone', 'Branding', 'Medium', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 90000.00, NOW() + INTERVAL '5 days', 'Fashion-branded luxury architectural brochure and interactive micro-site.', NOW() - INTERVAL '21 days'),
('c0000000-0000-0000-0000-000000000020', 'LD-1020', 'Mona Al-Suwaidi', 'Address Hotels + Resorts', 'mona.s@addresshotels.com', '+971506644320', '$100k-$250k', 'WhatsApp', 'UI/UX Design', 'High', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 160000.00, NOW() + INTERVAL '3 days', 'Next-gen guest loyalty portal proposal delivered; awaiting committee review.', NOW() - INTERVAL '20 days'),
('c0000000-0000-0000-0000-000000000021', 'LD-1021', 'Kareem Mansour', 'DIFC Innovation Hub', 'kareem.m@difc.ae', '+971558833221', '$100k-$250k', 'Meeting', 'Web & Digital', 'High', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 215000.00, NOW() + INTERVAL '1 day', 'Fintech startup accelerator community portal; proposal under review.', NOW() - INTERVAL '19 days'),
('c0000000-0000-0000-0000-000000000022', 'LD-1022', 'Elena Rostova', 'Nikki Beach Resort & Spa', 'erostova@nikkibeach.com', '+971521199422', '$50k-$100k', 'Email', 'Branding', 'Low', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 70000.00, NOW() + INTERVAL '6 days', 'Summer VIP membership brochure and branded mobile landing page.', NOW() - INTERVAL '17 days'),
('c0000000-0000-0000-0000-000000000023', 'LD-1023', 'Faisal Al-Qasimi', 'Abu Dhabi Global Market (ADGM)', 'faisal.q@adgm.com', '+971507711223', '$250k+', 'Meeting', 'Full-Suite Advisory', 'High', 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 310000.00, NOW() + INTERVAL '1 day', 'Final commercial negotiations on enterprise digital governance architecture.', NOW() - INTERVAL '30 days'),
('c0000000-0000-0000-0000-000000000024', 'LD-1024', 'Amira Al-Balooshi', 'Masdar Clean Energy Future', 'amira.b@masdar.ae', '+971556622324', '$100k-$250k', 'Phone', 'Web & Digital', 'High', 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 180000.00, NOW() - INTERVAL '2 days', 'Global climate tech summit landing experience. Overdue SLA contract signing call.', NOW() - INTERVAL '28 days'),
('c0000000-0000-0000-0000-000000000025', 'LD-1025', 'Maximilian Bauer', 'Etihad Airways First Class Suites', 'mbauer@etihad.ae', '+971509933425', '$250k+', 'Meeting', 'UI/UX Design', 'High', 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 285000.00, NOW() + INTERVAL '2 days', 'Contract scope agreement on bespoke Residence booking touchpoint.', NOW() - INTERVAL '27 days'),
('c0000000-0000-0000-0000-000000000026', 'LD-1026', 'Hind Al-Falasi', 'Dubai Chambers International', 'hind.f@dubaichambers.com', '+971564411926', '$100k-$250k', 'WhatsApp', 'Mobile Apps', 'Medium', 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 145000.00, NOW() + INTERVAL '4 days', 'Bilateral trade delegation networking portal. Reviewing revised legal clauses.', NOW() - INTERVAL '24 days'),
('c0000000-0000-0000-0000-000000000027', 'LD-1027', 'Vikram Singhania', 'Gargash Luxury Automotives', 'vsinghania@gargash.ae', '+971503388727', '$100k-$250k', 'Email', 'Web & Digital', 'High', 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 170000.00, NOW() + INTERVAL '3 days', 'Mercedes-Maybach VIP online reservation atelier. Reconciling payment milestones.', NOW() - INTERVAL '26 days'),

-- Converted Deals (Converted Revenue Bucket)
('c0000000-0000-0000-0000-000000000028', 'LD-1028', 'Nasser Al-Thani', 'Royal Atlantis Luxury Penthouses', 'nasser.t@atlantisresidences.com', '+971501122828', '$250k+', 'Meeting', 'Web & Digital', 'High', 'b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 290000.00, NULL, 'Deal won! Signed master service agreement for 3D digital sales gallery.', NOW() - INTERVAL '40 days'),
('c0000000-0000-0000-0000-000000000029', 'LD-1029', 'Zahra Al-Husseini', 'Al Habtoor Polo Resort & Club', 'zahra.h@habtoorpolo.com', '+971557711429', '$50k-$100k', 'Phone', 'Branding', 'Medium', 'b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 95000.00, NULL, 'Deal won! Brand identity refresh and commemorative tournament microsite.', NOW() - INTERVAL '35 days'),
('c0000000-0000-0000-0000-000000000030', 'LD-1030', 'Rizwan Sajan', 'Danube Properties Luxury Collection', 'rsajan@danubeproperties.com', '+971524499830', '$100k-$250k', 'Email', 'Web & Digital', 'High', 'b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 180000.00, NULL, 'Deal won! Oceanz tower digital showroom and interactive 3D floor plan explorer.', NOW() - INTERVAL '45 days'),
('c0000000-0000-0000-0000-000000000031', 'LD-1031', 'Joseph Thomas', 'Ellington Properties Art Architecture', 'jthomas@ellington.ae', '+971508811231', '$100k-$250k', 'Meeting', 'UI/UX Design', 'High', 'b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 160000.00, NULL, 'Deal won! Design-centric residential property discovery app for boutique buyers.', NOW() - INTERVAL '32 days'),
('c0000000-0000-0000-0000-000000000032', 'LD-1032', 'Rahim Sterling', 'Select Group Waterfront Living', 'rsterling@select-group.ae', '+971561177632', '$100k-$250k', 'WhatsApp', 'Web & Digital', 'Medium', 'b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 175000.00, NULL, 'Deal won! Peninsula master community marketing ecosystem.', NOW() - INTERVAL '50 days'),
('c0000000-0000-0000-0000-000000000033', 'LD-1033', 'Muhammad Binghatti', 'Binghatti Luxury Hyper-Towers', 'mbinghatti@binghatti.com', '+971509988233', '$250k+', 'Meeting', 'Full-Suite Advisory', 'High', 'b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 350000.00, NULL, 'Deal won! Bugatti and Jacob & Co branded residences digital experience suite.', NOW() - INTERVAL '60 days'),
('c0000000-0000-0000-0000-000000000034', 'LD-1034', 'Mirwais Azizi', 'Azizi Developments Venice', 'mazizi@azizidevelopments.com', '+971553311934', '$100k-$250k', 'Email', 'Web & Digital', 'Medium', 'b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 205000.00, NULL, 'Deal won! Azizi Venice crystal lagoon experiential interactive master map.', NOW() - INTERVAL '38 days'),
('c0000000-0000-0000-0000-000000000035', 'LD-1035', 'Hussain Sajwani', 'DAMAC Lagoons Mediterranean', 'hsajwani@damacgroup.com', '+971504488235', '$250k+', 'Phone', 'Branding', 'High', 'b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 270000.00, NULL, 'Deal won! European cluster visual branding system and multi-channel campaign.', NOW() - INTERVAL '55 days'),

-- Lost Accounts (Lost Bucket)
('c0000000-0000-0000-0000-000000000036', 'LD-1036', 'Giorgio Armani Group', 'Armani Hotel & Residences Dubai', 'dxb@armanihotels.com', '+971502244936', '$100k-$250k', 'Meeting', 'UI/UX Design', 'High', 'b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 160000.00, NULL, 'Lost: Selected incumbent Milan agency due to global brand corporate mandate.', NOW() - INTERVAL '48 days'),
('c0000000-0000-0000-0000-000000000037', 'LD-1037', 'Pierre Hermé Luxury', 'Pierre Hermé Middle East', 'pherme@luxuryfrench.ae', '+971556633837', '$25k-$50k', 'Email', 'Branding', 'Low', 'b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 45000.00, NULL, 'Lost: Budget mismatch. Client expected boutique retainer under $3,000/mo.', NOW() - INTERVAL '30 days'),
('c0000000-0000-0000-0000-000000000038', 'LD-1038', 'Klaus Fischer', 'Mandarin Oriental Jumeira', 'kfischer@mohg.com', '+971529944138', '$50k-$100k', 'Phone', 'Web & Digital', 'Medium', 'b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 85000.00, NULL, 'Lost: Project frozen due to leadership transition in regional hospitality division.', NOW() - INTERVAL '42 days'),
('c0000000-0000-0000-0000-000000000039', 'LD-1039', 'Gianluca Vacchi Hospitality', 'Sunset Hospitality Group', 'gvacchi@sunsethospitality.com', '+971507722839', '$100k-$250k', 'Meeting', 'Mobile Apps', 'High', 'b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 140000.00, NULL, 'Lost: Competitor underbid on timeline by committing to an unrealistic 4-week delivery.', NOW() - INTERVAL '36 days'),

-- Additional Inbound & Emerging Enterprise Briefs (Completing 50 Accounts)
('c0000000-0000-0000-0000-000000000040', 'LD-1040', 'Sultan Al-Dhaheri', 'Emirates SkyCargo Luxury Logistics', 'sultan.d@skycargo.com', '+971508844140', '$100k-$250k', 'Email', 'Web & Digital', 'Medium', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 135000.00, NOW() + INTERVAL '2 days', 'High-value art and luxury asset tracking portal design.', NOW() - INTERVAL '5 days'),
('c0000000-0000-0000-0000-000000000041', 'LD-1041', 'Elena Kostas', 'SLS Dubai Hotel & Residences', 'ekostas@slshotels.com', '+971553399041', '$50k-$100k', 'WhatsApp', 'Branding', 'Low', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 75000.00, NOW() + INTERVAL '4 days', 'Rooftop infinity lounge collateral and event ticketing app.', NOW() - INTERVAL '4 days'),
('c0000000-0000-0000-0000-000000000042', 'LD-1042', 'Dominic Al-Fayed', 'The Lana Dorchester Collection', 'dfayed@dorchestercollection.com', '+971526611342', '$250k+', 'Meeting', 'UI/UX Design', 'High', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 260000.00, NOW() - INTERVAL '1 day', 'Spa and wellness sanctuary private booking application. Overdue consultation review.', NOW() - INTERVAL '16 days'),
('c0000000-0000-0000-0000-000000000043', 'LD-1043', 'Ananya Patel', 'Five Luxe JBR Residences', 'ananya.p@fivehotelsandresorts.com', '+971501144843', '$100k-$250k', 'Phone', 'Web & Digital', 'High', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 190000.00, NOW() + INTERVAL '3 days', 'Lifestyle hotel interactive booking experience; proposal dispatched.', NOW() - INTERVAL '18 days'),
('c0000000-0000-0000-0000-000000000044', 'LD-1044', 'Tariq Al-Hashemi', 'Ennismore Lifestyle Collective', 'tariq.h@ennismore.com', '+971569922144', '$100k-$250k', 'Meeting', 'Full-Suite Advisory', 'High', 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 230000.00, NOW() + INTERVAL '1 day', 'Finalizing commercial scope for 25hours Hotel Middle East brand hub.', NOW() - INTERVAL '29 days'),
('c0000000-0000-0000-0000-000000000045', 'LD-1045', 'Paul Evans', 'Solutions Leisure Group', 'pevans@solutions-leisure.com', '+971507799345', '$50k-$100k', 'Email', 'Branding', 'Medium', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 85000.00, NOW() + INTERVAL '5 days', 'Beach club concept brand book and multi-sensory website teaser.', NOW() - INTERVAL '7 days'),
('c0000000-0000-0000-0000-000000000046', 'LD-1046', 'Malak Al-Khatib', 'Alserkal Avenue Cultural Foundation', 'malak.k@alserkal.ae', '+971554411846', '$50k-$100k', 'Phone', 'Web & Digital', 'Low', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 65000.00, NOW() + INTERVAL '7 days', 'Interactive virtual art gallery tour and residency portal.', NOW() - INTERVAL '3 days'),
('c0000000-0000-0000-0000-000000000047', 'LD-1047', 'Khadim Al-Nuaimi', 'Dubai Design District (d3)', 'khadim.n@dubaidesigndistrict.com', '+971521188347', '$100k-$250k', 'Meeting', 'UI/UX Design', 'Medium', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 120000.00, NOW() + INTERVAL '2 days', 'Dubai Fashion Week designer portfolio submission portal.', NOW() - INTERVAL '11 days'),
('c0000000-0000-0000-0000-000000000048', 'LD-1048', 'Nadia Mansour', 'Symphony Style Hotel & Spa', 'nadia.m@symphonystyle.com', '+971509922048', '$50k-$100k', 'WhatsApp', 'Branding', 'Low', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 70000.00, NOW() + INTERVAL '3 days', 'Luxury bridal salon landing page and appointment booking wizard.', NOW() - INTERVAL '6 days'),
('c0000000-0000-0000-0000-000000000049', 'LD-1049', 'Siddharth Varma', 'Raffles The Palm Dubai Ultra-Luxury', 'svarma@raffles.com', '+971563388149', '$100k-$250k', 'Meeting', 'Web & Digital', 'High', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 210000.00, NOW() - INTERVAL '3 days', 'Palatial ballroom and bespoke wedding inquiry visualizer. Overdue RFP follow-up.', NOW() - INTERVAL '21 days'),
('c0000000-0000-0000-0000-000000000050', 'LD-1050', 'Faisal Al-Hammadi', 'Dubai Opera Grand Cultural Theatre', 'faisal.h@dubaiopera.com', '+971506633950', '$100k-$250k', 'Phone', 'Full-Suite Advisory', 'High', 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 250000.00, NOW() + INTERVAL '1 day', 'Contract finalization for VIP Box ticketing and member privileges portal.', NOW() - INTERVAL '31 days')
ON CONFLICT (id) DO UPDATE SET
    lead_id = EXCLUDED.lead_id,
    name = EXCLUDED.name,
    company = EXCLUDED.company,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    budget_bracket = EXCLUDED.budget_bracket,
    preferred_channel = EXCLUDED.preferred_channel,
    service_category = EXCLUDED.service_category,
    priority = EXCLUDED.priority,
    status_id = EXCLUDED.status_id,
    lead_source_id = EXCLUDED.lead_source_id,
    assigned_to = EXCLUDED.assigned_to,
    expected_value = EXCLUDED.expected_value,
    next_follow_up = EXCLUDED.next_follow_up,
    notes = EXCLUDED.notes;

-- 4. Advance Sequence Generator Beyond Seeded Identifiers
-- Ensures new inbound leads start at LD-1051 without sequence conflicts.
SELECT setval('public.lead_code_seq', 1050, true);

-- 5. Chronological Omnichannel Activity Timeline Seeds
-- Populates authentic qualification notes, call logs, and stage progression history.
-- Explicit deterministic primary keys ensure true idempotency upon repeated seed execution.
INSERT INTO public.lead_activities (id, lead_id, actor_id, activity_type, description, metadata, created_at)
VALUES
-- Discovery Touchpoints on High-Value Opportunities
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'note_added', 'Reviewed inbound web brief. Architecture requires bespoke WebGL resort tour.', '{"source": "web_brief"}'::jsonb, NOW() - INTERVAL '9 days'),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'call_logged', 'Initial discovery call with VP of Digital Marketing. Established $320k scope.', '{"duration_minutes": 35, "outcome": "qualified"}'::jsonb, NOW() - INTERVAL '7 days'),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'meeting_notes', 'Meeting held at Jumeirah corporate HQ. Outlined guest journey friction points.', '{"attendees": 4, "location": "Dubai"}'::jsonb, NOW() - INTERVAL '10 days'),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'whatsapp_sent', 'Sent executive lookbook and 3D architectural showroom case study via WhatsApp.', '{"status": "delivered"}'::jsonb, NOW() - INTERVAL '8 days'),

-- Proposal Dispatches & Stage Transitions
('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000004', 'status_change', 'Advanced deal stage to Proposal Sent. Comprehensive commercial scope delivered.', '{"from_stage": "Qualified", "to_stage": "Proposal Sent"}'::jsonb, NOW() - INTERVAL '20 days'),
('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000003', 'call_logged', 'Follow-up call on proposal terms. Client requested breakdown of WebGL shader optimizations.', '{"duration_minutes": 22, "outcome": "interested"}'::jsonb, NOW() - INTERVAL '15 days'),
('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000004', 'status_change', 'Moved to Negotiation after legal review approved master terms.', '{"from_stage": "Proposal Sent", "to_stage": "Negotiation"}'::jsonb, NOW() - INTERVAL '5 days'),
('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000004', 'meeting_notes', 'Executive board presentation for Etihad Residence booking flow. 100% stakeholder buy-in.', '{"location": "Abu Dhabi"}'::jsonb, NOW() - INTERVAL '8 days'),

-- Converted Deal Audit Logs
('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000003', 'status_change', 'Deal won! Received countersigned master service agreement and initial deposit invoice.', '{"revenue": 290000.00, "status": "converted"}'::jsonb, NOW() - INTERVAL '40 days'),
('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000003', 'status_change', 'Deal won! Contract signed for Oceanz luxury tower digital showroom.', '{"revenue": 180000.00, "status": "converted"}'::jsonb, NOW() - INTERVAL '45 days'),
('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000004', 'status_change', 'Deal won! Binghatti Hyper-Towers bespoke digital ecosystem engagement signed.', '{"revenue": 350000.00, "status": "converted"}'::jsonb, NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;
