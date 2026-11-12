import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { confirmOrder, createPaymentIntent, formatBaht } from '../api/backend';
import { useAuth } from '../auth/AuthContext';

const stripeKey =
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_51UYNXZC5TFYyiwmA0WRiwvBa3XrkOVUmsKGyezh62R3XXosRvBAr3eozS6Lgx8dNBN8GTawD0WyfvmbvxAZJpQez00fdmo7aUf';
const stripePromise = loadStripe(stripeKey);

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
      setError('กรุณากรอกที่อยู่จัดส่งด้านบนก่อน');
      return;
    }
    setBusy(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message);
      setBusy(false);
      return;
    }

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
      <button
        type="submit"
        disabled={!stripe || busy}
        className="w-full rounded-md bg-red-600 py-2.5 font-semibold text-white hover:bg-red-700 disabled:bg-slate-300"
      >
        {busy ? 'กำลังดำเนินการ...' : 'ยืนยันการชำระเงิน'}
      </button>
    </form>
  );
}

export default function Checkout() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [clientSecret, setClientSecret] = useState(null);
  const [amount, setAmount] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    createPaymentIntent(session.token)
      .then((d) => {
        if (!ignore) {
          setClientSecret(d.clientSecret);
          setAmount(d.amount);
        }
      })
      .catch((e) => {
        if (!ignore) setError(e.message);
      });
    return () => {
      ignore = true;
    };
  }, [session.token]);

  if (result) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-green-600">ชำระเงินสำเร็จ!</h1>
          <p className="mt-2 text-slate-600">หมายเลขคำสั่งซื้อ #{result.orderId}</p>
          <p className="mt-2 text-2xl font-extrabold text-red-600">{formatBaht(result.totalSatang)}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full rounded-md bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700"
          >
            กลับหน้าแรก
          </button>
        </div>
      </div>
    );
  }

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!clientSecret) return <p className="p-10 text-center text-slate-400">กำลังเตรียมระบบชำระเงิน...</p>;

  const input = 'w-full rounded-md border border-slate-300 px-3 py-2 focus:border-red-500 focus:outline-none';

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">ชำระเงิน</h1>
      <p className="mt-1 text-sm text-slate-500">
        ยอดชำระทั้งหมด: <span className="font-bold text-red-600">{formatBaht(amount)}</span>
      </p>

      <div className="mt-6 space-y-5 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">1. ที่อยู่สำหรับจัดส่งสินค้า</label>
          <textarea
            className={input}
            rows={3}
            placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            2. ข้อมูลบัตรเครดิต/เดบิต (ทดสอบ: 4242 4242 4242 4242)
          </label>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm address={address} onSuccess={setResult} />
          </Elements>
        </div>
      </div>
    </div>
  );
}