"use client";
import { useState } from 'react';
import { saveSubmission } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function WorkspaceForm({ resumeId, userId, initialData }) {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (status) => {
    setLoading(true);
    const res = await saveSubmission({ userId, resumeId, formData, status });
    if (res.success) {
      alert(`Success: Status is now ${status}`);
      router.push(status === 'in_progress' ? '/in-progress' : '/submitted');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold">Full Name</label>
        <input 
          type="text" 
          value={formData.fullName || ''}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      
      <div>
        <label className="text-sm font-semibold">Experience (Years)</label>
        <input 
          type="number" 
          value={formData.exp || ''}
          onChange={(e) => setFormData({...formData, exp: e.target.value})}
          className="w-full border p-2 rounded mt-1 outline-none"
        />
      </div>

      <div className="flex flex-col gap-3 pt-6">
        <button 
          disabled={loading}
          onClick={() => handleSubmit('submitted')} 
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          {loading ? 'Processing...' : 'Submit to Admin'}
        </button>
        <button 
          disabled={loading}
          onClick={() => handleSubmit('in_progress')} 
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition"
        >
          Save as Draft
        </button>
      </div>
    </div>
  );
}