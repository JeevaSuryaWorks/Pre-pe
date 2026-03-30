
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, Shield, FileCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LegalPageProps {
    title: string;
    type: 'terms' | 'privacy' | 'refund';
}

const LegalPage = ({ title, type }: LegalPageProps) => {
    const navigate = useNavigate();

    const getIcon = () => {
        switch (type) {
            case 'terms': return <FileText className="h-12 w-12 text-blue-500" />;
            case 'privacy': return <Shield className="h-12 w-12 text-green-500" />;
            case 'refund': return <FileCheck className="h-12 w-12 text-orange-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center w-full">
            <div className="w-full max-w-md bg-white min-h-screen relative flex flex-col">
                {/* Header */}
                <div className="bg-white px-4 py-4 flex items-center gap-4 shadow-sm sticky top-0 z-10 border-b border-slate-100">
                    <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 h-10 w-10 text-slate-600" onClick={() => navigate(-1)}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col items-center">
                    <div className="mb-6 p-4 bg-slate-50 rounded-full">
                        {getIcon()}
                    </div>

                    <div className="space-y-4 text-slate-600 leading-relaxed text-sm text-justify">
                        {type === 'terms' && (
                            <div className="space-y-4">
                                <p>
                                    Welcome to <strong>Prepe</strong>! By using our app, you agree to comply with and be bound by the following terms and conditions. Please review them carefully.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">1. Acceptance of Terms</h3>
                                <p>
                                    By accessing and using <strong>Prepe</strong>, you accept and agree to be bound by these terms. If you do not agree, please refrain from using the app.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">2. Use of Cookies</h3>
                                <p>
                                    Our app uses cookies to enhance user experience. By using the app, you consent to the use of cookies in accordance with our Privacy Policy.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">3. Intellectual Property Rights</h3>
                                <p>
                                    Unless otherwise stated, <strong>Prepe</strong> and/or its licensors own the intellectual property rights for all material in the app. All rights are reserved. You may access this material for personal use, subject to restrictions outlined in these terms.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">4. User Comments and Content</h3>
                                <p>
                                    Users may post and exchange opinions and information in certain areas of the app. <strong>Prepe</strong> does not filter, edit, publish, or review Comments prior to their presence in the app. Comments reflect the views of the person who posts them. To the extent permitted by applicable laws, <strong>Prepe</strong> shall not be liable for the Comments or any liability caused by the use of and/or posting of and/or appearance of the Comments in the app.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">5. Hyperlinking to Our Content</h3>
                                <p>The following organizations may link to our app without prior written approval:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Government agencies</li>
                                    <li>Search engines</li>
                                    <li>News organizations</li>
                                    <li>Online directory distributors</li>
                                    <li>System-wide Accredited Businesses</li>
                                </ul>

                                <h3 className="font-bold text-slate-800 mt-4">6. Content Liability</h3>
                                <p>
                                    We shall not be held responsible for any content that appears in the app. No link(s) should appear in any context that may be interpreted as libelous, obscene, or criminal, or which infringes, otherwise violates, or advocates the infringement or other violation of, any third-party rights.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">7. Reservation of Rights</h3>
                                <p>
                                    We reserve the right to request that you remove all links or any particular link to our app. You approve to immediately remove all links to our app upon request. We also reserve the right to amend these terms and conditions and its linking policy at any time.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">8. Disclaimer</h3>
                                <p>
                                    To the maximum extent permitted by applicable law, we exclude all representations, warranties, and conditions relating to our app and the use of this app. Nothing in this disclaimer will:
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Limit or exclude our or your liability for death or personal injury;</li>
                                    <li>Limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
                                    <li>Limit any of our or your liabilities in any way that is not permitted under applicable law;</li>
                                    <li>Exclude any of our or your liabilities that may not be excluded under applicable law.</li>
                                </ul>
                                <p className="mt-2">
                                    The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a) are subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer, including liabilities arising in contract, in tort, and for breach of statutory duty.
                                </p>
                                <p className="mt-2">
                                    As long as the app and the information and services on the app are provided free of charge, we will not be liable for any loss or damage of any nature.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">9. Third-Party Information and Data Use</h3>
                                <p>
                                    We use third-party sources to provide plan details and related information. Before making any recharge, please verify the plan directly with the official operator. We are not responsible for discrepancies, inaccuracies, or delays in third-party information. Your personal data is handled securely and used only to process your transactions, in accordance with our Privacy Policy.
                                </p>
                            </div>
                        )}

                        {type === 'privacy' && (
                            <div className="space-y-4">
                                <p>
                                    At <strong>Prepe</strong>, accessible from <a href="https://pre-pe.com/" className="text-blue-600 underline">https://pre-pe.com/</a>, one of our main priorities is the privacy of our users. This Privacy Policy document outlines the types of information we collect and how we use it.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">Consent</h3>
                                <p>
                                    By using our app, you hereby consent to our Privacy Policy and agree to its terms.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">Information We Collect</h3>
                                <p>
                                    The personal information we collect, and the reasons for collecting it, will be made clear to you at the point we ask for it. This may include:
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Contact information such as name, email address, and phone number.</li>
                                    <li>Details you provide when you contact us directly, including the contents of your messages and attachments.</li>
                                    <li>Information provided during account registration, such as name, company name, address, email address, and telephone number.</li>
                                </ul>

                                <h3 className="font-bold text-slate-800 mt-4">How We Use Your Information</h3>
                                <p>We use the information we collect in various ways, including to:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Provide, operate, and maintain our app.</li>
                                    <li>Improve, personalize, and expand our services.</li>
                                    <li>Understand and analyze how you use our app.</li>
                                    <li>Develop new products, services, features, and functionality.</li>
                                    <li>Communicate with you for customer service, updates, and marketing purposes.</li>
                                    <li>Send you emails.</li>
                                    <li>Find and prevent fraud.</li>
                                </ul>

                                <h3 className="font-bold text-slate-800 mt-4">Log Files</h3>
                                <p>
                                    <strong>Prepe</strong> follows a standard procedure of using log files. These files log visitors when they use the app. The information collected includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. This information is not linked to any personally identifiable information and is used for analyzing trends, administering the app, tracking user's movement, and gathering demographic information.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">Cookies and Web Beacons</h3>
                                <p>
                                    Like many apps, <strong>Prepe</strong> uses 'cookies' to store information including visitor's preferences and the pages accessed or visited. This information is used to optimize the user experience by customizing our content based on visitor's browser type and/or other information.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">Third-Party Privacy Policies</h3>
                                <p>
                                    <strong>Prepe</strong> Privacy Policy does not apply to other advertisers or websites. Thus, we advise you to consult the respective Privacy Policies of these third-party services for more detailed information.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">Children's Information</h3>
                                <p>
                                    Protecting children's privacy is important. <strong>Prepe</strong> does not knowingly collect any personal information from children under the age of 13. If you believe that your child has provided such information, please contact us, and we will make efforts to remove it promptly.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">Contact Us</h3>
                                <p>
                                    If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us through the app or via email at <a href="mailto:connect.prepe@gmail.com" className="text-blue-600 underline">connect.prepe@gmail.com</a>.
                                </p>
                            </div>
                        )}

                        {type === 'refund' && (
                            <div className="space-y-4">
                                <p>
                                    Thank you for choosing <strong>Prepe</strong> for your recharge needs. We aim to provide a seamless and reliable platform for all your mobile and DTH recharge transactions. However, we understand that circumstances may arise where a refund is required. Please take a moment to review our refund policy to ensure clarity and transparency regarding refund procedures.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">Refund Duration</h3>
                                <p>
                                    Refund requests for failed transactions can be initiated within 7 business days from the date of the transaction.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">Conditions for Refunds</h3>
                                <p>
                                    Refunds are strictly issued for failed transactions. Our automated system ensures swift processing of refunds in such instances.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">Refund Request Process</h3>
                                <p>
                                    To request a refund, users may initiate a complaint for the specific transaction or directly reach out to our dedicated support team. Our representatives are committed to assisting you promptly and efficiently.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">Fees and Deductions</h3>
                                <p>
                                    We prioritize transparency in our refund process. Rest assured, there are no additional fees or deductions associated with refunds. The entire transaction amount will be refunded to your original payment method.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">Modes of Refund</h3>
                                <p>
                                    Refunds will be credited back to the original payment method utilized for the transaction. We value your trust and strive to ensure a seamless experience throughout the refund process.
                                </p>

                                <h3 className="font-bold text-slate-800 mt-4">Automatic Refunds</h3>
                                <p>
                                    If your payment fails and we could not process your order from our end, you will receive a full refund automatically to the source account after 5-8 business days.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalPage;
