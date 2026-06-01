import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { MobileRechargeForm } from '@/components/recharge/MobileRechargeForm';
import { useNavigate } from 'react-router-dom';

const MobileRechargePage = () => {
  const [currentStep, setCurrentStep] = useState<'number' | 'details' | 'confirm' | 'result'>('number');
  const navigate = useNavigate();

  const handleBack = () => {
    if (currentStep === 'confirm') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      setCurrentStep('number');
    } else {
      navigate(-1);
    }
  };

  return (
    <Layout 
      title={currentStep === 'confirm' ? "Order Summary" : "Mobile Recharge"} 
      showBack={currentStep !== 'result'}
      onBack={handleBack}
    >
      <div className="px-4 py-4 w-full max-w-full box-border">
        <MobileRechargeForm 
          step={currentStep} 
          setStep={setCurrentStep} 
        />
      </div>
    </Layout>
  );
};

export default MobileRechargePage;
