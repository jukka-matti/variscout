import React from 'react';

interface NoAccessRedirectProps {
  projectTitle: string;
}

/**
 * Rendered when an identified user is not a member of the project.
 * Per wedge spec §4: non-members see this message instead of the project detail.
 */
const NoAccessRedirect: React.FC<NoAccessRedirectProps> = ({ projectTitle }) => {
  return (
    <div role="alert" className="p-8 text-content">
      <h2 className="text-xl font-semibold mb-2">No access</h2>
      <p>
        You don&apos;t have access to &quot;{projectTitle}&quot;. Ask the project Lead for an
        invitation.
      </p>
    </div>
  );
};

export default NoAccessRedirect;
