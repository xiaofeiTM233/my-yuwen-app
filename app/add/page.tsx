'use client';

import WenyanwenForm from '../components/WenyanwenForm';

export default function AddPage() {
  const handleSubmit = async (data: any) => {
    const response = await fetch('/api/wenyanwen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  };

  return (
    <div>
      <WenyanwenForm onSubmit={handleSubmit} />
    </div>
  );
}
