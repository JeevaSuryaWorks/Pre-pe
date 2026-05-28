import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Search, Star, Trash2, ShieldAlert, Award, Calendar, ThumbsUp } from 'lucide-react';
import { BrandLoader } from '@/components/ui/BrandLoader';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface UserFeedback {
  id: string;
  user_id: string;
  email: string | null;
  rating: number;
  feedback_pills: string[];
  created_at: string;
}

export default function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [starFilter, setStarFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (err: any) {
      console.error('Error fetching feedbacks:', err);
      toast.error(err.message || 'Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
      const { error } = await supabase
        .from('user_feedbacks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Feedback entry deleted successfully!');
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete feedback');
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesStar = starFilter === 'all' || f.rating.toString() === starFilter;
    const matchesSearch = 
      (f.email || '').toLowerCase().includes(search.toLowerCase()) ||
      f.feedback_pills.some(p => p.toLowerCase().includes(search.toLowerCase()));
    return matchesStar && matchesSearch;
  });

  // Calculate metrics
  const totalCount = feedbacks.length;
  const avgRating = totalCount > 0 
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalCount).toFixed(1) 
    : '0.0';
  const fiveStarCount = feedbacks.filter(f => f.rating === 5).length;
  const positiveRatio = totalCount > 0 
    ? ((feedbacks.filter(f => f.rating >= 4).length / totalCount) * 100).toFixed(0) 
    : '0';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Heart className="w-8 h-8 text-[#046A38] fill-[#046A38]/10" />
            User Feedbacks
          </h1>
          <p className="text-slate-500 font-medium mt-1">Platform satisfaction and exit rating reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchFeedbacks}
            className="rounded-xl border-slate-200 font-bold text-slate-600 hover:text-[#046A38] hover:bg-emerald-50 transition-all"
            disabled={loading}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Feedbacks Card */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Feedbacks</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 leading-none">{totalCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Avg Rating Card */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#FFD100] to-amber-500" />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-[#FFD100] shrink-0">
              <Star className="w-6 h-6 fill-[#FFD100]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Star Rating</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 leading-none">{avgRating} / 5.0</h3>
            </div>
          </CardContent>
        </Card>

        {/* Positive Rating Card */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#046A38] to-emerald-500" />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#046A38] shrink-0">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Satisfied Users (4★+)</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 leading-none">{positiveRatio}%</h3>
            </div>
          </CardContent>
        </Card>

        {/* Five Star Card */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shrink-0">
              <Heart className="w-6 h-6 fill-purple-500/20" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perfect 5★ Reviews</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 leading-none">{fiveStarCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Table & Filters Card */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.03)] bg-white overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-slate-100 bg-white py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#046A38] transition-colors" />
              <Input 
                placeholder="Search email or feedback pills..." 
                className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus:ring-[#046A38]/10 focus:border-[#046A38] transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0">Rating:</span>
              {(['all', '5', '4', '3', '2', '1'] as const).map(star => (
                <Button
                  key={star}
                  variant={starFilter === star ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStarFilter(star)}
                  className={`rounded-xl px-4 h-11 font-bold transition-all ${
                    starFilter === star 
                      ? 'bg-[#046A38] hover:bg-[#03522b] text-white shadow-sm' 
                      : 'text-slate-500'
                  }`}
                >
                  {star === 'all' ? 'All' : `${star} ★`}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">User Account</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Star Rating</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Feedback Answers</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Submitted</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <BrandLoader size="md" />
                        <span className="text-xs font-bold tracking-widest uppercase">Loading feedback ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <ShieldAlert className="w-12 h-12 opacity-25 text-slate-400" />
                        <p className="font-bold tracking-widest uppercase text-xs">No feedback reports found matching criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/30 transition-colors group">
                      
                      {/* Email/Account */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{f.email || 'Anonymous'}</span>
                          <span className="text-[10px] text-slate-400 font-mono select-all truncate max-w-xs">{f.user_id}</span>
                        </div>
                      </td>

                      {/* Stars */}
                      <td className="p-4">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`w-4 h-4 ${
                                f.rating >= star 
                                  ? 'text-[#FFD100] fill-[#FFD100]' 
                                  : 'text-slate-200 fill-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Pills */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {f.feedback_pills && f.feedback_pills.length > 0 ? (
                            f.feedback_pills.map((pill, pIdx) => (
                              <Badge 
                                key={pIdx} 
                                variant="outline" 
                                className="bg-slate-50 border-slate-200 text-slate-600 font-bold text-[10px] py-0.5 px-2 rounded-full"
                              >
                                {pill}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold italic">No additional pills selected</span>
                          )}
                        </div>
                      </td>

                      {/* Submitted Time */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </td>

                      {/* Delete Action */}
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFeedback(f.id)}
                          className="rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete Feedback Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
