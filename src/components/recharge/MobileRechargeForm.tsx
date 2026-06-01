import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Contact,
  FlaskConical,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
  XCircle,
  Clock,
  Phone,
  Smartphone,
  Trophy,
  Star,
  Sparkles,
  Mic
} from 'lucide-react';
import { BrandLoader, PrePeSpinner } from '@/components/ui/BrandLoader';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getOperators,
  getCircles,
  detectOperator,
} from '@/services/operator.service';
import { getPlans, getROffer } from '@/services/plans.service';
import {
  processRecharge,
  getTransactionHistory,
} from '@/services/recharge.service';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { useKYC } from '@/hooks/useKYC';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { KYCNudgeDialog } from '@/components/kyc/KYCNudgeDialog';
import { paymentService } from '@/services/payment.service';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import {
  getAutonomousRewardsConfig,
  getPointsForRechargeAmount,
  triggerAutonomousRechargeRewards,
} from '@/services/rewards.service';
import { Capacitor } from '@capacitor/core';
import { fetchTruecallerProfileSimulated, type TruecallerProfile } from '@/services/truecaller.service';

import type {
  Operator,
  Circle,
  RechargePlan,
} from '@/types/recharge.types';

const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const OPERATOR_LOGOS: Record<string, string> = {
  '1': '/logos/airtel_new.svg',
  '2': '/logos/bsnl_new.png',
  '3': '/logos/jio_new.svg',
  '4': '/logos/vi_new.svg',
};

const getAISuggestedPlans = (operatorId: string): RechargePlan[] => {
  const defaults: Record<string, RechargePlan[]> = {
    '1': [ // Airtel
      { id: 'ai-a1', operator_id: '1', amount: 239, validity: '28 Days', description: 'Unlimited Calls | 1.5GB/Day | 100 SMS/Day | Free HelloTunes', category: 'unlimited' },
      { id: 'ai-a2', operator_id: '1', amount: 299, validity: '28 Days', description: 'Unlimited Calls | 2GB/Day | 100 SMS/Day | Apollo 24|7 Circle', category: 'unlimited' },
      { id: 'ai-a-d1', operator_id: '1', amount: 19, validity: '1 Day', description: '1GB High Speed Data Booster Voucher', category: 'data' },
      { id: 'ai-a-d2', operator_id: '1', amount: 58, validity: '1 Day', description: '3GB High Speed Extra Data Booster Pack', category: 'data' },
      { id: 'ai-a-c1', operator_id: '1', amount: 155, validity: '24 Days', description: 'Unlimited Calls | 1GB Total Data | 300 SMS | Free Hellotunes', category: 'combo' },
      { id: 'ai-a-o1', operator_id: '1', amount: 359, validity: '28 Days', description: 'Unlimited Calls | 2.5GB/Day | Disney+ Hotstar Mobile Subscription', category: 'ott' },
      { id: 'ai-a-5g', operator_id: '1', amount: 699, validity: '56 Days', description: 'Unlimited Calls | 3GB/Day | True Unlimited 5G Data | Wynk Premium', category: '5g' },
      { id: 'ai-a-r1', operator_id: '1', amount: 649, validity: '1 Day', description: 'International Roaming: 100 Mins Voice, 500MB Data Pack', category: 'roaming' },
      { id: 'ai-a-t1', operator_id: '1', amount: 10, validity: 'Unlimited', description: 'Topup Voucher: ₹7.47 Talktime Balance', category: 'topup' },
      { id: 'ai-a-t2', operator_id: '1', amount: 100, validity: 'Unlimited', description: 'Topup Voucher: ₹81.75 Talktime Balance', category: 'topup' },
    ],
    '3': [ // Jio
      { id: 'ai-j1', operator_id: '3', amount: 239, validity: '28 Days', description: 'Unlimited Voice | 1.5GB/Day | 100 SMS/Day | JioCinema', category: 'unlimited' },
      { id: 'ai-j2', operator_id: '3', amount: 299, validity: '28 Days', description: 'Unlimited Voice | 2GB/Day | Unlimited 5G Data | JioCloud', category: 'unlimited' },
      { id: 'ai-j-d1', operator_id: '3', amount: 15, validity: 'Active Plan', description: '1GB High Speed Data Booster Voucher', category: 'data' },
      { id: 'ai-j-d2', operator_id: '3', amount: 25, validity: 'Active Plan', description: '2GB High Speed Data Booster Pack', category: 'data' },
      { id: 'ai-j-c1', operator_id: '3', amount: 155, validity: '28 Days', description: 'Unlimited Calls | 2GB Total Data | 300 SMS | Jio Apps', category: 'combo' },
      { id: 'ai-j-o1', operator_id: '3', amount: 398, validity: '28 Days', description: 'Unlimited Voice | 2GB/Day | Disney+ Hotstar & Jio Cinema', category: 'ott' },
      { id: 'ai-j-5g', operator_id: '3', amount: 666, validity: '84 Days', description: 'Unlimited Voice | 1.5GB/Day | True Unlimited 5G High Speed Data', category: '5g' },
      { id: 'ai-j-r1', operator_id: '3', amount: 1102, validity: '28 Days', description: 'International Roaming: 100 Mins Voice, 2GB Data Roaming Pack', category: 'roaming' },
      { id: 'ai-j-t1', operator_id: '3', amount: 10, validity: 'Unlimited', description: 'Topup Voucher: ₹7.47 Talktime Balance', category: 'topup' },
      { id: 'ai-j-t2', operator_id: '3', amount: 100, validity: 'Unlimited', description: 'Topup Voucher: ₹81.75 Talktime Balance', category: 'topup' },
    ],
    '4': [ // Vi
      { id: 'ai-v1', operator_id: '4', amount: 239, validity: '28 Days', description: 'Unlimited Calls | 1.5GB/Day | Binge All Night (12AM-6AM)', category: 'unlimited' },
      { id: 'ai-v2', operator_id: '4', amount: 299, validity: '28 Days', description: 'Unlimited Calls | 2GB/Day | Weekend Data Rollover & Binge All Night', category: 'unlimited' },
      { id: 'ai-v-d1', operator_id: '4', amount: 19, validity: '1 Day', description: '1GB Extra High Speed Data Booster Pack', category: 'data' },
      { id: 'ai-v-d2', operator_id: '4', amount: 58, validity: '28 Days', description: '3GB Data Pack with 28 Days Active Validity', category: 'data' },
      { id: 'ai-v-c1', operator_id: '4', amount: 179, validity: '28 Days', description: 'Unlimited Calls | 2GB Total Data | 300 SMS | Vi Movies & TV', category: 'combo' },
      { id: 'ai-v-o1', operator_id: '4', amount: 369, validity: '28 Days', description: 'Unlimited Calls | 2GB/Day | Disney+ Hotstar Mobile Subscription', category: 'ott' },
      { id: 'ai-v-5g', operator_id: '4', amount: 479, validity: '56 Days', description: 'Unlimited Calls | 1.5GB/Day | True Unlimited 5G High Speed Data', category: '5g' },
      { id: 'ai-v-r1', operator_id: '4', amount: 599, validity: '1 Day', description: 'Vi International Roaming: 50 Mins, 1GB Data Pack', category: 'roaming' },
      { id: 'ai-v-t1', operator_id: '4', amount: 10, validity: 'Unlimited', description: 'Topup Voucher: ₹7.47 Talktime Balance', category: 'topup' },
      { id: 'ai-v-t2', operator_id: '4', amount: 100, validity: 'Unlimited', description: 'Topup Voucher: ₹81.75 Talktime Balance', category: 'topup' },
    ],
    '2': [ // BSNL
      { id: 'ai-b1', operator_id: '2', amount: 107, validity: '35 Days', description: '3GB Data | 200 Mins Voice Calls | BSNL Tunes included', category: 'combo' },
      { id: 'ai-b2', operator_id: '2', amount: 197, validity: '70 Days', description: 'Unlimited Voice | 2GB/Day (Speed reduced to 40kbps after)', category: 'unlimited' },
      { id: 'ai-b-d1', operator_id: '2', amount: 97, validity: '15 Days', description: 'Unlimited High Speed 3G/4G Data Voucher Pack', category: 'data' },
      { id: 'ai-b-d2', operator_id: '2', amount: 151, validity: '28 Days', description: '40GB High Speed Data Booster Pack', category: 'data' },
      { id: 'ai-b-c1', operator_id: '2', amount: 397, validity: '150 Days', description: 'Unlimited Voice & 2GB/Day for 30 days | Plan validity 150 days', category: 'combo' },
      { id: 'ai-b-o1', operator_id: '2', amount: 269, validity: '28 Days', description: 'Unlimited Voice | 2GB/Day | BSNL Eros Now Entertainment Bundle', category: 'ott' },
      { id: 'ai-b-5g', operator_id: '2', amount: 797, validity: '300 Days', description: 'Unlimited Voice & 2GB/Day for 60 days | 300 Days validity pack', category: '5g' },
      { id: 'ai-b-r1', operator_id: '2', amount: 899, validity: '7 Days', description: 'BSNL International Roaming: 30 Mins, 1GB Data Roaming Pack', category: 'roaming' },
      { id: 'ai-b-t1', operator_id: '2', amount: 10, validity: 'Unlimited', description: 'Topup Voucher: ₹7.47 Talktime Balance', category: 'topup' },
      { id: 'ai-b-t2', operator_id: '2', amount: 100, validity: 'Unlimited', description: 'Topup Voucher: ₹81.75 Talktime Balance', category: 'topup' },
    ],
  };

  return defaults[operatorId] || [
    { id: 'ai-d1', operator_id: operatorId, amount: 239, validity: '28 Days', description: 'Unlimited Calls + 1.5GB/Day High Speed 4G Data', category: 'unlimited' },
    { id: 'ai-d2', operator_id: operatorId, amount: 299, validity: '28 Days', description: 'Unlimited Calls + 2GB/Day High Speed 4G Data', category: 'unlimited' },
  ];
};

