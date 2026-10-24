/**
 * @file page.tsx
 * @description Dedicated Personnel Profile & Performance Workspace route (/admin/team/[id]).
 *              Next.js 16 App Router Server Component with dynamic parameter resolution,
 *              session authentication, and commercial performance hydration.
 * @module app/admin/team/[id]/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { getPersonnelProfile } from '@/app/actions/team';
import { PersonnelProfileWorkspaceClient } from './components/PersonnelProfileWorkspaceClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;

  if (!id || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
    return {
      title: 'Personnel Profile | Marca Ubi Administration',
    };
  }

  const res = await getPersonnelProfile(id);
  if (!res.success || !res.data) {
    return {
      title: 'Personnel Not Found | Marca Ubi Administration',
    };
  }

  return {
    title: `${res.data.profile.full_name} — Personnel Dossier | Marca Ubi`,
    description: `Performance metrics, commercial velocity scorecards, and administrative security controls for ${res.data.profile.full_name}.`,
  };
}

export default async function PersonnelProfilePage(props: PageProps): Promise<React.ReactElement> {
  const { id } = await props.params;

  if (!id || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/admin/login');
  }

  const res = await getPersonnelProfile(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <PersonnelProfileWorkspaceClient
      initialPayload={res.data}
      currentUserId={user.id}
    />
  );
}
