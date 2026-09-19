import { Construction } from 'lucide-react';

export default function AdminTestimonials() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-lg mx-auto">
      <div className="w-16 h-16 bg-[#F4F9FF] text-[#087FF5] rounded-full flex items-center justify-center mb-6 border border-[#087FF5]/20">
        <Construction size={32} />
      </div>
      <h1 className="text-2xl font-bold text-[#082B52] mb-3">Testimonials Module</h1>
      <p className="text-slate-500 mb-8 leading-relaxed">
        This module is currently under construction. In the next update, you will be able to add, edit, and manage customer testimonials directly from this interface to display on your homepage.
      </p>
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-sm text-left w-full text-slate-600">
        <h4 className="font-semibold text-slate-800 mb-2">Planned Features:</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Review moderation queue</li>
          <li>Rich text testimonial editor</li>
          <li>Customer avatar upload</li>
          <li>Rating system integration (1-5 stars)</li>
        </ul>
      </div>
    </div>
  );
}
