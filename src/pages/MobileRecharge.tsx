import { Layout } from '@/components/layout/Layout';
import { MobileRechargeForm } from '@/components/recharge/MobileRechargeForm';

const MobileRechargePage = () => {
  return (
    <Layout title="Mobile Recharge">
      <div className="px-4 py-4 w-full max-w-full box-border">
        <MobileRechargeForm />
      </div>
    </Layout>
  );
};

export default MobileRechargePage;
