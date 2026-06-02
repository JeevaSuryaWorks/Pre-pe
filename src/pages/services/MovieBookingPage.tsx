import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { addRewardPoints } from "@/services/rewards.service";
import { useNavigate } from "react-router-dom";
import { 
  Film, Sparkles, MapPin, ChevronLeft, Calendar, 
  Clock, Check, Ticket, AlertTriangle, Armchair, 
  Smartphone, CreditCard, ChevronRight, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Movie {
  id: string;
  title: string;
  language: string;
  rating: string;
  genre: string;
  duration: string;
  poster: string;
  banner: string;
  price: number;
}

const MOVIES: Movie[] = [
  {
    id: "m1",
    title: "Kalki 2898 AD",
    language: "Telugu / Tamil / Hindi",
    rating: "UA • 8.9/10",
    genre: "Sci-Fi / Action / Drama",
    duration: "3h 1min",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60",
    banner: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1000&auto=format&fit=crop&q=80",
    price: 190
  },
  {
    id: "m2",
    title: "Manjummel Boys",
    language: "Malayalam / Tamil",
    rating: "U • 9.3/10",
    genre: "Survival / Thriller / Friendship",
    duration: "2h 15min",
    poster: "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=500&auto=format&fit=crop&q=60",
    banner: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1000&auto=format&fit=crop&q=80",
    price: 150
  },
  {
    id: "m3",
    title: "Leo",
    language: "Tamil / Hindi / Telugu",
    rating: "UA • 8.6/10",
    genre: "Action / Crime / Thriller",
    duration: "2h 44min",
    poster: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=500&auto=format&fit=crop&q=60",
    banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=80",
    price: 180
  }
];

const THEATERS = [
  { id: "t1", name: "IMAX: Forum Mall, Bangalore", times: ["10:30 AM", "02:15 PM", "06:00 PM", "09:30 PM"] },
  { id: "t2", name: "PVR: Inorbit Mall, Hyderabad", times: ["11:15 AM", "03:00 PM", "07:30 PM", "10:45 PM"] },
  { id: "t3", name: "SPI Cinemas: Sathyam, Chennai", times: ["09:45 AM", "01:00 PM", "04:30 PM", "08:15 PM", "11:30 PM"] }
];

export default function MovieBookingPage() {
  const { user } = useAuth();
  const { availableBalance, refetch } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Booking Flow Steps: 'movies' | 'theaters' | 'seats' | 'checkout' | 'success'
  const [step, setStep] = useState<'movies' | 'theaters' | 'seats' | 'checkout' | 'success'>('movies');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedTheater, setSelectedTheater] = useState<typeof THEATERS[0] | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("Today, 3 Jun");
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setStep('theaters');
  };

  const handleTheaterSelect = (theater: typeof THEATERS[0], time: string) => {
    setSelectedTheater(theater);
    setSelectedTime(time);
    setStep('seats');
  };

  const handleSeatClick = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length >= 6) {
        toast({
          title: "Limit Exceeded",
          description: "You can book a maximum of 6 tickets per transaction.",
          variant: "destructive"
        });
        return;
      }
      setSelectedSeats(prev => [...prev, seatId]);
    }
  };

  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "No Seats Selected",
        description: "Please choose at least one seat to proceed.",
        variant: "destructive"
      });
      return;
    }
    setStep('checkout');
  };

  const handleExecuteBooking = async () => {
    if (!user || !selectedMovie || !selectedTheater) return;
    
    setProcessing(true);
    const ticketPrice = selectedMovie.price;
    const totalAmount = ticketPrice * selectedSeats.length;

    if (availableBalance < totalAmount) {
      toast({
        title: "Insufficient Wallet Balance",
        description: `You need ₹${(totalAmount - availableBalance).toFixed(2)} more to book these tickets.`,
        variant: "destructive"
      });
      setProcessing(false);
      return;
    }

    try {
      const refId = `MOV-${Math.random().toString(36).substring(3, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      
      // Debit PrePe Wallet
      const success = await addRewardPoints(
        user.id,
        -totalAmount,
        'MANUAL',
        `Movie Tickets: ${selectedMovie.title} (${selectedSeats.length} Tickets, Ref: ${refId})`
      );

      if (success) {
        // Record details inSupabase transactions table
        const metadata = {
          movie_title: selectedMovie.title,
          theater_name: selectedTheater.name,
          show_time: selectedTime,
          show_date: selectedDate,
          seats: selectedSeats.join(', '),
          booking_ref: refId
        };

        const { error: txnErr } = await supabase
          .from('transactions')
          .insert({
            id: refId,
            user_id: user.id,
            amount: totalAmount,
            type: 'WITHDRAWAL',
            status: 'SUCCESS',
            description: `Movie Tickets booking: ${selectedMovie.title}`,
            mobile_number: user.phone || '9999999999',
            metadata: metadata
          });

        if (txnErr) console.warn("Failed to write to transaction logs:", txnErr);
        
        await refetch();
        setBookingRef(refId);
        setStep('success');
        toast({
          title: "Booking Successful!",
          description: "Enjoy your movie! Show digital ticket at the entrance.",
        });
      } else {
        toast({
          title: "Wallet Debit Failed",
          description: "Failed to process payment from wallet. Please try again.",
          variant: "destructive"
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "System Error",
        description: "An unexpected error occurred during ticket booking.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const ticketPrice = selectedMovie?.price || 150;
  const totalAmount = ticketPrice * selectedSeats.length;
  const convenienceFee = totalAmount * 0.01;
  const pgFee = totalAmount * 0.02;
  const estimatedCashback = Math.round(totalAmount * 0.02);

  return (
    <Layout title={step === 'checkout' ? "Order Summary" : step === 'success' ? "Ticket Confirmed" : "Movie Booking"} showBottomNav>
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-lg mx-auto py-6 px-4">
          
          <AnimatePresence mode="wait">
            
            {/* Step 1: Movies Listing */}
            {step === 'movies' && (
              <motion.div
                key="movies"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 relative overflow-hidden shadow-xl border border-white/5">
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />
                  <div className="relative z-10 space-y-2">
                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-rose-400" /> PrePe Entertainment
                    </span>
                    <h2 className="text-3xl font-black tracking-tight uppercase leading-none">Movie Tickets</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      Book standard/IMAX tickets instantly via White-Label BMS Partner APIs.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest ml-1">Now Showing</h3>
                  {MOVIES.map((movie) => (
                    <div 
                      key={movie.id}
                      onClick={() => handleMovieSelect(movie)}
                      className="bg-white rounded-[2rem] border border-slate-100 p-4 shadow-sm hover:border-rose-100 hover:shadow-lg transition-all duration-300 cursor-pointer flex gap-4 text-left"
                    >
                      <div className="w-24 h-32 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                        <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                        <div>
                          <span className="text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {movie.language}
                          </span>
                          <h4 className="text-xl font-black text-slate-800 tracking-tight mt-2 leading-tight truncate">{movie.title}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{movie.genre}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                            {movie.rating}
                          </span>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{movie.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Theater & Showtime Selection */}
            {step === 'theaters' && selectedMovie && (
              <motion.div
                key="theaters"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setStep('movies')}
                    className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-600"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Select Cinema & Show</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">{selectedMovie.title}</p>
                  </div>
                </div>

                {/* Date Tabs */}
                <div className="flex gap-2.5 overflow-x-auto py-1 custom-scrollbar shrink-0">
                  {["Today, 3 Jun", "Thu, 4 Jun", "Fri, 5 Jun"].map((d, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(d)}
                      className={`px-5 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${
                        selectedDate === d
                          ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10"
                          : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {THEATERS.map((theater) => (
                    <div key={theater.id} className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-3xs text-left space-y-4">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-black text-slate-800 leading-tight">{theater.name}</h4>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Physical white-label partner venue</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {theater.times.map((t) => (
                          <button
                            key={t}
                            onClick={() => handleTheaterSelect(theater, t)}
                            className="h-10 rounded-xl border border-slate-150 font-bold text-xs hover:border-rose-500 hover:bg-rose-500/5 text-slate-700 hover:text-rose-600 transition-all active:scale-[0.97]"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Interactive Seat Selection Map */}
            {step === 'seats' && selectedMovie && selectedTheater && (
              <motion.div
                key="seats"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 text-center"
              >
                <div className="flex items-center gap-3 text-left">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setStep('theaters')}
                    className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-600"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Choose Seats</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">
                      {selectedMovie.title} &bull; {selectedTime}
                    </p>
                  </div>
                </div>

                {/* Movie Screen Indicator */}
                <div className="w-full space-y-2 py-4">
                  <div className="w-3/4 h-2 bg-gradient-to-b from-rose-300 to-rose-100 rounded-full mx-auto shadow-[0_-5px_15px_rgba(244,63,94,0.15)]" />
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] block">All eyes this way (Screen)</span>
                </div>

                {/* 6x6 Interactive Seat Grid Layout */}
                <div className="inline-grid grid-cols-6 gap-2.5 p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm mx-auto">
                  {Array.from({ length: 36 }).map((_, idx) => {
                    const row = String.fromCharCode(65 + Math.floor(idx / 6)); // Rows A-F
                    const num = (idx % 6) + 1;
                    const seatId = `${row}${num}`;
                    const isSelected = selectedSeats.includes(seatId);
                    
                    return (
                      <button
                        key={seatId}
                        onClick={() => handleSeatClick(seatId)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all active:scale-90 ${
                          isSelected
                            ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20"
                            : "bg-slate-50 border border-slate-150 text-slate-600 hover:bg-rose-50 hover:border-rose-300"
                        }`}
                      >
                        <Armchair className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-slate-50 border border-slate-150 rounded-md inline-block" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-rose-500 rounded-md inline-block" />
                    <span>Selected</span>
                  </div>
                </div>

                {/* Bottom checkout action bar */}
                <div className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-left">
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">
                      {selectedSeats.length} {selectedSeats.length === 1 ? "Ticket" : "Tickets"} Selected
                    </span>
                    <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <Button 
                    onClick={handleProceedToCheckout}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl px-6 h-12 shadow-md shadow-rose-500/10 active:scale-95 transition-all"
                  >
                    CONTINUE
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Order Summary / Checkout Confirmation */}
            {step === 'checkout' && selectedMovie && selectedTheater && (
              <motion.div
                key="checkout"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setStep('seats')}
                    className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-600"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Order Summary</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">Verify details before payment</p>
                  </div>
                </div>

                {/* Ticket Details Box */}
                <div className="bg-slate-900 text-white rounded-[2.5rem] border border-white/5 p-5 text-left relative overflow-hidden shadow-xl">
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="relative z-10 space-y-4">
                    <div className="border-b border-white/10 pb-4 flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-xl font-black tracking-tight leading-tight">{selectedMovie.title}</h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 block">{selectedMovie.language}</span>
                      </div>
                      <div className="bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-xl shrink-0">
                        {selectedSeats.length} {selectedSeats.length === 1 ? "Ticket" : "Tickets"}
                      </div>
                    </div>

                    <div className="space-y-3.5 text-xs text-slate-300 font-bold leading-none">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-black uppercase tracking-widest text-[8px]">Cinema</span>
                        <span className="text-white text-right leading-relaxed max-w-[200px]">{selectedTheater.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-black uppercase tracking-widest text-[8px]">Date & Time</span>
                        <span className="text-white">{selectedDate} &bull; {selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-black uppercase tracking-widest text-[8px]">Seats Locked</span>
                        <span className="text-rose-400 font-black tracking-widest uppercase">{selectedSeats.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Summary Card */}
                <div className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-3xs text-left space-y-3.5">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Order Summary</h3>
                  
                  <div className="space-y-2.5 text-xs font-bold text-slate-500 border-b border-slate-50 pb-3.5">
                    <div className="flex justify-between">
                      <span>Ticket Amount ({selectedSeats.length} seats)</span>
                      <span className="text-slate-800 font-black">₹{totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span>Wallet Balance Used</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Available: ₹{availableBalance.toFixed(2)}</span>
                      </div>
                      <span className="text-red-600 font-black">-₹{totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span>Convenience Fee</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">1% Waived</span>
                      </div>
                      <span className="flex items-center gap-1.5 mt-0.5">
                        <span className="line-through text-slate-300 font-medium">₹{convenienceFee.toFixed(2)}</span>
                        <span className="text-emerald-600 font-black">₹0.00</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span>Additional Charges</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">PG / Credit Card Fee Waived</span>
                      </div>
                      <span className="flex items-center gap-1.5 mt-0.5">
                        <span className="line-through text-slate-300 font-medium">₹{pgFee.toFixed(2)}</span>
                        <span className="text-emerald-600 font-black">₹0.00</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1.5">
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Payable Amount</p>
                      <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest leading-none">Wallet balance deducted</p>
                    </div>
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">₹0.00</span>
                  </div>

                  {/* Estimated Cashback */}
                  {estimatedCashback > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-emerald-700 mt-2 shrink-0">
                      <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <span className="text-[9.5px] font-black uppercase tracking-wider">
                        You will earn +₹{estimatedCashback}.00 cashback on this booking!
                      </span>
                    </div>
                  )}
                </div>

                {/* Checkout CTA */}
                <div className="shrink-0 pt-2 bg-transparent w-full flex flex-col gap-2">
                  <Button
                    className="w-full h-15 rounded-[22px] text-base font-black bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-600/20 transition-all active:scale-[0.98]"
                    onClick={handleExecuteBooking}
                    disabled={processing}
                  >
                    {processing ? "PROCESSING PAYMENT..." : "CONFIRM & BOOK TICKET NOW"}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Booking Confirmed (Success Screen with Barcode) */}
            {step === 'success' && selectedMovie && selectedTheater && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-800">
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
                  
                  {/* Digital Ticket Card */}
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 border-4 border-emerald-50 shadow-inner">
                      <Check className="w-8 h-8 stroke-[3.5]" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full w-fit">
                        Booking Successful
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none pt-3">{selectedMovie.title}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{selectedMovie.language}</p>
                    </div>

                    {/* Dotted separator line */}
                    <div className="w-full border-t-2 border-dashed border-slate-100 my-1 relative">
                      <div className="absolute -left-9 -top-3 w-6 h-6 bg-[#F8FAFC] border-r border-slate-100 rounded-full" />
                      <div className="absolute -right-9 -top-3 w-6 h-6 bg-[#F8FAFC] border-l border-slate-100 rounded-full" />
                    </div>

                    <div className="w-full text-left space-y-3.5 text-xs text-slate-500 font-bold leading-none">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-black uppercase tracking-widest text-[8px]">Cinema</span>
                        <span className="text-slate-800 text-right leading-relaxed max-w-[200px]">{selectedTheater.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-black uppercase tracking-widest text-[8px]">Date & Time</span>
                        <span className="text-slate-800">{selectedDate} &bull; {selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-black uppercase tracking-widest text-[8px]">Seats Locked</span>
                        <span className="text-rose-500 font-black tracking-widest uppercase">{selectedSeats.join(', ')}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-50 pt-3.5">
                        <span className="text-slate-400 font-black uppercase tracking-widest text-[8px]">Booking Ref ID</span>
                        <span className="text-slate-800 select-all font-black text-sm uppercase tracking-wider font-mono">{bookingRef}</span>
                      </div>
                    </div>

                    {/* Dotted separator line */}
                    <div className="w-full border-t-2 border-dashed border-slate-100 my-1 relative">
                      <div className="absolute -left-9 -top-3 w-6 h-6 bg-[#F8FAFC] border-r border-slate-100 rounded-full" />
                      <div className="absolute -right-9 -top-3 w-6 h-6 bg-[#F8FAFC] border-l border-slate-100 rounded-full" />
                    </div>

                    {/* Premium Barcode */}
                    <div className="flex flex-col items-center gap-2 pt-2 select-none">
                      <div className="flex items-end gap-1.5 h-16 shrink-0 bg-slate-50 p-4 border border-slate-100/50 rounded-2xl shadow-inner">
                        <span className="w-1 bg-slate-800 h-10 rounded-full" />
                        <span className="w-2.5 bg-slate-800 h-10 rounded-full" />
                        <span className="w-1.5 bg-slate-800 h-10 rounded-full" />
                        <span className="w-0.5 bg-slate-800 h-10 rounded-full" />
                        <span className="w-2 bg-slate-800 h-10 rounded-full" />
                        <span className="w-1 bg-slate-800 h-10 rounded-full" />
                        <span className="w-3 bg-slate-800 h-10 rounded-full" />
                        <span className="w-1.5 bg-slate-800 h-10 rounded-full" />
                        <span className="w-0.5 bg-slate-800 h-10 rounded-full" />
                        <span className="w-2 bg-slate-800 h-10 rounded-full" />
                        <span className="w-1 bg-slate-800 h-10 rounded-full" />
                        <span className="w-2.5 bg-slate-800 h-10 rounded-full" />
                      </div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] pt-1">Scan at Entrance</span>
                    </div>

                  </div>
                </div>

                <div className="shrink-0 pt-2 bg-transparent w-full flex flex-col gap-2">
                  <Button
                    className="w-full h-14 rounded-2xl text-base font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xl transition-all active:scale-[0.98]"
                    onClick={() => {
                      setStep('movies');
                      setSelectedMovie(null);
                      setSelectedTheater(null);
                      setSelectedSeats([]);
                      setBookingRef("");
                    }}
                  >
                    GO TO MOVIE DASHBOARD
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </Layout>
  );
}