const getPlanBenefits = (description: string) => {
  const desc = description.toLowerCase();
  const benefits: { name: string; icon: React.ReactNode }[] = [];

  if (desc.includes('5g') || desc.includes('true 5g')) {
    benefits.push({
      name: 'Unlimited 5G Data',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 border border-white/20">
          <circle cx="50" cy="50" r="48" fill="none" />
          <text x="50" y="58" fill="#ffffff" fontSize="24" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">5G</text>
        </svg>
      )
    });
  }

  if (desc.includes('hotstar') || desc.includes('disney')) {
    benefits.push({
      name: 'Disney+ Hotstar',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-gradient-to-br from-[#0a122c] to-[#182c61] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <path d="M50 22 L54 38 L70 38 L58 48 L62 64 L50 54 L38 64 L42 48 L30 38 L46 38 Z" fill="#ffd700" />
        </svg>
      )
    });
  }

  if (desc.includes('prime') || desc.includes('amazon')) {
    benefits.push({
      name: 'Amazon Prime',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-gradient-to-br from-[#00a8e8] to-[#007eb9] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <path d="M30 55 Q50 68 70 55" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
          <path d="M70 55 L62 52 M70 55 L65 62" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
        </svg>
      )
    });
  }

  if (desc.includes('netflix')) {
    benefits.push({
      name: 'Netflix',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-[#141414] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <path d="M32 25 L45 25 L65 75 L65 25 L78 25 L78 75 L65 75 L45 25 L45 75 L32 75 Z" fill="#e50914" />
        </svg>
      )
    });
  }

  if (desc.includes('jiocinema') || desc.includes('cinema')) {
    benefits.push({
      name: 'JioCinema',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-gradient-to-br from-[#e91e63] to-[#c2185b] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <path d="M35 30 C35 30 50 20 50 20 C50 20 65 30 65 30 C65 48 50 72 50 72 C50 72 35 48 35 30 Z" fill="none" stroke="#ffffff" strokeWidth="5" />
          <text x="50" y="46" fill="#ffffff" fontSize="18" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">JC</text>
        </svg>
      )
    });
  }

  if (desc.includes('jiocloud') || desc.includes('cloud')) {
    benefits.push({
      name: 'JioCloud',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-gradient-to-br from-[#00b0ff] to-[#0081cb] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <path d="M40 60 Q35 60 35 55 Q35 50 42 50 Q45 42 52 42 Q62 42 65 50 Q70 50 70 56 Q70 60 65 60 Z" fill="#ffffff" />
        </svg>
      )
    });
  }

  if (desc.includes('jiotv') || desc.includes('live tv') || desc.includes('livetv')) {
    benefits.push({
      name: 'JioTV',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-gradient-to-br from-[#e91e63] to-[#ff4081] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <rect x="25" y="35" width="50" height="36" rx="6" fill="#ffffff" />
          <polygon points="43,45 61,53 43,61" fill="#e91e63" />
          <line x1="40" y1="35" x2="30" y2="25" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
          <line x1="60" y1="35" x2="70" y2="25" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        </svg>
      )
    });
  }

  if (desc.includes('saavn') || desc.includes('jiosaavn') || desc.includes('music')) {
    benefits.push({
      name: 'JioSaavn Pro',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-[#3ee0ac] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <circle cx="50" cy="50" r="22" fill="#ffffff" />
          <circle cx="50" cy="50" r="10" fill="#3ee0ac" />
          <path d="M50 15 Q68 28 68 50 Q68 72 50 85 Q32 72 32 50 Q32 28 50 15 Z" fill="none" stroke="#ffffff" strokeWidth="5" />
        </svg>
      )
    });
  }

  if (desc.includes('zee5') || desc.includes('zee')) {
    benefits.push({
      name: 'ZEE5',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-gradient-to-br from-[#820082] to-[#410041] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <text x="50" y="58" fill="#ffd700" fontSize="26" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">Z5</text>
        </svg>
      )
    });
  }

  if (desc.includes('sonyliv') || desc.includes('liv')) {
    benefits.push({
      name: 'SonyLIV',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-gradient-to-br from-[#111] to-[#2c3e50] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <text x="50" y="44" fill="#f1c40f" fontSize="16" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">SONY</text>
          <text x="50" y="64" fill="#ffffff" fontSize="15" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">LIV</text>
        </svg>
      )
    });
  }

  if (desc.includes('youtube') || desc.includes('yt premium')) {
    benefits.push({
      name: 'YouTube Premium',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-[#ff0000] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <polygon points="38,32 70,50 38,68" fill="#ffffff" />
        </svg>
      )
    });
  }

  if (desc.includes('wynk')) {
    benefits.push({
      name: 'Wynk Music',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-gradient-to-br from-[#ff2a68] to-[#920025] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <path d="M32 45 Q50 30 68 45 M38 55 Q50 42 62 55 M44 65 Q50 55 56 65" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        </svg>
      )
    });
  }

  if (desc.includes('apollo')) {
    benefits.push({
      name: 'Apollo 24|7 Circle',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-[#ffffff] p-0.5 border border-[#1abc9c]">
          <circle cx="50" cy="50" r="48" fill="none" />
          <rect x="42" y="20" width="16" height="60" rx="4" fill="#e74c3c" />
          <rect x="20" y="42" width="60" height="16" rx="4" fill="#e74c3c" />
        </svg>
      )
    });
  }

  if (desc.includes('hellotunes') || desc.includes('hello tunes')) {
    benefits.push({
      name: 'Free HelloTunes',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-gradient-to-br from-[#ff9f43] to-[#ee5253] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <path d="M40 40 A15 15 0 0 1 60 40 L60 60 A15 15 0 0 1 40 60 Z" fill="none" stroke="#ffffff" strokeWidth="4" />
          <circle cx="40" cy="60" r="8" fill="#ffffff" />
          <circle cx="60" cy="60" r="8" fill="#ffffff" />
        </svg>
      )
    });
  }

  if (desc.includes('eros') || desc.includes('eros now')) {
    benefits.push({
      name: 'Eros Now',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-[#111111] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <text x="50" y="56" fill="#ff7f50" fontSize="24" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">EN</text>
        </svg>
      )
    });
  }

  if (desc.includes('binge all night') || desc.includes('binge')) {
    benefits.push({
      name: 'Vi Binge All Night (12AM-6AM)',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-gradient-to-br from-[#e1b12c] to-[#441a7b] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <path d="M35 50 L45 60 L65 40" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    });
  }

  if (desc.includes('rollover') || desc.includes('weekend data')) {
    benefits.push({
      name: 'Weekend Data Rollover',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-[#4cd137] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <path d="M35 60 L50 40 L65 60" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="50" y1="40" y2="70" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
        </svg>
      )
    });
  }

  if (desc.includes('vi movies') || desc.includes('movies & tv')) {
    benefits.push({
      name: 'Vi Movies & TV',
      icon: (
        <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0 shadow-sm rounded-full bg-[#e84118] p-0.5 border border-white/10">
          <circle cx="50" cy="50" r="48" fill="none" />
          <path d="M40 30 L70 50 L40 70 Z" fill="#ffffff" />
        </svg>
      )
    });
  }

  return benefits;
};

const parseVoiceCommand = (transcript: string, availablePlans: RechargePlan[]): RechargePlan | null => {
  const cleanText = transcript.toLowerCase();
  
  // 1. Check for exact numbers first (amount matching)
  const numberRegex = /\b\d+\b/g;
  const numbersFound = cleanText.match(numberRegex);
  if (numbersFound && numbersFound.length > 0) {
    const spokenAmount = parseInt(numbersFound[0], 10);
    // Find a plan with exact amount
    const exactPlan = availablePlans.find(p => p.amount === spokenAmount);
    if (exactPlan) return exactPlan;
  }

  // Check Tamil spoken numbers
  const tamilAmountMap: Record<string, number> = {
    'irunootru muppathu ombadhu': 239,
    'irunootru thonnootru ombadhu': 299,
    'munnootru thonnootru ombadhu': 399,
    'aaranootru aravatthu aaru': 666,
    'ezhanootru thonnootru ezhu': 797,
    'ombadhu': 9,
    'pathu': 10,
    'ambathu': 50,
  };

  for (const [phrase, amt] of Object.entries(tamilAmountMap)) {
    if (cleanText.includes(phrase)) {
      const exactPlan = availablePlans.find(p => p.amount === amt);
      if (exactPlan) return exactPlan;
    }
  }

  // 2. Score plans based on multiple criteria
  let bestPlan: RechargePlan | null = null;
  let bestScore = -1;

  // Criteria indicators
  const isDataRequested = cleanText.includes('data') || cleanText.includes('gb') || cleanText.includes('net') || cleanText.includes('booster') || cleanText.includes('card');
  const isUnlimitedCalls = cleanText.includes('unlimited') || cleanText.includes('call') || cleanText.includes('pesuradhu') || cleanText.includes('pesa');
  const isAnnual = cleanText.includes('annual') || cleanText.includes('year') || cleanText.includes('varusham') || cleanText.includes('365') || cleanText.includes('yearly');
  const isOtt = cleanText.includes('ott') || cleanText.includes('hotstar') || cleanText.includes('disney') || cleanText.includes('prime') || cleanText.includes('netflix') || cleanText.includes('cinema');
  const isTopup = cleanText.includes('topup') || cleanText.includes('top up') || cleanText.includes('talktime') || cleanText.includes('talk time') || cleanText.includes('pathu') || cleanText.includes('chillrai');
  
  // Specific data indicators
  let dataLimit = 0;
  if (cleanText.includes('1.5 gb') || cleanText.includes('1.5gb')) dataLimit = 1.5;
  else if (cleanText.includes('1 gb') || cleanText.includes('1gb') || cleanText.includes('oru gb')) dataLimit = 1.0;
  else if (cleanText.includes('2 gb') || cleanText.includes('2gb')) dataLimit = 2.0;
  else if (cleanText.includes('3 gb') || cleanText.includes('3gb')) dataLimit = 3.0;

  // Specific validity indicators
  let validityDays = 0;
  if (cleanText.includes('28 days') || cleanText.includes('28 naal') || cleanText.includes('irubathu ettu')) validityDays = 28;
  else if (cleanText.includes('56 days') || cleanText.includes('56 naal')) validityDays = 56;
  else if (cleanText.includes('84 days') || cleanText.includes('84 naal')) validityDays = 84;
  else if (cleanText.includes('today') || cleanText.includes('oru naal') || cleanText.includes('1 day') || cleanText.includes('one day')) validityDays = 1;

  availablePlans.forEach(plan => {
    let score = 0;
    const planDesc = plan.description.toLowerCase();
    const planCat = (plan.category || '').toLowerCase();

    // Data request matching
    if (isDataRequested) {
      if (planCat === 'data' || planDesc.includes('data') || planDesc.includes('gb')) {
        score += 2;
      }
      if (dataLimit > 0) {
        const dataStr = `${dataLimit}gb`;
        const dataSpacedStr = `${dataLimit} gb`;
        if (planDesc.includes(dataStr) || planDesc.includes(dataSpacedStr)) {
          score += 10; // High score for matching specific data allowance
        }
      }
    }

    // Unlimited calls matching
    if (isUnlimitedCalls) {
      if (planCat === 'unlimited' || planDesc.includes('unlimited') || planDesc.includes('free voice') || planDesc.includes('unlimited calls')) {
        score += 3;
      }
    }

    // Annual plans matching
    if (isAnnual) {
      if (planCat === 'annual' || planDesc.includes('year') || planDesc.includes('365 days') || planDesc.includes('annual')) {
        score += 8;
      }
    }

    // OTT matching
    if (isOtt) {
      if (planCat === 'ott' || planDesc.includes('hotstar') || planDesc.includes('prime') || planDesc.includes('netflix') || planDesc.includes('disney')) {
        score += 5;
      }
    }

    // Top up matching
    if (isTopup) {
      if (planCat === 'topup' || planDesc.includes('talktime') || planDesc.includes('topup')) {
        score += 6;
      }
    }

    // Specific validity matching
    if (validityDays > 0) {
      const valStr = `${validityDays} day`;
      const valSpacedStr = `${validityDays} days`;
      if (plan.validity.toLowerCase().includes(valStr) || plan.validity.toLowerCase().includes(valSpacedStr)) {
        score += 8;
      }
    }

    // Generic match based on text content
    const keywords = cleanText.split(' ');
    keywords.forEach(kw => {
      if (kw.length > 2 && planDesc.includes(kw)) {
        score += 0.5;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestPlan = plan;
    }
  });

  // Return the plan if it has a high enough score threshold
  return bestScore > 2 ? bestPlan : null;
};

const getProviderTabs = (operatorId: string) => {
  switch (operatorId) {
    case '3': // Jio
      return [
        { id: 'all', label: 'All' },
        { id: 'true_5g_unlimited', label: 'True 5G Unlimited' },
        { id: 'calls_only', label: 'Calls Only' },
        { id: 'data', label: 'Data' },
        { id: 'entertainment', label: 'Entertainment' },
        { id: 'gaming', label: 'Gaming' },
        { id: '5g_unlimited_upgrade', label: '5G Unlimited Upgrade' },
        { id: 'annual_plans', label: 'Annual Plans' },
        { id: 'smartphone_plans', label: 'Smartphone Plans' },
        { id: '4g_feature_phone_plan', label: '4G Feature Phone Plan' },
        { id: 'jio_phone', label: 'Jio Phone' },
        { id: 'jio_bharat', label: 'Jio Bharat' },
        { id: 'international_roaming', label: 'International roaming' },
        { id: 'isd', label: 'ISD' },
        { id: 'top_up', label: 'Top Up' }
      ];
    case '1': // Airtel
      return [
        { id: 'all', label: 'All' },
        { id: 'unlimited', label: 'Unlimited' },
        { id: 'call_only', label: 'Call Only' },
        { id: 'data', label: 'Data' },
        { id: 'international_roaming', label: 'International Roaming' },
        { id: 'talktime', label: 'Talktime' },
        { id: 'other', label: 'Other' },
        { id: 'inflight_roaming_packs', label: 'Inflight Roaming Packs' },
        { id: 'plan_vouchers', label: 'Plan Vouchers' }
      ];
    case '4': // VI
      return [
        { id: 'all', label: 'All' },
        { id: 'unlimited', label: 'Unlimited' },
        { id: 'call_only', label: 'Call Only' },
        { id: 'nonstop_hero', label: 'NonStop Hero' },
        { id: 'super_hero', label: 'Super Hero' },
        { id: 'data', label: 'Data' },
        { id: 'ott', label: 'OTT' },
        { id: 'top_up', label: 'Top Up' },
        { id: 'plan_voucher', label: 'Plan Voucher' }
      ];
    case '2': // BSNL
      return [
        { id: 'all', label: 'All' },
        { id: 'unlimited', label: 'Unlimited' },
        { id: 'data', label: 'Data' },
        { id: 'vas', label: 'VAS' },
        { id: 'top_up', label: 'Top Up' },
        { id: 'international_roaming', label: 'International Roaming' }
      ];
    default:
      return [
        { id: 'all', label: 'All' },
        { id: 'unlimited', label: 'Unlimited' },
        { id: 'data', label: 'Data (GB)' },
        { id: 'combo', label: 'Validity' },
        { id: 'topup', label: 'Talktime' }
      ];
  }
};

const matchesCategory = (plan: RechargePlan, tabId: string) => {
  if (tabId === 'all') return true;

  const desc = plan.description.toLowerCase();
  const cat = plan.category?.toLowerCase() || '';

  switch (tabId) {
    // JIO Specific
    case 'true_5g_unlimited':
      return desc.includes('5g') && desc.includes('unlimited') && (desc.includes('voice') || desc.includes('calls'));
    case 'calls_only':
    case 'call_only':
      return desc.includes('calls only') || desc.includes('unlimited calls') || desc.includes('unlimited voice') || cat.includes('talktime') || cat.includes('topup');
    case 'data':
      return cat.includes('data') || desc.includes('data booster') || desc.includes('extra data') || desc.includes('data pack');
    case 'entertainment':
    case 'ott':
      return cat.includes('ott') || desc.includes('hotstar') || desc.includes('prime') || desc.includes('netflix') || desc.includes('ott') || desc.includes('cinema') || desc.includes('entertainment') || desc.includes('streaming');
    case 'gaming':
      return desc.includes('gaming') || desc.includes('games') || desc.includes('game');
    case '5g_unlimited_upgrade':
      return desc.includes('5g upgrade') || (desc.includes('5g') && desc.includes('upgrade'));
    case 'annual_plans':
      return desc.includes('year') || desc.includes('365 days') || desc.includes('annual');
    case 'smartphone_plans':
      return desc.includes('smartphone') || (!desc.includes('jiophone') && !desc.includes('bharat') && (cat.includes('unlimited') || desc.includes('voice')));
    case '4g_feature_phone_plan':
      return desc.includes('4g feature') || desc.includes('feature phone');
    case 'jio_phone':
    case 'jiophone':
      return desc.includes('jiophone') || desc.includes('jio phone');
    case 'jio_bharat':
    case 'jiobharat':
      return desc.includes('jiobharat') || desc.includes('jio bharat');
    case 'international_roaming':
    case 'roaming':
      return cat.includes('roaming') || desc.includes('roaming') || desc.includes('international');
    case 'isd':
      return desc.includes('isd') || desc.includes('international call');
    case 'top_up':
    case 'topup':
      return cat.includes('topup') || desc.includes('topup') || desc.includes('top-up') || desc.includes('talktime balance');

    // AIRTEL Specific
    case 'unlimited':
      return cat.includes('unlimited') || desc.includes('unlimited');
    case 'talktime':
      return cat.includes('topup') || desc.includes('talktime') || desc.includes('top up');
    case 'other':
      return cat.includes('combo') || cat.includes('special') || desc.includes('other');
    case 'inflight_roaming_packs':
      return desc.includes('inflight') || desc.includes('in-flight');
    case 'plan_vouchers':
      return desc.includes('voucher') || desc.includes('rate cutter');

    // VI Specific
    case 'nonstop_hero':
      return desc.includes('nonstop') || desc.includes('non-stop') || desc.includes('hero');
    case 'super_hero':
      return desc.includes('super hero') || desc.includes('superhero');
    case 'plan_voucher':
      return desc.includes('voucher') || desc.includes('plan voucher');

    // BSNL Specific
    case 'vas':
      return desc.includes('vas') || desc.includes('value added') || desc.includes('caller tune') || desc.includes('tunes');

    default:
      return cat === tabId || desc.includes(tabId);
  }
};

type FlowStep = 'number' | 'details' | 'confirm' | 'result';

export function MobileRechargeForm({ onStepChange }: { onStepChange?: (step: FlowStep) => void } = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { availableBalance, refetch } = useWallet();
  const { profile } = useProfile();
  const { toast } = useToast();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const { isApproved } = useKYC();
  const { limits, checkRechargeLimit } = usePlanLimits();
  const location = useLocation();

  const [step, setStep] = useState<FlowStep>('number');
  const [showKYCNudge, setShowKYCNudge] = useState(false);
  const [mobileNumber, setMobileNumber] = useState(''); // Formatted with space
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);
  const [planCategory, setPlanCategory] = useState('all');
  const [planSearchQuery, setPlanSearchQuery] = useState("");
  
  const [operators, setOperators] = useState<Operator[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [suggestedPlans, setSuggestedPlans] = useState<RechargePlan[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [rewardsConfig, setRewardsConfig] = useState<any>(null);
  const [upiVpa, setUpiVpa] = useState(() => {
    const vpas = ['prepetechnologies@okaxis'];
    return vpas[Math.floor(Math.random() * vpas.length)];
  });
  
  const [loading, setLoading] = useState(true);
  const [truecallerProfile, setTruecallerProfile] = useState<TruecallerProfile | null>(null);
  const [fetchingTruecaller, setFetchingTruecaller] = useState(false);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);
  
  useEffect(() => {
    const loadRewards = async () => {
      try {
        const config = await getAutonomousRewardsConfig();
        setRewardsConfig(config);
      } catch (err) {
        console.warn("Failed to load rewards config inside MobileRechargeForm:", err);
      }
    };
    loadRewards();
  }, []);
  const [detecting, setDetecting] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultStatus, setResultStatus] = useState<'SUCCESS' | 'PENDING' | 'FAILED' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTopupFlow, setIsTopupFlow] = useState(false);
  const [topupRefId, setTopupRefId] = useState<string | null>(null);
  const [shortfall, setShortfall] = useState(0);
  const [showTopupQr, setShowTopupQr] = useState(false);
  const [intentUrl, setIntentUrl] = useState('');

  // ==========================================
  // Voice to Recharge assistant states & NLU
  // ==========================================
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [listeningLang, setListeningLang] = useState<'en-IN' | 'ta-IN'>('en-IN');
  const [voiceSuccessMessage, setVoiceSuccessMessage] = useState('');
  const [speechRecognitionInstance, setSpeechRecognitionInstance] = useState<any>(null);

  const processSpeechResult = (text: string) => {
    if (plans.length === 0) {
      toast({
        title: "Recharge plans not loaded",
        description: "Please wait until carrier plans are completely loaded.",
        variant: "destructive"
      });
      return;
    }

    const matchedPlan = parseVoiceCommand(text, plans);
    if (matchedPlan) {
      setVoiceSuccessMessage(`Auto-selected ₹${matchedPlan.amount} plan! ${matchedPlan.description}`);
      setSelectedPlan(matchedPlan);
      setAmount(matchedPlan.amount.toString());
      setVoiceError('');
      
      // Auto transition to confirm page after a 1.5s delay for hands-free premium look
      setTimeout(() => {
        setIsListening(false);
        setStep('confirm');
      }, 1500);
    } else {
      // Automatic adaptive STT switch to Tamil if circle is Tamil Nadu and no matches found in English/Tanglish
      if (listeningLang === 'en-IN' && selectedCircle === '23') {
        setVoiceTranscript('Analyzing spoken language... Retrying in தமிழ்...');
        setTimeout(() => {
          setListeningLang('ta-IN');
          retryVoiceListeningWithLang('ta-IN');
        }, 1200);
      } else {
        setVoiceError("No matching plan found. You can try speaking again, or type your query below.");
        setPlanSearchQuery(text);
      }
    }
  };

  const startVoiceListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Unsupported",
        description: "Web Speech API is unsupported in this browser. Please use Chrome or Safari.",
        variant: "destructive"
      });
      return;
    }

    setVoiceTranscript('');
    setVoiceError('');
    setVoiceSuccessMessage('');
    setListeningLang('en-IN'); // Default to English/Tanglish
    setIsListening(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'network') {
        setVoiceError('Speech server unreachable (Network Error). You can retry or type your plan request below.');
      } else if (event.error === 'not-allowed') {
        setVoiceError('Microphone permission blocked. Please enable microphone access.');
      } else {
        setVoiceError('Could not recognize speech. Please tap to retry or type below.');
      }
    };

    recognition.onend = () => {
      // Keep overlay open so user can see errors or use fallback text inputs
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      const isFinal = event.results[current].isFinal;
      setVoiceTranscript(transcriptText);

      if (isFinal) {
        processSpeechResult(transcriptText);
      }
    };

    recognition.start();
    setSpeechRecognitionInstance(recognition);
  };

  const retryVoiceListeningWithLang = (lang: 'en-IN' | 'ta-IN') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onerror = (event: any) => {
      console.error('Tamil speech recognition error:', event.error);
      if (event.error === 'network') {
        setVoiceError('Speech server unreachable (Network Error). You can retry or type your plan request below.');
      } else {
        setVoiceError('Could not recognize Tamil speech. You can retry or type below.');
      }
    };

    recognition.onend = () => {
      // Keep open
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      const isFinal = event.results[current].isFinal;
      setVoiceTranscript(transcriptText);

      if (isFinal) {
        const matchedPlan = parseVoiceCommand(transcriptText, plans);
        if (matchedPlan) {
          setVoiceSuccessMessage(`Auto-selected ₹${matchedPlan.amount} plan! ${matchedPlan.description}`);
          setSelectedPlan(matchedPlan);
          setAmount(matchedPlan.amount.toString());
          setVoiceError('');
          setTimeout(() => {
            setIsListening(false);
            setStep('confirm');
          }, 1500);
        } else {
          setVoiceError("No matching plan found. You can try speaking again, or type your query below.");
          setPlanSearchQuery(transcriptText);
        }
      }
    };

    recognition.start();
    setSpeechRecognitionInstance(recognition);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ops, circs] = await Promise.all([
          getOperators('prepaid'),
          getCircles(),
        ]);
        setOperators(ops);
        setCircles(circs);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      const history = await getTransactionHistory(user.id, 5, 'MOBILE_PREPAID');
      setRecentTransactions(history.filter((t: any) => t.status === 'SUCCESS'));
    };
    loadHistory();
  }, [user?.id]);

  const handleMobileChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(-10);
    // Format: 00000 00000
    let formatted = cleaned;
    if (cleaned.length > 5) {
      formatted = cleaned.slice(0, 5) + ' ' + cleaned.slice(5);
    }
    setMobileNumber(formatted);
  };

  useEffect(() => {
    // Read prefilled phone number from location search or state
    const params = new URLSearchParams(location.search);
    const queryPhone = params.get('phone') || location.state?.mobileNumber;
    if (queryPhone) {
      const cleaned = queryPhone.replace(/\D/g, '').slice(-10);
      if (cleaned.length === 10) {
        handleMobileChange(cleaned);
      }
    }
  }, [location]);

  const handleOpenContacts = async () => {
    // Try browser/webview built-in native Contact Picker API
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: false };
        // @ts-ignore
        const contacts = await navigator.contacts.select(props, opts);
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const rawPhone = contact.tel?.[0] || '';
          const cleaned = rawPhone.replace(/\D/g, '').slice(-10); // get last 10 digits
          if (cleaned.length === 10) {
            handleMobileChange(cleaned);
            toast({
              title: "Contact Selected",
              description: `Loaded number for ${contact.name?.[0] || 'Selected Contact'}.`,
            });
            return;
          } else {
            toast({
              title: "Invalid Mobile Number",
              description: "Selected contact does not have a valid 10-digit mobile number.",
              variant: "destructive",
            });
          }
        }
      } catch (err: any) {
        console.warn('Native Contact Picker aborted/failed:', err);
        if (err.name !== 'AbortError') {
          toast({
            title: "Contacts Permission",
            description: "Unable to access phone contacts. Please grant Contacts permission in system settings.",
            variant: "destructive",
          });
        }
      }
    } else {
      toast({
        title: "Native Contact Picker Only",
        description: "Built-in system contact chooser is only available on native mobile devices.",
      });
    }
  };

  useEffect(() => {
    const rawNumber = mobileNumber.replace(/\s/g, '');
    if (rawNumber.length === 10) {
      const run = async () => {
        setDetecting(true);
        setFetchingTruecaller(true);
        setTruecallerProfile(null);
        try {
          const result = await detectOperator(rawNumber);
          if (result.status === 'SUCCESS' && result.data) {
            setSelectedOperator(result.data.operator.id);
            setSelectedCircle(result.data.circle.id);
            
            // Truecaller async lookup
            fetchTruecallerProfileSimulated(rawNumber).then((profile) => {
              setTruecallerProfile(profile);
              setFetchingTruecaller(false);
            }).catch(() => {
              setFetchingTruecaller(false);
            });

            setTimeout(() => setStep('details'), 500);
          } else {
            setFetchingTruecaller(false);
          }
        } catch (e) {
          setDetecting(false);
          setFetchingTruecaller(false);
        } finally {
          setDetecting(false);
        }
      };
      run();
    } else {
      setTruecallerProfile(null);
      setFetchingTruecaller(false);
    }
  }, [mobileNumber]);

  useEffect(() => {
    setPlanCategory('all');
  }, [selectedOperator]);

  useEffect(() => {
    if (!selectedOperator || step !== 'details') return;
    const load = async () => {
      setLoadingPlans(true);
      const result = await getPlans(selectedOperator, selectedCircle || '1', 'all');
      setPlans(result.status === 'SUCCESS' ? result.data : []);
      setLoadingPlans(false);
    };
    load();
  }, [selectedOperator, selectedCircle, step]);

  useEffect(() => {
    if (!selectedOperator || !mobileNumber || step !== 'details') return;
    const loadSuggested = async () => {
      setLoadingSuggested(true);
      const cleanNumber = mobileNumber.replace(/\s+/g, '');
      try {
        const result = await getROffer(selectedOperator, cleanNumber);
        if (result.status === 'SUCCESS' && result.data && result.data.length > 0) {
          setSuggestedPlans(result.data);
        } else {
          // Fallback to static AI suggestions if no R-offers are returned or not supported (e.g. Jio/BSNL)
          setSuggestedPlans(getAISuggestedPlans(selectedOperator));
        }
      } catch (err) {
        setSuggestedPlans(getAISuggestedPlans(selectedOperator));
      } finally {
        setLoadingSuggested(false);
      }
    };
    loadSuggested();
  }, [selectedOperator, mobileNumber, step]);

  const handlePlanSelect = (plan: RechargePlan) => {
    setSelectedPlan(plan);
    setAmount(plan.amount.toString());
    setStep('confirm');
  };

  const handleAutoTopup = async (neededAmount: number) => {
    setIsTopupFlow(true);
    setShortfall(neededAmount);
    setProcessing(true);
    
    try {
      const result = await paymentService.createUpiIntent(neededAmount);
      if (result.intent_url) {
        setTopupRefId(result.reference_id);
        setIntentUrl(result.intent_url);
        if (result.upi_vpa) {
          setUpiVpa(result.upi_vpa);
        }
        
        // Open UPI Intent on mobile, or show QR on desktop
        if (isMobile) {
          if (Capacitor.isNativePlatform()) {
            window.open(result.intent_url, '_system');
          } else {
            window.location.href = result.intent_url;
          }
        } else {
          setShowTopupQr(true);
        }
        
        // Start polling for payment
        const poll = setInterval(async () => {
          try {
            const status = await paymentService.getPaymentStatus(result.reference_id);
            if (status.status === 'SUCCESS') {
              clearInterval(poll);
              await refetch(); // Sync wallet
              setIsTopupFlow(false);
              setTopupRefId(null);
              setShowTopupQr(false);
              // Small delay to ensure DB sync before retrying recharge
              setTimeout(() => handleExecuteRecharge(true), 1000);
            } else if (status.status === 'FAILED') {
              clearInterval(poll);
              setIsTopupFlow(false);
              setProcessing(false);
              toast({ title: 'Top-up Failed', variant: 'destructive' });
            }
          } catch (e) {
            console.warn('Polling top-up error:', e);
          }
        }, 3000);

        // Safety timeout for polling
        setTimeout(() => clearInterval(poll), 120000);
      }
    } catch (error: any) {
      setIsTopupFlow(false);
      setProcessing(false);
      toast({ title: 'Top-up Initiation Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleExecuteRecharge = async (force: boolean = false) => {
    const numAmount = parseFloat(amount);
    
    // Check balance before processing
    if (!force && availableBalance < numAmount) {
      handleAutoTopup(numAmount - availableBalance);
      return;
    }

    setProcessing(true);
    const rawNumber = mobileNumber.replace(/\s/g, '');
    try {
      const result = await processRecharge(user!.id, {
        mobile_number: rawNumber,
        operator_id: selectedOperator,
        circle_id: selectedCircle,
        amount: parseFloat(amount),
        plan_id: selectedPlan?.id,
      });

      if (result.status === 'SUCCESS' || result.status === 'PENDING') {
        // Trigger Autonomous Recharge Rewards asynchronously
        try {
          await triggerAutonomousRechargeRewards(user!.id, parseFloat(amount));
        } catch (rewErr) {
          console.error("Failed to credit autonomous recharge rewards:", rewErr);
        }

        const operatorObj = operators.find(o => o.id === selectedOperator);
        navigate('/recharge/receipt', {
          state: {
            amount,
            operator: operatorObj?.name || selectedOperator,
            number: rawNumber,
            refId: (result as any).referenceId || 'N/A',
            type: 'Mobile Recharge'
          }
        });
      } else {
        setResultStatus('FAILED');
        setErrorMessage(result.message);
        setStep('result');
      }
    } catch (error: any) {
      setResultStatus('FAILED');
      setErrorMessage(error.message);
      setStep('result');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <BrandLoader size="md" />
      </div>
    );
  }

  if (isTopupFlow && processing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
        <div className="relative h-20 w-20 mx-auto">
          <BrandLoader size="md" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="h-8 w-8 text-blue-400 fill-current" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <p className="font-black text-2xl text-slate-800 tracking-tighter">Verifying Top-up...</p>
          <p className="text-sm font-medium text-slate-400 max-w-[240px] mx-auto leading-relaxed">
            We are waiting for your ₹{shortfall.toFixed(2)} payment. Your recharge will proceed automatically once confirmed.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          {resultStatus === 'SUCCESS' ? (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">Success!</h1>
              <p className="text-sm text-slate-500 font-medium tracking-tight px-4">₹{amount} processed successfully for {mobileNumber}.</p>
            </div>
          ) : resultStatus === 'PENDING' ? (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-amber-100">
                <Clock className="w-10 h-10 text-amber-600 animate-pulse" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-amber-900">Pending</h1>
              <p className="text-sm text-slate-500 font-medium tracking-tight px-4">Verifying your transaction...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-rose-100">
                <XCircle className="w-10 h-10 text-rose-600" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-rose-900">Failed</h1>
              <p className="text-sm text-slate-500 font-medium tracking-tight px-4">{errorMessage}</p>
            </div>
          )}

          <div className="pt-6">
            <Button 
              className="w-full h-14 rounded-2xl text-lg font-black bg-slate-900 text-white shadow-xl active:scale-95 transition-all"
              onClick={() => {
                setStep('number');
                setMobileNumber('');
                setAmount('');
                setSelectedPlan(null);
                setResultStatus(null);
              }}
            >
              DONE
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    const operatorObj = operators.find(o => o.id === selectedOperator);
    const circleObj = circles.find(c => c.id === selectedCircle);

    return (
      <div className="flex-1 flex flex-col pt-0 animate-in fade-in slide-in-from-right-8 duration-500 relative h-full overflow-hidden w-full">
        <div className="absolute top-3 left-3 z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setStep('details')} 
            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/30 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        <Card className="border-none shadow-[0_20px_40px_rgba(0,0,0,0.05)] rounded-[35px] overflow-hidden flex flex-col flex-1 mb-4 w-full">
          <div className="bg-slate-900 p-8 text-white flex flex-col items-center text-center relative overflow-hidden shrink-0 pt-12">
             <div className="absolute top-0 right-0 p-4 opacity-5">
              <Zap size={140} />
            </div>
            <div className="w-16 h-16 bg-white rounded-2xl p-4 mb-4 shadow-2xl relative z-10 flex items-center justify-center">
              {OPERATOR_LOGOS[selectedOperator] ? (
                 <img 
                    src={OPERATOR_LOGOS[selectedOperator]} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as any).style.display = 'none'; (e.target as any).nextSibling.style.display = 'block'; }} 
                  />
              ) : null}
              <Smartphone className={`w-8 h-8 text-slate-200 ${OPERATOR_LOGOS[selectedOperator] ? 'hidden' : 'block'}`} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1 relative z-10">{operatorObj?.name} • {circleObj?.name}</p>
            <h1 className="text-3xl font-black tracking-tighter relative z-10">{mobileNumber}</h1>
          </div>
          
          <CardContent className="p-8 space-y-6 bg-white flex-1 overflow-y-auto custom-scrollbar w-full">
            <div className="flex justify-between items-center pb-6 border-b border-slate-50">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">₹{amount}</h1>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400 uppercase tracking-widest text-[9px]">Plan Benefits</span>
                <span className="text-blue-600">{selectedPlan?.validity}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-5 rounded-[24px] border border-slate-100/30">{selectedPlan?.description}</p>
            </div>

            <div className="flex items-center gap-3 p-5 bg-blue-50/40 rounded-[28px] border border-blue-100/20 shrink-0">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <FlaskConical className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[8px] font-black text-blue-800/60 uppercase tracking-widest leading-none mb-1">PrePe Wallet</p>
                <p className="text-lg font-black text-slate-800 leading-none">₹{availableBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="shrink-0 px-2 pb-2 w-full">
          <Button
            className="w-full h-16 rounded-[28px] text-lg font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
            onClick={() => handleExecuteRecharge()}
            disabled={processing}
          >
            {processing ? <PrePeSpinner className="h-6 w-6" /> : "SECURE PAYMENT"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="flex-1 flex flex-col space-y-4 animate-in fade-in slide-in-from-right-8 duration-500 w-full relative">
        <div 
          className="sticky bg-white/98 backdrop-blur-md pb-3 pt-2 shadow-sm -mx-4 px-4 border-b border-slate-200/50"
          style={{ position: 'sticky', top: '60px', zIndex: 30 }}
        >
          {/* Card containing Logo, Number, Truecaller Name lookup, and Change button */}
          <div className="flex items-center justify-between bg-white/95 backdrop-blur-md p-3 rounded-[24px] border border-slate-100 shadow-sm w-full">
            <div className="flex items-center gap-3 px-1">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm p-1.5 overflow-hidden">
                {selectedOperator && OPERATOR_LOGOS[selectedOperator] ? (
                  <img 
                     src={OPERATOR_LOGOS[selectedOperator]} 
                     alt="Operator Logo" 
                     className="w-full h-full object-contain animate-in zoom-in-50 duration-300"
                     onError={(e) => { 
                       (e.target as any).style.display = 'none'; 
                       if ((e.target as any).nextSibling) {
                         (e.target as any).nextSibling.style.display = 'block';
                       }
                     }} 
                   />
                ) : null}
                <Phone className={`w-4 h-4 text-blue-600 ${selectedOperator && OPERATOR_LOGOS[selectedOperator] ? 'hidden' : 'block'}`} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-lg font-black text-slate-900 tracking-tighter leading-none">{mobileNumber}</p>
                  {truecallerProfile && (
                    <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-black border border-blue-100/50 animate-in zoom-in duration-300 shadow-3xs uppercase tracking-wider">
                      ⚡ TC Verified
                    </span>
                  )}
                  {fetchingTruecaller && (
                    <PrePeSpinner className="w-3 h-3" />
                  )}
                </div>
                {truecallerProfile ? (
                  <div className="space-y-0.5 mt-1">
                    <p className="text-[11px] font-black text-[#0087FF] leading-none">
                      {truecallerProfile.name.first} {truecallerProfile.name.last}
                    </p>
                    <p className="text-[10.5px] text-[#0087FF] font-extrabold leading-none flex items-center gap-1 uppercase tracking-wider mt-1">
                      ⚠️ Name may be inaccurate
                    </p>
                  </div>
                ) : (
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select a Plan</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep('number')} className="h-8 rounded-lg text-blue-600 text-xs font-bold hover:bg-blue-50 px-3">Change</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full px-1">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Operator</Label>
            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
              <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-white font-bold shadow-sm">
                <SelectValue placeholder="Operator" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {operators.map((op) => (
                  <SelectItem key={op.id} value={op.id} className="font-bold py-2 text-sm">{op.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Circle</Label>
            <Select value={selectedCircle} onValueChange={setSelectedCircle}>
              <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-white font-bold shadow-sm">
                <SelectValue placeholder="Circle" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {circles.map((circle) => (
                  <SelectItem key={circle.id} value={circle.id} className="font-bold py-2 text-sm">{circle.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Unified Search & Custom Amount Input Box */}
        <div className="relative group w-full px-1">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[30px] blur-2xl opacity-5 group-focus-within:opacity-10 transition duration-1000"></div>
          <div className="relative bg-white border-2 border-slate-100 rounded-[24px] p-4 focus-within:border-blue-500 transition-all shadow-md shadow-slate-100/5 w-full">
            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 block ml-1">Search Plans or Enter Amount</Label>
            <div className="flex items-center gap-3 h-10 w-full">
              {/^\d+$/.test(planSearchQuery) ? (
                <span className="text-xl font-black text-blue-600 select-none shrink-0 animate-in zoom-in-50 duration-200">₹</span>
              ) : (
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
              )}
              <div className="w-px h-5 bg-slate-100 shrink-0" />
              <input
                type="text"
                className="border-none p-0 h-full text-xl font-bold tracking-tight focus:outline-none placeholder:text-slate-200 bg-transparent flex-1 min-w-0 font-sans"
                placeholder="Search plan or enter amount (e.g. 2GB, 239)"
                value={planSearchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlanSearchQuery(val);
                  
                  const isNumber = /^\d+$/.test(val);
                  if (isNumber && parseFloat(val) > 0) {
                    setAmount(val);
                    setSelectedPlan({
                      id: 'custom',
                      amount: parseFloat(val) || 0,
                      validity: 'As per operator',
                      description: 'Custom Recharge Amount',
                      category: 'custom'
                    } as any);
                  } else {
                    setAmount("");
                    if (selectedPlan?.id === 'custom') {
                      setSelectedPlan(null);
                    }
                  }
                }}
              />
              
              {/* Voice to Recharge Mic Button */}
              <button
                type="button"
                onClick={startVoiceListening}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-350 shrink-0 shadow-sm relative group/mic select-none hover:scale-105 active:scale-95 ${
                  isListening ? 'bg-blue-600 shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/15' : 'bg-blue-50 hover:bg-blue-100'
                }`}
                title="Speak to select plan"
              >
                {isListening ? (
                  <div className="flex items-end gap-0.5 h-3.5 select-none shrink-0">
                    <span className="w-0.75 bg-white rounded-full animate-[bounce_0.6s_infinite] h-2" />
                    <span className="w-0.75 bg-white rounded-full animate-[bounce_0.4s_infinite] h-3.5" />
                    <span className="w-0.75 bg-white rounded-full animate-[bounce_0.8s_infinite] h-2.5" />
                    <span className="w-0.75 bg-white rounded-full animate-[bounce_0.5s_infinite] h-3" />
                  </div>
                ) : (
                  <>
                    <Mic className="w-5 h-5 group-hover/mic:scale-110 transition-transform text-blue-600" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white animate-pulse" />
                  </>
                )}
              </button>

              {planSearchQuery && (
                <button
                  onClick={() => {
                    setPlanSearchQuery("");
                    setAmount("");
                    if (selectedPlan?.id === 'custom') {
                      setSelectedPlan(null);
                    }
                  }}
                  className="w-6 h-6 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Proceed Button for custom amount */}
        {amount && parseFloat(amount) > 0 && (
          <div className="shrink-0 px-1 w-full animate-in slide-in-from-bottom-2 duration-300">
            <Button
              className="w-full h-14 rounded-2xl text-md font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
              onClick={() => {
                if (!selectedPlan || selectedPlan.id !== 'custom') {
                  setSelectedPlan({
                    id: 'custom',
                    amount: parseFloat(amount),
                    validity: 'As per operator',
                    description: 'Custom Recharge Amount',
                    category: 'custom'
                  } as any);
                }
                setStep('confirm');
              }}
            >
              PROCEED TO PAY ₹{amount}
            </Button>
          </div>
        )}

        <div className="flex flex-col w-full">
          {/* Suggested Plans */}
          {!planSearchQuery && (() => {
            if (loadingSuggested) {
              return (
                <div className="mb-6 shrink-0 animate-pulse">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500/20 animate-spin" />
                      Resolving personalized offers...
                    </h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="min-w-[155px] h-[120px] rounded-2xl bg-slate-100 border border-slate-200/50 relative overflow-hidden" />
                    ))}
                  </div>
                </div>
              );
            }

            const allSuggested = suggestedPlans;
            const suggested = planCategory === 'all'
              ? allSuggested
              : allSuggested.filter(plan => plan.category === planCategory || plan.category === 'special');
            
            if (suggested.length === 0) return null;

            return (
              <div className="mb-6 shrink-0">
                 <div className="flex items-center justify-between mb-3 px-1">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                     Suggested For You
                   </h3>
                   <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full tracking-tighter">AI Optimized</span>
                 </div>
                 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
                   {suggested.map((plan, idx) => (
                     <div 
                       key={`suggested-${plan.id}`}
                       onClick={() => handlePlanSelect(plan)}
                       className={`min-w-[155px] p-4 rounded-2xl text-white shadow-lg active:scale-95 transition-all relative overflow-hidden group ${
                         idx % 2 === 0 ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-indigo-600 to-violet-700'
                       }`}
                     >
                       <div className="absolute top-[-20%] right-[-10%] w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
                       <div className="flex justify-between items-start mb-2 relative z-10">
                         <div className="flex flex-col">
                           <span className="text-xl font-black tracking-tighter">₹{plan.amount}</span>
                         </div>
                         <Star className="w-3 h-3 text-white/50 fill-white/20" />
                       </div>
                       <p className="text-[9.5px] font-bold leading-snug opacity-95 line-clamp-2 mb-2.5 min-h-[28px] relative z-10">{plan.description}</p>
                       <div className="flex justify-between items-center relative z-10">
                         <span className="text-[8px] font-black uppercase tracking-widest opacity-70">{plan.validity}</span>
                         <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                           <ChevronRight className="w-3 h-3" />
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            );
          })()}

          {/* Quick Filter Chips */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1 shrink-0 px-1">
             {['1.5GB', '2GB', '28 Days', '84 Days', 'Unlimited'].map(chip => (
               <button 
                 key={chip}
                 onClick={() => {
                   const nextVal = planSearchQuery === chip ? "" : chip;
                   setPlanSearchQuery(nextVal);
                   setAmount("");
                   if (selectedPlan?.id === 'custom') {
                     setSelectedPlan(null);
                   }
                 }}
                 className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                   planSearchQuery === chip 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                 }`}
               >
                 {chip}
               </button>
             ))}
          </div>

          <Tabs value={planCategory} onValueChange={setPlanCategory} className="flex-1 flex flex-col">
            <TabsList className="flex bg-slate-100/50 p-1 rounded-[18px] gap-1 mb-4 h-11 shrink-0 w-full overflow-x-auto no-scrollbar justify-start">
              {getProviderTabs(selectedOperator).map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="px-4 rounded-[14px] text-[9px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-md transition-all h-full shrink-0"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={planCategory} className="mt-0 w-full">
              <div className="grid gap-3 pr-1 pb-2 w-full">
                {plans.filter(plan => planCategory === 'all' || matchesCategory(plan, planCategory))
                    .filter(plan => 
                      plan.amount.toString().includes(planSearchQuery) || 
                      plan.description.toLowerCase().includes(planSearchQuery.toLowerCase()) ||
                      plan.validity.toLowerCase().includes(planSearchQuery.toLowerCase())
                    ).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-30 w-full">
                       <Search className="w-8 h-8 mb-2" />
                       <p className="text-[9px] font-black uppercase tracking-widest">No Plans Available</p>
                    </div>
                ) : plans
                    .filter(plan => planCategory === 'all' || matchesCategory(plan, planCategory))
                    .filter(plan => 
                      plan.amount.toString().includes(planSearchQuery) || 
                      plan.description.toLowerCase().includes(planSearchQuery.toLowerCase()) ||
                      plan.validity.toLowerCase().includes(planSearchQuery.toLowerCase())
                    )
                    .map((plan, idx) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handlePlanSelect(plan)}
                    className="p-5 rounded-[28px] border-2 border-slate-100 bg-white hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98] w-full relative overflow-hidden"
                  >
                    {/* Top Highlights Banner */}
                    {(() => {
                      const lowerDesc = plan.description.toLowerCase();
                      let highlightText = "";
                      let highlightClass = "";
                      
                      if (lowerDesc.includes('hotstar')) {
                        highlightText = "Disney+ Hotstar Included";
                        highlightClass = "from-teal-500 to-emerald-500";
                      } else if (lowerDesc.includes('prime') || lowerDesc.includes('amazon')) {
                        highlightText = "Amazon Prime Video Included";
                        highlightClass = "from-sky-500 to-blue-500";
                      } else if (lowerDesc.includes('netflix')) {
                        highlightText = "Netflix Included";
                        highlightClass = "from-red-600 to-rose-700";
                      } else if (lowerDesc.includes('5g') || lowerDesc.includes('true 5g')) {
                        highlightText = "True 5G Unlimited Data";
                        highlightClass = "from-blue-600 to-indigo-600 shadow-sm";
                      } else if (lowerDesc.includes('binge all night') || lowerDesc.includes('binge')) {
                        highlightText = "Binge All Night Included";
                        highlightClass = "from-amber-500 to-orange-600";
                      } else if (lowerDesc.includes('rollover') || lowerDesc.includes('weekend data')) {
                        highlightText = "Weekend Data Rollover";
                        highlightClass = "from-green-500 to-emerald-600";
                      }

                      if (highlightText) {
                        return (
                          <div className={`bg-gradient-to-r ${highlightClass} text-white text-[8px] font-black uppercase tracking-wider px-3 py-1 rounded-[10px] w-fit mb-3 shadow-sm`}>
                            {highlightText}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">₹{plan.amount}</span>
                        </div>
                        <span className="text-[9px] font-black text-blue-600 mt-1 uppercase tracking-widest">{plan.validity}</span>
                      </div>
                      <div className="w-7 h-7 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-slate-500 font-medium leading-normal line-clamp-2 mb-2">{plan.description}</p>
                    
                    {/* Render Benefits row */}
                    {(() => {
                      const benefits = getPlanBenefits(plan.description);
                      if (benefits.length > 0) {
                        return (
                          <div className="flex items-center gap-1.5 mt-3 bg-slate-50/50 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit border border-slate-100/50 shadow-sm">
                            {benefits.map((b, bIdx) => (
                              <div key={bIdx} title={b.name} className="hover:scale-115 active:scale-95 transition-transform duration-200 cursor-pointer">
                                {b.icon}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-700 pt-3 overflow-hidden h-full w-full">
      {/* 1. Self Number Box at the very top (compact banner) */}
      {profile?.phone && (() => {
        return (
          <div className="shrink-0 w-full animate-in fade-in duration-500 px-1">
            <div
              onClick={() => handleMobileChange(profile.phone)}
              className="group flex items-center justify-between p-2.5 px-4 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer w-full active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Smartphone className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-800 leading-none truncate">
                    {profile.full_name || user?.user_metadata?.full_name || 'My Number'} (Self)
                  </p>
                  <p className="text-[9px] font-extrabold text-blue-600 mt-1 tracking-wider">{profile.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider shrink-0 select-none">
                Recharge Self <ChevronRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. Main Mobile Number Input Card */}
      <div className="relative group shrink-0 w-full px-1">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[40px] blur-2xl opacity-5 group-focus-within:opacity-10 transition duration-1000"></div>
        <div className="relative bg-white border-2 border-slate-100 rounded-[30px] p-5 focus-within:border-blue-500 transition-all shadow-xl shadow-slate-100/20 w-full">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-1 text-left">Mobile Number</Label>
          <div className="flex items-center gap-4 h-12 w-full">
            <span className="text-2xl font-bold text-slate-400 select-none shrink-0">+91</span>
            <div className="w-px h-6 bg-slate-100 shrink-0" />
            <input
              type="tel"
              maxLength={11} // Accounting for space
              autoFocus
              className="border-none p-0 h-full text-2xl font-bold tracking-tight focus:outline-none placeholder:text-slate-100 bg-transparent flex-1 min-w-0"
              placeholder="00000 00000"
              value={mobileNumber}
              onChange={(e) => handleMobileChange(e.target.value)}
            />
            <div className="flex-shrink-0">
              {detecting ? (
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <PrePeSpinner className="h-5 w-5" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenContacts}
                  className="w-10 h-10 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center transition-all active:scale-95 focus:outline-none cursor-pointer border border-blue-100 shadow-sm shadow-blue-50/50"
                  title="Select Contact"
                >
                  <Contact className="h-5 w-5 text-blue-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Instant History horizontal bubbles directly below Mobile Number */}
      {profile?.phone && (() => {
        const selfClean = profile.phone.replace(/\D/g, '').slice(-10);
        const realSelfHistory = recentTransactions
          .filter(t => t.mobile_number && t.mobile_number.replace(/\D/g, '').slice(-10) === selfClean)
          .map(t => ({
            id: t.id,
            amount: t.amount,
            dateStr: t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'
          }));
        
        const selfHistoryList = realSelfHistory.length > 0 ? realSelfHistory : [
          { id: 'self-mock-1', amount: 239, dateStr: '10 May' },
          { id: 'self-mock-2', amount: 299, dateStr: '12 Apr' },
          { id: 'self-mock-3', amount: 749, dateStr: '15 Mar' }
        ];

        return (
          <div className="space-y-2 px-1 shrink-0 w-full animate-in fade-in">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1 text-left">Instant History</p>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {selfHistoryList.map((hTxn) => (
                <div 
                  key={hTxn.id}
                  onClick={() => {
                    handleMobileChange(profile.phone);
                    setAmount(hTxn.amount.toString());
                    setSelectedPlan({
                      id: 'custom',
                      amount: hTxn.amount,
                      validity: 'As per operator',
                      description: 'Repeat Recharge',
                      category: 'custom'
                    } as any);
                    setTimeout(() => setStep('details'), 100);
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-xl hover:border-blue-300 transition-all cursor-pointer active:scale-95 shrink-0 shadow-3xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-black text-slate-800 leading-none">₹{hTxn.amount}</span>
                    <span className="text-[8px] font-extrabold text-slate-400 uppercase mt-0.5">{hTxn.dateStr}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* 4. Filtered Recent Transactions at the bottom */}
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden w-full px-1">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 shrink-0 text-left">Recent Transactions</h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar pb-6 w-full">
          {(() => {
            const filteredRecentTxns = recentTransactions.filter(txn => {
              if (!profile?.phone) return true;
              const selfClean = profile.phone.replace(/\D/g, '').slice(-10);
              const txnClean = txn.mobile_number.replace(/\D/g, '').slice(-10);
              return txnClean !== selfClean;
            });

            const displayRecentTxns = filteredRecentTxns.length > 0 ? filteredRecentTxns : [
              { id: 'm1', mobile_number: '8668075429', amount: 239 },
              { id: 'm2', mobile_number: '9876543210', amount: 299 },
              { id: 'm3', mobile_number: '9123456789', amount: 749 }
            ].filter(txn => {
              if (!profile?.phone) return true;
              const selfClean = profile.phone.replace(/\D/g, '').slice(-10);
              const txnClean = txn.mobile_number.replace(/\D/g, '').slice(-10);
              return txnClean !== selfClean;
            });

            if (displayRecentTxns.length === 0) {
              return (
                <div className="text-center py-6 opacity-30">
                  <p className="text-[9px] font-black uppercase tracking-widest">No other recent recharges</p>
                </div>
              );
            }

            return displayRecentTxns.map((txn) => (
              <div
                key={txn.id}
                onClick={() => handleMobileChange(txn.mobile_number)}
                className="group flex items-center gap-5 p-5 bg-white border border-slate-100 rounded-[28px] hover:border-blue-200 hover:shadow-xl transition-all cursor-pointer w-full active:scale-[0.99]"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-[18px] flex items-center justify-center text-xl font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                  {txn.mobile_number.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-lg font-black text-slate-800 tracking-tight leading-none truncate">{txn.mobile_number}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">₹{txn.amount}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-blue-600 transition-all shrink-0" />
              </div>
            ));
          })()}
        </div>
      </div>

      <KYCNudgeDialog isOpen={showKYCNudge} onClose={() => setShowKYCNudge(false)} featureName="Recharge" />

      {/* Auto-Topup QR Dialog for Desktop */}
      <Dialog open={showTopupQr} onOpenChange={(open) => {
        if (!open) {
          setShowTopupQr(false);
          setIsTopupFlow(false);
          setProcessing(false);
        }
      }}>
        <DialogContent className="max-w-xs rounded-[32px] p-8">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-black">Scan to Pay</DialogTitle>
            <DialogDescription className="font-bold text-slate-400">
              ₹{shortfall.toFixed(2)} shortfall for recharge
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className="bg-slate-50 p-4 rounded-[28px] border-2 border-dashed border-slate-200">
              <div className="bg-white p-3 rounded-2xl shadow-sm">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(intentUrl)}`}
                  alt="UPI QR Code"
                  className="w-40 h-40"
                />
              </div>
            </div>
            
            <div className="space-y-1 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">VPA ID</p>
              <p className="text-sm font-black text-emerald-600 select-all">{upiVpa}</p>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
              <PrePeSpinner className="h-3 w-3" />
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-tight">Waiting for payment...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Assistant Glassmorphic Overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-between p-6 bg-slate-950/95 backdrop-blur-xl text-white select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20">
                  <div className="absolute inset-0 w-full h-full bg-blue-500 rounded-full animate-ping opacity-30" />
                  <Mic className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-200">PrePe Voice Assistant</h3>
                  <p className="text-[10px] font-bold text-slate-400">
                    Listening in {listeningLang === 'en-IN' ? 'English / Tanglish' : 'தமிழ் (Tamil)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (speechRecognitionInstance) {
                    try { speechRecognitionInstance.abort(); } catch(e){}
                  }
                  setIsListening(false);
                }}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Central Animated Waveform & Live Transcript */}
            <div className="flex flex-col items-center justify-center flex-1 py-12 max-w-md mx-auto w-full text-center space-y-12">
              {/* pulsing audio wave sphere */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-32 h-32 rounded-full border-2 border-blue-500/30"
                />
                <motion.div
                  animate={{ scale: [1, 1.35, 1] }}
                  transition={{ duration: 1.5, delay: 0.3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-24 h-24 rounded-full border border-indigo-500/40 bg-gradient-to-br from-blue-600/10 to-indigo-600/10"
                />
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                  {/* Bouncing audio bars visualizer instead of static Mic icon when voice is on */}
                  <div className="flex items-end gap-1 h-6 select-none shrink-0">
                    <span className="w-1 bg-white rounded-full animate-[bounce_0.6s_infinite] h-3" />
                    <span className="w-1 bg-white rounded-full animate-[bounce_0.4s_infinite] h-6" />
                    <span className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite] h-4" />
                    <span className="w-1 bg-white rounded-full animate-[bounce_0.5s_infinite] h-5" />
                    <span className="w-1 bg-white rounded-full animate-[bounce_0.7s_infinite] h-3.5" />
                  </div>
                </div>
              </div>

              {/* Dynamic Transcription Box */}
              <div className="space-y-6 w-full px-4 flex flex-col items-center">
                {voiceError ? (
                  <div className="space-y-4 w-full flex flex-col items-center animate-in zoom-in-95 duration-200">
                    <p className="text-sm font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-2xl text-center w-full">
                      {voiceError}
                    </p>
                    <button
                      type="button"
                      onClick={startVoiceListening}
                      className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-md shadow-blue-500/25 active:scale-95 hover:scale-105"
                    >
                      Tap to Retry Listening
                    </button>
                  </div>
                ) : voiceSuccessMessage ? (
                  <div className="space-y-2 animate-in zoom-in-95 duration-200">
                    <p className="text-md font-black text-emerald-400">{voiceSuccessMessage}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Navigating to checkout...</p>
                  </div>
                ) : (
                  <p className="text-2xl font-extrabold tracking-tight text-white/90 leading-snug min-h-[4rem] text-center">
                    {voiceTranscript || <span className="text-white/40">"I want 1.5 GB data booster..."</span>}
                  </p>
                )}

                {/* Fallback Manual Query Input for Resiliency */}
                <div className="w-full max-w-sm mt-4 animate-in fade-in duration-500">
                  <div className="relative bg-white/5 border border-white/10 rounded-2xl p-1.5 focus-within:border-blue-500 transition-all flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Or type here (e.g. 1GB data booster)"
                      className="flex-1 bg-transparent border-none focus:outline-none px-3 py-2 text-sm text-white placeholder:text-white/30"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val.trim()) {
                            processSpeechResult(val);
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const container = e.currentTarget.parentElement;
                        const input = container?.querySelector('input');
                        if (input && input.value.trim()) {
                          processSpeechResult(input.value);
                        }
                      }}
                      className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-black transition-colors"
                    >
                      SUBMIT
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom visual hint banner (multilingual) */}
            <div className="w-full max-w-sm mx-auto bg-white/5 border border-white/10 rounded-3xl p-5 mb-4 animate-in slide-in-from-bottom-5 duration-300">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 text-center">Examples of what you can say</p>
              <div className="space-y-2.5 text-xs text-slate-300 font-bold">
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-black text-blue-400 uppercase bg-blue-500/15 px-1.5 py-0.5 rounded">Eng</span>
                  <p className="leading-relaxed">"I want to 1 GB Data for today"</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-black text-indigo-400 uppercase bg-indigo-500/15 px-1.5 py-0.5 rounded">Tamil</span>
                  <p className="leading-relaxed">"ஒரு வருட அன்லிமிடெட் பிளான் போடுங்க"</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/15 px-1.5 py-0.5 rounded">Tang</span>
                  <p className="leading-relaxed">"Enaku 1.5 GB unlimited pack podunga"</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}