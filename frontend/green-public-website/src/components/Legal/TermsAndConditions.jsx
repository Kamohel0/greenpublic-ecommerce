import React from "react";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f8f5f2]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Terms & Conditions
        </h1>
        <p className="text-sm text-gray-500 mb-8">Effective date: 24 February 2026</p>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Overview</h2>
            <p>
              These Terms & Conditions govern your use of Green Public and any purchases made through our website.
              By placing an order, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Orders and Payment</h2>
            <p>
              All orders are subject to availability and payment confirmation. We reserve the right to cancel or
              refuse any order where fraud, pricing errors, or stock issues are identified.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Delivery and Pickup</h2>
            <p>
              Delivery timelines are estimates and may vary based on courier operations. Pickup orders must be
              collected at the selected pickup location during operating hours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Pricing and Shipping Fees</h2>
            <p>
              Product pricing, shipping fees, and promotions are displayed at checkout before payment. Shipping fees
              are included in your final payable total where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Returns and Refunds</h2>
            <p>
              Returns and refunds are handled according to our return policy and applicable consumer protection laws.
              Approved refunds are processed back to the original payment method.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Customer Responsibilities</h2>
            <p>
              You are responsible for providing accurate contact and delivery information. Green Public is not liable
              for delays or non-delivery caused by incorrect details submitted at checkout.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Privacy and Data Use</h2>
            <p>
              We process personal information for order fulfillment, customer support, and operational communication
              in line with applicable data protection requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Contact</h2>
            <p>
              For any questions about these terms, please contact us at
              <span className="font-medium"> support@greenpublic.store</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
