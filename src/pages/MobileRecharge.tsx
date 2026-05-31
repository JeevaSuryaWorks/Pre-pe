import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { MobileRechargeForm } from '@/components/recharge/MobileRechargeForm';

const MobileRechargePage = () => {
  const [currentStep, setCurrentStep] = useState<'number' | 'details' | 'confirm' | 'result'>('number');

  return (
    <Layout title="Mobile Recharge" showBack={currentStep !== 'confirm' && currentStep !== 'result'}>
      <div className="px-4 py-4 w-full max-w-full box-border">
        <MobileRechargeForm onStepChange={setCurrentStep} />
      </div>
    </Layout>
  );
};

export default MobileRechargePage;
