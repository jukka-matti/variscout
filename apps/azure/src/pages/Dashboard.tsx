import React, { useEffect, useState } from 'react';
import { useStorage } from '../services/storage';

export const Dashboard: React.FC<{ onOpenProject: (id?: string) => void }> = ({
  onOpenProject,
}) => {
  const { syncStatus } = useStorage();
  const [projects] = useState([
    {
      id: '1',
      name: 'Q1 Diameter Analysis',
      modified: new Date().toLocaleDateString(),
      location: 'Team',
    },
    {
      id: '2',
      name: 'Machine A Capability',
      modified: new Date().toLocaleDateString(),
      location: 'Personal',
    },
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">Projects</h2>
        <div className="flex gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700`}>
            Sync Status: {syncStatus.status}
          </span>
          <button
            onClick={() => onOpenProject()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            New Project
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Modified</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map(project => (
              <tr key={project.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">{project.name}</td>
                <td className="px-6 py-4 text-gray-500">{project.modified}</td>
                <td className="px-6 py-4 text-gray-500">{project.location}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onOpenProject(project.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
