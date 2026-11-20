import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const StudentFeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const [courseRating, setCourseRating] = useState(5);
  const [trainerRating, setTrainerRating] = useState(5);
  const [facilityRating, setFacilityRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={`w-6 h-6 ${
              star <= value
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-200'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>Student Feedback & Course Review</span>
          <Sparkles className="w-5 h-5 text-indigo-500" />
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Your candid feedback helps us continuously improve our teaching methodology, curriculum, and lab infrastructure
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        {submitted ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Thank You For Your Feedback!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your evaluation has been submitted to the academic directorate. We appreciate your valuable insights.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition"
            >
              Submit Another Response
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                1. Course Curriculum & Practical Exercises
              </label>
              <p className="text-xs text-slate-500">How relevant and effective was the curriculum material?</p>
              <StarRating value={courseRating} onChange={setCourseRating} />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                2. Trainer Mentorship & Doubt Resolution
              </label>
              <p className="text-xs text-slate-500">How clearly were technical concepts explained by your trainer?</p>
              <StarRating value={trainerRating} onChange={setTrainerRating} />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                3. Lab Environment, Infrastructure & Utilities
              </label>
              <p className="text-xs text-slate-500">How satisfied are you with the systems, internet, and campus amenities?</p>
              <StarRating value={facilityRating} onChange={setFacilityRating} />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                4. Suggestions or Specific Observations
              </label>
              <textarea
                rows={4}
                placeholder="Share any specific suggestions, topics you would like more coverage on, or feedback for your trainer..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-xs flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
