'use client';

import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { InviteUserDialog } from './InviteUserDialog';

interface InviteUserButtonProps {
  companyId: string;
  companyName: string;
  onInviteSent?: () => void;
}

export function InviteUserButton({ companyId, companyName, onInviteSent }: InviteUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleInviteSent = () => {
    setIsOpen(false);
    onInviteSent?.();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-orange-300/50 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 px-2 py-1 text-xs font-bold text-white shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95"
        title="Invitar usuario"
      >
        <UserPlus className="h-3 w-3" />+
      </button>

      <InviteUserDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        companyId={companyId}
        companyName={companyName}
        onInviteSent={handleInviteSent}
      />
    </>
  );
}
