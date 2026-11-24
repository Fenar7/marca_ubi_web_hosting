'use client';

import { useState } from 'react';
import { InquiryTriage, ResolveInquiry } from '../components/InquiryActions';
import type { InquiryDetail, OwnerOption } from '../inquiryView';

export function DetailManagement({ detail, owners, canResolve }: {
  detail: InquiryDetail;
  owners: OwnerOption[];
  canResolve: boolean;
}) {
  const [notice, setNotice] = useState('');
  return (
    <>
      <InquiryTriage key={detail.updated_at} detail={detail} owners={owners} onSaved={() => setNotice('Inquiry updated.')} />
      {canResolve && !detail.has_link && detail.state !== 'closed' && <ResolveInquiry detail={detail} />}
      {notice && <p role="status">{notice}</p>}
    </>
  );
}
