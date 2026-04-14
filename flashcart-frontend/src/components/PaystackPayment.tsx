"use client";

import { PaystackButton } from 'react-paystack';

interface PaystackPaymentProps {
  orderId: string;
  email: string;
  amount: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

// Define the response type
interface PaystackResponse {
  reference: string;
  status: string;
  message: string;
  transaction: string;
  trxref: string;
}

export default function PaystackPayment({ 
  orderId, 
  email, 
  amount, 
  onSuccess, 
  onClose 
}: PaystackPaymentProps) {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

  const componentProps = {
    email,
    amount: amount * 100, // Paystack expects amount in kobo/cent
    metadata: {
      custom_fields: [
        {
          display_name: "Order ID",
          variable_name: "order_id",
          value: orderId,
        }
      ]
    },
    publicKey,
    text: "Pay Now",
    onSuccess: (response: PaystackResponse) => {
      console.log('Payment successful:', response);
      onSuccess(response.reference);
    },
    onClose: () => {
      console.log('Payment modal closed');
      onClose();
    },
  };

  return (
    <div className="mt-4">
      <PaystackButton 
        {...componentProps} 
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
      />
    </div>
  );
}