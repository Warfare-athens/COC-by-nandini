import Header from "@/app/components/Header";
import OrderTracker from "@/app/components/OrderTracker";
import "./tracking.css";

export default async function TrackOrderPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const query = await searchParams;
  return <main><Header/><section className="tracking-page"><span className="eyebrow">ORDER JOURNEY</span><h1>Track your <i>Carnival edit</i></h1><p>Enter your order number and checkout email to see every delivery update. No account is required.</p><OrderTracker initialOrderNumber={query.order || ""}/></section></main>;
}
