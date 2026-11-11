import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { confirmOrder, createPaymentIntent, formatBaht } from '../api/backend';
import { useAuth } from '../auth/AuthContext';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ address, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const { session } = useAuth();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function pay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!address.trim()) {
      setError('กรุณากรอกที่อยู่จัดส่ง');
      return;
    }
    setBusy(true);
    setError(null);

    // ยืนยันการจ่ายกับ Stripe โดยตรง ข้อมูลบัตรไม่ผ่าน server ของเรา
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    if (stripeError) {
      setError(stripeError.message);
      setBusy(false);
      return;
    }

    // ให้ server ตรวจกับ Stripe อีกครั้งแล้วบันทึกคำสั่งซื้อ
    try {
      const data = await confirmOrder(session.token, {
        paymentIntentId: paymentIntent.id,
        address,
      });
      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={pay} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={!stripe || busy}
              className="w-full rounded-md bg-red-600 py-2 font-semibold text-white disabled:bg-slate-300">
        {busy ? 'กำลังดำเนินการ...' : 'ชำระเงิน'}
      </button>
    </form>
  );
}

export default function Checkout() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [clientSecret, setClientSecret] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // ขอ PaymentIntent ตั้งแต่เข้าหน้า ยอดคำนวณจากตะกร้าใน server
  useEffect(() => {
    let ignore = false;
    createPaymentIntent(session.token)
      .then((d) => { if (!ignore) setClientSecret(d.clientSecret); })
      .catch((e) => { if (!ignore) setError(e.message); });
    return () => { ignore = true; };
  }, [session.token]);

  if (result) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-green-700">ชำระเงินสำเร็จ</h1>
        <p className="mt-2 text-slate-600">หมายเลขคำสั่งซื้อ #{result.orderId}</p>
        <p className="mt-1 text-xl font-bold text-red-600">{formatBaht(result.totalSatang)}</p>
        <button onClick={() => navigate('/')}
                className="mt-6 rounded-md bg-red-600 px-4 py-2 text-white">
          กลับหน้าแรก
        </button>
      </div>
    );
  }

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!clientSecret) return <p className="p-10 text-center text-slate-400">กำลังเตรียมการชำระเงิน...</p>;

  const input = 'w-full rounded-md border border-slate-300 px-3 py-2 focus:border-red-500 focus:outline-none';

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">ชำระเงิน</h1>
      <p className="mt-1 text-sm text-slate-500">บัตรทดสอบ 4242 4242 4242 4242 วันหมดอายุในอนาคต CVC ใดก็ได้</p>
      <div className="mt-6 space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <textarea className={input} rows={3} placeholder="ที่อยู่จัดส่ง"
                  value={address} onChange={(e) => setAddress(e.target.value)} />
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm address={address} onSuccess={setResult} />
        </Elements>
      </div>
    </div>
  );
}